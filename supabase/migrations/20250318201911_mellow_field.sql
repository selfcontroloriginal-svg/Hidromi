/*
  # Initial Schema Setup

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - role (text, either 'admin' or 'vendor')
      - full_name (text)
      - created_at (timestamp)
    
    - products
      - id (uuid)
      - name (text)
      - description (text)
      - price (numeric)
      - stock_quantity (integer)
      - created_at (timestamp)
      
    - services
      - id (uuid)
      - name (text)
      - description (text)
      - price (numeric)
      - created_at (timestamp)
      
    - customers
      - id (uuid)
      - name (text)
      - email (text)
      - phone (text)
      - created_at (timestamp)
      
    - bank_accounts
      - id (uuid)
      - name (text)
      - account_number (text)
      - balance (numeric)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and vendor access
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'vendor')),
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_number text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles can be created by authenticated users" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create policies for products
CREATE POLICY "Products are viewable by authenticated users" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Products can be managed by admins" ON products
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Create policies for services
CREATE POLICY "Services are viewable by authenticated users" ON services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Services can be managed by admins" ON services
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Create policies for customers
CREATE POLICY "Customers are viewable by authenticated users" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Customers can be managed by authenticated users" ON customers
  FOR ALL TO authenticated USING (true);

-- Create policies for bank_accounts
CREATE POLICY "Bank accounts are viewable by admins" ON bank_accounts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Bank accounts can be managed by admins" ON bank_accounts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));