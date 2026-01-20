/*
  # Create quotations table

  1. New Tables
    - `quotations`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references customers)
      - `vendor_id` (uuid, references profiles)
      - `items` (jsonb)
      - `total_value` (numeric)
      - `status` (text)
      - `valid_until` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Disable RLS to match other tables
*/

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES customers(id),
  vendor_id uuid REFERENCES profiles(id),
  items jsonb DEFAULT '[]'::jsonb,
  total_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  valid_until text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS to match other tables configuration
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;