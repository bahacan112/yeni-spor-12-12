ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_tenants_gallery_images ON tenants USING GIN (gallery_images);
