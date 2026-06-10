-- ============================================================================
-- Supabase Storage bucket for product images.
--
-- Layout (tenant-scoped paths, enforced by the upload route handler):
--   product-images/restaurants/{restaurant_id}/products/{random}.{ext}
--
-- Access model:
--   * READ is public — product photos appear on the public QR menu, so the
--     bucket is marked public and files are served via their public URL.
--     Paths contain only non-sensitive ids.
--   * WRITE is service-role only. Uploads go through
--     POST /api/restaurant/products/upload-image, which authenticates the
--     owner, derives restaurant_id from the session (never from the client),
--     validates type/size/magic bytes and generates the storage path itself.
--     No storage RLS policies for anon/authenticated exist on purpose: with
--     no policy, direct uploads with the publishable key are denied.
--
-- 5 MB limit and the allowed mime types are enforced both here (bucket
-- metadata) and in the route handler.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
