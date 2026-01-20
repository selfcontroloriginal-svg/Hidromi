/*
  # Remove content table and add sales functionality

  1. New Tables
    - sales
      - id (uuid, primary key)
      - client_id (uuid, references customers)
      - product_id (uuid, references products)
      - observations (text)
      - total_value (numeric)
      - created_at (timestamp)
      - vendor_id (uuid, references profiles)

  2. Security
    - Enable RLS on sales table
    - Add policies for authenticated users
*/

DROP TABLE IF EXISTS content;

CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES customers NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  observations text,
  total_value numeric NOT NULL CHECK (total_value >= 0),
  created_at timestamptz DEFAULT now(),
  vendor_id uuid REFERENCES profiles
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales are viewable by authenticated users"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales can be managed by authenticated users"
  ON sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);