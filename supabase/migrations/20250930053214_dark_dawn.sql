/*
  # Add image_url column to products table

  1. Changes
    - Add `image_url` column to `products` table for storing Base64 images
    - Column allows storing Base64 image data from uploads
    - Column is nullable to support existing products without images

  This enables proper image storage via upload for products.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;