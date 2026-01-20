/*
  # Fix customers table RLS policies

  1. Security Updates
    - Update INSERT policy to allow authenticated users to create customers
    - Update UPDATE policy to allow authenticated users to update customers
    - Ensure DELETE policy allows authenticated users to delete customers

  This fixes the "new row violates row-level security policy" error by properly
  configuring the RLS policies for the customers table.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can be managed by authenticated users" ON customers;
DROP POLICY IF EXISTS "Customers are viewable by authenticated users" ON customers;

-- Create comprehensive policies for customers table
CREATE POLICY "Customers can be viewed by authenticated users"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can be created by authenticated users"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Customers can be updated by authenticated users"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Customers can be deleted by authenticated users"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);