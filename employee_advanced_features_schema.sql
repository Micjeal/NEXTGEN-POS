-- Employee Core Tables Schema
-- Contains only the three requested tables: employees, employee_shifts, employee_performance
-- Compatible with existing SMMS POS system

-- =============================================
-- EMPLOYEES TABLE
-- =============================================
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

-- =============================================
-- EMPLOYEE SHIFTS
-- =============================================
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

-- =============================================
-- EMPLOYEE PERFORMANCE
-- =============================================
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_date ON employee_shifts(employee_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_branch_date ON employee_shifts(branch_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_performance_employee ON employee_performance(employee_id);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BASIC RLS POLICIES
-- =============================================
-- Employees: Employees can view their own, managers can view all
CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "employees_manage" ON employees FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- Employee Shifts: Employees can view their own, managers can view all
CREATE POLICY "employee_shifts_select" ON employee_shifts FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "employee_shifts_manage" ON employee_shifts FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

-- Employee Performance: Employees can view their own, managers can view all
CREATE POLICY "employee_performance_select" ON employee_performance FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "employee_performance_manage" ON employee_performance FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));