/*
  # Add image_url column to products table

  1. Changes
    - Add `image_url` column to `products` table
    - Column allows storing Base64 image data or external URLs
    - Column is nullable to support existing products without images

  This migration adds the missing image_url column that the application expects
  for storing product images.
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