/*
  # Add Transaction Files Support

  1. New Tables
    - `transaction_files`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, foreign key)
      - `name` (text)
      - `url` (text)
      - `type` (text)
      - `size` (bigint)
      - `path` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create transaction_files table
CREATE TABLE IF NOT EXISTS transaction_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  size bigint NOT NULL,
  path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_files_transaction_id ON transaction_files(transaction_id);

-- Enable RLS
ALTER TABLE transaction_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view transaction files"
  ON transaction_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert transaction files"
  ON transaction_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their transaction files"
  ON transaction_files
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_files.transaction_id
  ));

CREATE POLICY "Users can delete their transaction files"
  ON transaction_files
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_files.transaction_id
  ));

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transaction_files_updated_at
  BEFORE UPDATE ON transaction_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE transaction_files IS 'Stores files attached to transactions';