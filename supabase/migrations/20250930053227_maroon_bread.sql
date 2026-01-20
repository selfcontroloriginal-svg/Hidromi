/*
  # Create financial_transactions table

  1. New Tables
    - `financial_transactions`
      - `id` (uuid, primary key)
      - `type` (text, 'entrada' or 'saida')
      - `category` (text)
      - `description` (text)
      - `amount` (numeric)
      - `date` (text)
      - `payment_method` (text)
      - `reference_id` (text)
      - `reference_type` (text)
      - `vendor_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Disable RLS to match other tables
*/

CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  date text NOT NULL,
  payment_method text NOT NULL,
  reference_id text,
  reference_type text,
  vendor_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS to match other tables configuration
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;