/*
  # Create users tables

  1. New Tables
    - `users` - основная таблица пользователей
      - `id` (uuid, primary key) - ID пользователя из Firebase Auth
      - `email` (text) - Email пользователя
      - `display_name` (text) - Отображаемое имя
      - `role` (text) - Роль пользователя (admin, employee, user)
      - `created_at` (timestamptz) - Дата создания
      - `updated_at` (timestamptz) - Дата обновления
    
    - `user_roles` - таблица ролей
      - `id` (uuid, primary key)
      - `name` (text) - Название роли
      - `description` (text) - Описание роли

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Anyone can read roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Insert default roles
INSERT INTO user_roles (name, description) VALUES
  ('admin', 'Администратор системы'),
  ('employee', 'Сотрудник'),
  ('user', 'Обычный пользователь')
ON CONFLICT (name) DO NOTHING;