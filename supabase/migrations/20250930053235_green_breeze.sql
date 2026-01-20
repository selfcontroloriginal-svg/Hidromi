/*
  # Create maintenances table

  1. New Tables
    - `maintenances`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references customers)
      - `client_name` (text)
      - `client_phone` (text)
      - `product_name` (text)
      - `maintenance_type` (text)
      - `scheduled_date` (text)
      - `status` (text)
      - `notes` (text)
      - `vendor_id` (uuid, references profiles)
      - `vendor_name` (text)
      - `completed_at` (text)
      - `next_maintenance_date` (text)
      - `created_at` (timestamptz)

  2. Security
    - Disable RLS to match other tables
*/

CREATE TABLE IF NOT EXISTS maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES customers(id),
  client_name text NOT NULL,
  client_phone text,
  product_name text NOT NULL,
  maintenance_type text NOT NULL,
  scheduled_date text NOT NULL,
  status text NOT NULL DEFAULT 'agendado',
  notes text DEFAULT '',
  vendor_id uuid REFERENCES profiles(id),
  vendor_name text NOT NULL,
  completed_at text,
  next_maintenance_date text,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS to match other tables configuration
ALTER TABLE maintenances DISABLE ROW LEVEL SECURITY;