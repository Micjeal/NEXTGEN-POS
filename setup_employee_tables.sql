-- Complete setup for employee tables: schema + seed data
-- Run this script to create tables and populate with sample data

-- =============================================
-- EMPLOYEE TABLES SCHEMA
-- =============================================

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  hire_date DATE NOT NULL,
  termination_date DATE,
  designation TEXT NOT NULL,
  department TEXT,
  branch_id UUID REFERENCES branches(id),
  manager_id UUID REFERENCES employees(id),
  salary DECIMAL(12,2),
  hourly_rate DECIMAL(8,2),
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
  is_active BOOLEAN DEFAULT TRUE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bank_account_number TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Shifts table
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, shift_date, start_time)
);

-- Employee Performance table
CREATE TABLE IF NOT EXISTS employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id),
  rating DECIMAL(3,1) CHECK (rating >= 1.0 AND rating <= 5.0),
  goals_achievement DECIMAL(5,2),
  customer_satisfaction DECIMAL(3,1),
  sales_performance DECIMAL(5,2),
  punctuality DECIMAL(3,1),
  teamwork DECIMAL(3,1),
  comments TEXT,
  improvement_areas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_date ON employee_shifts(employee_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_branch_date ON employee_shifts(branch_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_performance_employee ON employee_performance(employee_id);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "employees_manage" ON employees FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "employee_shifts_select" ON employee_shifts FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "employee_shifts_manage" ON employee_shifts FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "employee_performance_select" ON employee_performance FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "employee_performance_manage" ON employee_performance FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- =============================================
-- SEED DATA
-- =============================================

-- Insert sample employees
INSERT INTO employees (
  employee_id, first_name, last_name, email, phone, date_of_birth, gender,
  address, city, hire_date, designation, department, branch_id, salary,
  hourly_rate, employment_type, is_active, emergency_contact_name,
  emergency_contact_phone, created_at, updated_at
) VALUES
  ('EMP001', 'John', 'Doe', 'john.doe@supermarket.com', '+256700123456', '1985-03-15', 'male',
   '123 Main St', 'Kampala', '2020-01-15', 'Cashier', 'Sales', (SELECT id FROM branches LIMIT 1), 2500000.00,
   15000.00, 'full_time', true, 'Jane Doe', '+256700123457', NOW(), NOW()),

  ('EMP002', 'Sarah', 'Johnson', 'sarah.johnson@supermarket.com', '+256700123458', '1990-07-22', 'female',
   '456 Oak Ave', 'Kampala', '2021-03-10', 'Store Manager', 'Management', (SELECT id FROM branches LIMIT 1), 4500000.00,
   25000.00, 'full_time', true, 'Mike Johnson', '+256700123459', NOW(), NOW()),

  ('EMP003', 'David', 'Smith', 'david.smith@supermarket.com', '+256700123460', '1988-11-08', 'male',
   '789 Pine Rd', 'Kampala', '2019-08-20', 'Inventory Clerk', 'Operations', (SELECT id FROM branches LIMIT 1), 2000000.00,
   12000.00, 'full_time', true, 'Lisa Smith', '+256700123461', NOW(), NOW()),

  ('EMP004', 'Mary', 'Williams', 'mary.williams@supermarket.com', '+256700123462', '1992-05-30', 'female',
   '321 Elm St', 'Kampala', '2022-01-05', 'Customer Service', 'Sales', (SELECT id FROM branches LIMIT 1), 1800000.00,
   10000.00, 'part_time', true, 'Tom Williams', '+256700123463', NOW(), NOW()),

  ('EMP005', 'Robert', 'Brown', 'robert.brown@supermarket.com', '+256700123464', '1983-12-12', 'male',
   '654 Cedar Ln', 'Kampala', '2018-06-15', 'Security Guard', 'Security', (SELECT id FROM branches LIMIT 1), 2200000.00,
   13000.00, 'full_time', true, 'Anna Brown', '+256700123465', NOW(), NOW())
ON CONFLICT (employee_id) DO NOTHING;

-- Set manager relationships
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP002') WHERE employee_id IN ('EMP001', 'EMP003', 'EMP004', 'EMP005');

-- Insert sample employee shifts
INSERT INTO employee_shifts (
  employee_id, branch_id, shift_date, start_time, end_time, break_duration_minutes,
  is_active, notes, created_at
) VALUES
  -- John's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP001'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '08:00', '16:00', 30, true, 'Morning shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP001'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '08:00', '16:00', 30, true, 'Morning shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP001'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 2, '16:00', '00:00', 45, true, 'Evening shift', NOW()),

  -- Sarah's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP002'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '09:00', '17:00', 30, true, 'Management shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP002'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '09:00', '17:00', 30, true, 'Management shift', NOW()),

  -- David's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP003'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '10:00', '18:00', 30, true, 'Inventory shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP003'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '10:00', '18:00', 30, true, 'Inventory shift', NOW()),

  -- Mary's shifts (part-time)
  ((SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '12:00', '16:00', 15, true, 'Afternoon shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '12:00', '16:00', 15, true, 'Afternoon shift', NOW()),

  -- Robert's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '22:00', '06:00', 30, true, 'Night shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '22:00', '06:00', 30, true, 'Night shift', NOW())
ON CONFLICT (employee_id, shift_date, start_time) DO NOTHING;

-- Insert sample employee performance records
INSERT INTO employee_performance (
  employee_id, review_period_start, review_period_end, reviewer_id, rating,
  goals_achievement, customer_satisfaction, sales_performance, punctuality,
  teamwork, comments, improvement_areas, created_at
) VALUES
  -- John's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP001'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.2, 85.5, 4.5, 92.3, 4.8, 4.3,
   'Excellent customer service skills and punctuality. Consistently meets sales targets.',
   'Could improve upselling techniques.', NOW()),

  -- Sarah's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP002'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.8, 95.2, 4.7, 98.1, 4.9, 4.8,
   'Outstanding leadership and team management. Exceeds all performance metrics.',
   'Continue developing staff training programs.', NOW()),

  -- David's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP003'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 3.9, 78.4, 4.1, 85.6, 4.2, 4.0,
   'Good inventory management skills. Reliable and consistent performance.',
   'Improve accuracy in stock counting and reduce discrepancies.', NOW()),

  -- Mary's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP004'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.5, 88.7, 4.6, 89.4, 4.4, 4.5,
   'Excellent customer interaction and problem-solving skills.',
   'Could benefit from additional product knowledge training.', NOW()),

  -- Robert's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP005'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.1, 82.1, 4.3, 87.2, 4.6, 4.2,
   'Reliable security presence. Good situational awareness.',
   'Improve written incident reports.', NOW())
ON CONFLICT DO NOTHING;