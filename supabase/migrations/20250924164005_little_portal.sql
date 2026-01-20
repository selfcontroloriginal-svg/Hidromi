/*
  # Add image_url column to products table

  1. Changes
    - Add `image_url` column to `products` table to store product images
    - Column supports both Base64 data and external URLs
    - Column is nullable to support existing products

  This enables proper image storage and display for products.
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