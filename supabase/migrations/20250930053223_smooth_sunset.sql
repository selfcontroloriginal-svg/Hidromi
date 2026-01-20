/*
  # Create visits table

  1. New Tables
    - `visits`
      - `id` (uuid, primary key)
      - `client_name` (text)
      - `client_id` (uuid, references customers)
      - `vendor_id` (uuid, references profiles)
      - `scheduled_date` (timestamptz)
      - `status` (text)
      - `notes` (text)
      - `follow_up_date` (timestamptz)
      - `rejection_reason` (text)
      - `maintenance_type` (text)
      - `location` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Disable RLS to match other tables
*/

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_id uuid REFERENCES customers(id),
  vendor_id uuid REFERENCES profiles(id),
  scheduled_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text DEFAULT '',
  follow_up_date timestamptz,
  rejection_reason text,
  maintenance_type text,
  location text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS to match other tables configuration
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;