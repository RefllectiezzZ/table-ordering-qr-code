import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "product-images";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sniffs the real content type from magic bytes — the client-declared
 * Content-Type is never trusted on its own.
 */
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
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Product image upload (owner only).
 *
 * Tenant safety: the storage path is built server-side from the OWNER'S
 * restaurant_id (derived from the session, never from the request) plus a
 * random file name, so one restaurant can never address or overwrite another
 * restaurant's images. The bucket has no anon/authenticated write policies;
 * only this validated route (service role) can write.
 *
 * Validation: <= 5 MB; JPEG/PNG/WebP only, verified by magic bytes.
 */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

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
    return NextResponse.json(
      { error: "The image is larger than 5 MB" },
      { status: 413 },
    );
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
  const path = `restaurants/${auth.restaurantId}/products/${crypto.randomUUID()}.${extension}`;

  const service = createServiceRoleSupabaseClient();
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (uploadError) {
    console.error("product_image_upload_failed", uploadError.message);
    return NextResponse.json(
      {
        error:
          "Could not store the image. Confirm the product-images bucket exists (see supabase/migrations).",
      },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = service.storage.from(BUCKET).getPublicUrl(path);

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "product_image.uploaded",
    entityType: "storage_object",
    metadata: { path, content_type: contentType, bytes: file.size },
  });

  return NextResponse.json({ url: publicUrl, path }, { status: 201 });
}
