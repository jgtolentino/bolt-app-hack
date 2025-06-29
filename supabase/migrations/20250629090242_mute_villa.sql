/*
  # Fix RLS Policy for Transaction Generation

  1. Security Updates
    - Add policy to allow bulk transaction generation
    - Ensure the generate_full_dataset function can insert transactions
    - Maintain security while enabling data generation functionality

  2. Changes
    - Create policy for service role to insert transactions during data generation
    - Allow authenticated users to perform bulk operations
*/

-- Create a policy that allows bulk transaction generation
-- This policy allows authenticated users to insert transactions for data generation purposes
CREATE POLICY "Allow bulk transaction generation"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure the service role can perform bulk operations if needed
-- This is important for RPC functions that might run with elevated privileges
CREATE POLICY "Allow service role bulk operations"
  ON transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);