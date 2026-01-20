/*
  # Create sales_complete table

  1. New Tables
    - `sales_complete`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references customers)
      - `vendor_id` (uuid, references profiles)
      - `items` (jsonb, array of sale items)
      - `subtotal` (numeric)
      - `discount` (numeric)
      - `total` (numeric)
      - `payment_method` (text)
      - `installments` (integer)
      - `observations` (text)
      - `status` (text)
      - `sale_date` (text)
      - `created_at` (timestamp)

  2. Security
    - Disable RLS for now to match other tables
*/

CREATE TABLE IF NOT EXISTS sales_complete (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES customers(id),
  vendor_id uuid REFERENCES profiles(id),
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'money',
  installments integer NOT NULL DEFAULT 1,
  observations text DEFAULT '',
  status text NOT NULL DEFAULT 'completed',
  sale_date text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS to match other tables configuration
ALTER TABLE sales_complete DISABLE ROW LEVEL SECURITY;