-- Seed data for employee tables
-- This script inserts sample data into employees, employee_shifts, and employee_performance tables

-- Insert sample employees
INSERT INTO employees (
  employee_id, first_name, last_name, email, phone, date_of_birth, gender,
  address, city, hire_date, designation, department, branch_id, salary,
  hourly_rate, employment_type, is_active, emergency_contact_name,
  emergency_contact_phone, created_at, updated_at
) VALUES
  ('EMP0010', 'John', 'Doe', 'john.doe@supermarket.com', '+256700123456', '1985-03-15', 'male',
   '123 Main St', 'Kampala', '2020-01-15', 'Cashier', 'Sales', (SELECT id FROM branches LIMIT 1), 2500000.00,
   15000.00, 'full_time', true, 'Jane Doe', '+256700123457', NOW(), NOW()),

  ('EMP0011', 'Sarah', 'Johnson', 'sarah.johnson@supermarket.com', '+256700123458', '1990-07-22', 'female',
   '456 Oak Ave', 'Kampala', '2021-03-10', 'Store Manager', 'Management', (SELECT id FROM branches LIMIT 1), 4500000.00,
   25000.00, 'full_time', true, 'Mike Johnson', '+256700123459', NOW(), NOW()),

  ('EMP0012', 'David', 'Smith', 'david.smith@supermarket.com', '+256700123460', '1988-11-08', 'male',
   '789 Pine Rd', 'Kampala', '2019-08-20', 'Inventory Clerk', 'Operations', (SELECT id FROM branches LIMIT 1), 2000000.00,
   12000.00, 'full_time', true, 'Lisa Smith', '+256700123461', NOW(), NOW()),

  ('EMP0013', 'Mary', 'Williams', 'mary.williams@supermarket.com', '+256700123462', '1992-05-30', 'female',
   '321 Elm St', 'Kampala', '2022-01-05', 'Customer Service', 'Sales', (SELECT id FROM branches LIMIT 1), 1800000.00,
   10000.00, 'part_time', true, 'Tom Williams', '+256700123463', NOW(), NOW()),

  ('EMP0014', 'Robert', 'Brown', 'robert.brown@supermarket.com', '+256700123464', '1983-12-12', 'male',
   '654 Cedar Ln', 'Kampala', '2018-06-15', 'Security Guard', 'Security', (SELECT id FROM branches LIMIT 1), 2200000.00,
   13000.00, 'full_time', true, 'Anna Brown', '+256700123465', NOW(), NOW());

-- Set manager relationships (make Sarah Johnson manager of others)
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP002') WHERE employee_id IN ('EMP0010', 'EMP0011', 'EMP0013', 'EMP0014');

-- Insert sample employee shifts
INSERT INTO employee_shifts (
  employee_id, branch_id, shift_date, start_time, end_time, break_duration_minutes,
  is_active, notes, created_at
) VALUES
  -- John's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP0010'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '08:00', '16:00', 30, true, 'Morning shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP0010'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '08:00', '16:00', 30, true, 'Morning shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP0010'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 2, '16:00', '00:00', 45, true, 'Evening shift', NOW()),

  -- Sarah's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP0011'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '09:00', '17:00', 30, true, 'Management shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP0011'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '09:00', '17:00', 30, true, 'Management shift', NOW()),

  -- David's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP0012'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '10:00', '18:00', 30, true, 'Inventory shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP0012'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '10:00', '18:00', 30, true, 'Inventory shift', NOW()),

  -- Mary's shifts (part-time)
  ((SELECT id FROM employees WHERE employee_id = 'EMP0013'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '12:00', '16:00', 15, true, 'Afternoon shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP0013'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '12:00', '16:00', 15, true, 'Afternoon shift', NOW()),

  -- Robert's shifts
  ((SELECT id FROM employees WHERE employee_id = 'EMP0014'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE, '22:00', '06:00', 30, true, 'Night shift', NOW()),
  ((SELECT id FROM employees WHERE employee_id = 'EMP0014'), (SELECT id FROM branches LIMIT 1), CURRENT_DATE + 1, '22:00', '06:00', 30, true, 'Night shift', NOW());

-- Insert sample employee performance records
INSERT INTO employee_performance (
  employee_id, review_period_start, review_period_end, reviewer_id, rating,
  goals_achievement, customer_satisfaction, sales_performance, punctuality,
  teamwork, comments, improvement_areas, created_at
) VALUES
  -- John's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP0010'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.2, 85.5, 4.5, 92.3, 4.8, 4.3,
   'Excellent customer service skills and punctuality. Consistently meets sales targets.',
   'Could improve upselling techniques.', NOW()),

  -- Sarah's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP0011'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.8, 95.2, 4.7, 98.1, 4.9, 4.8,
   'Outstanding leadership and team management. Exceeds all performance metrics.',
   'Continue developing staff training programs.', NOW()),

  -- David's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP0012'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 3.9, 78.4, 4.1, 85.6, 4.2, 4.0,
   'Good inventory management skills. Reliable and consistent performance.',
   'Improve accuracy in stock counting and reduce discrepancies.', NOW()),

  -- Mary's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP0013'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.5, 88.7, 4.6, 89.4, 4.4, 4.5,
   'Excellent customer interaction and problem-solving skills.',
   'Could benefit from additional product knowledge training.', NOW()),

  -- Robert's performance
  ((SELECT id FROM employees WHERE employee_id = 'EMP0014'), '2024-01-01', '2024-06-30',
   (SELECT id FROM profiles LIMIT 1), 4.1, 82.1, 4.3, 87.2, 4.6, 4.2,
   'Reliable security presence. Good situational awareness.',
   'Improve written incident reports.', NOW());