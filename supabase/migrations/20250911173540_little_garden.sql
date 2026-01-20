/*
  # Fix customers table RLS policies for INSERT operations

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows authenticated users to create customers
    - Ensure the policy works with the current authentication system

  This migration specifically addresses the "new row violates row-level security policy" error
  by creating a proper INSERT policy for the customers table.
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Customers can be created by authenticated users" ON customers;

-- Create a new INSERT policy that allows authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy allows reading customers
DROP POLICY IF EXISTS "Customers can be viewed by authenticated users" ON customers;
CREATE POLICY "Allow authenticated users to view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the UPDATE policy allows updating customers
DROP POLICY IF EXISTS "Customers can be updated by authenticated users" ON customers;
CREATE POLICY "Allow authenticated users to update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the DELETE policy allows deleting customers
DROP POLICY IF EXISTS "Customers can be deleted by authenticated users" ON customers;
CREATE POLICY "Allow authenticated users to delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);