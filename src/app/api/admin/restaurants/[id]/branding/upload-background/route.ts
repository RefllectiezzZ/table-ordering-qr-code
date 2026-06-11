import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "restaurant-branding";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sniffImageType(bytes: Uint8Array): keyof typeof ALLOWED_TYPES | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Public menu background upload (platform admin only).
 * Path: restaurant-branding/restaurants/{restaurant_id}/branding/background-{uuid}.ext
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const { id: restaurantId } = await context.params;

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "The image is larger than 5 MB" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffImageType(bytes);
  if (!contentType) {
    return NextResponse.json(
      { error: "Only JPEG, PNG or WebP images are accepted" },
      { status: 415 },
    );
  }

  const extension = ALLOWED_TYPES[contentType];
  const path = `restaurants/${restaurantId}/branding/background-${crypto.randomUUID()}.${extension}`;

  const service = createServiceRoleSupabaseClient();
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (uploadError) {
    console.error("branding_background_upload_failed", uploadError.message);
    return NextResponse.json(
      {
        error:
          "Could not store the image. Confirm the restaurant-branding bucket exists (see supabase/migrations).",
      },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = service.storage.from(BUCKET).getPublicUrl(path);

  await logAudit({
    restaurantId,
    actorUserId: auth.userId,
    action: "branding_background.uploaded",
    entityType: "storage_object",
    metadata: { path, content_type: contentType, bytes: file.size, admin: true },
  });

  return NextResponse.json({ url: publicUrl, path }, { status: 201 });
}
