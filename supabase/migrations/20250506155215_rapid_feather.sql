/*
  # Add company information table

  1. New Tables
    - company_info
      - id (uuid, primary key)
      - name (text)
      - cnpj (text)
      - address (text)
      - phone (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on company_info table
    - Add policies for authenticated users
*/

CREATE TABLE company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company info is viewable by authenticated users"
  ON company_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Company info can be managed by admins"
  ON company_info FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));