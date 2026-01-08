# Employee Tables Implementation

This document describes the complete implementation of employee-related tables and features: `employees`, `employee_shifts`, `employee_attendance`, and `employee_performance`.

## Tables Overview

### 1. employees
- **Purpose**: Stores employee information and profile data
- **Key Fields**: employee_id, first_name, last_name, email, designation, department, salary, hire_date
- **Relationships**: Links to auth.users, branches, and self-referencing for manager hierarchy

### 2. employee_shifts
- **Purpose**: Manages employee shift scheduling and assignments
- **Key Fields**: employee_id, shift_date, start_time, end_time, break_duration_minutes, branch_id
- **Relationships**: Links to employees and branches

### 3. employee_attendance
- **Purpose**: Tracks employee attendance with time clock in/out functionality
- **Key Fields**: employee_id, attendance_date, clock_in_time, clock_out_time, status, total_hours
- **Features**: 
  - Time clock with geolocation support
  - Clock in/out methods (manual, biometric, qr_code, geolocation)
  - Late/early departure tracking
  - Overtime calculation
- **Relationships**: Links to employees and shifts

### 4. employee_performance
- **Purpose**: Tracks employee performance reviews and ratings
- **Key Fields**: employee_id, review_period_start/end, rating, goals_achievement, customer_satisfaction, sales_performance
- **Relationships**: Links to employees and auth.users (reviewers)

## Database Schema

The schema is defined in multiple SQL files:
- `employee_core_tables_schema.sql` - Core employee tables
- `employee_advanced_features_schema.sql` - Advanced features with RLS
- `employee_attendance_schema.sql` - Attendance tracking with time clock
- `setup_employee_tables.sql` - Complete setup with seed data

### Key Features:
- Table definitions with proper constraints
- Foreign key relationships
- Performance indexes
- Row Level Security (RLS) policies
- Helper functions for calculations

## API Endpoints

### Employees API
- `GET /api/employees` - Retrieve all employees with profile data
- `GET /api/employees/[id]` - Get single employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Deactivate employee

### Employee Shifts API
- `GET /api/employee-shifts` - Retrieve all shifts with employee and branch details
- `POST /api/employee-shifts` - Create new shift assignment
- `PUT /api/employee-shifts` - Update existing shift
- `DELETE /api/employee-shifts?id={id}` - Delete shift

### Employee Attendance API
- `GET /api/employee-attendance` - Retrieve attendance records with filters
- `POST /api/employee-attendance` - Clock in / Create attendance record
- `PUT /api/employee-attendance` - Clock out / Update attendance record
- `DELETE /api/employee-attendance?id={id}` - Delete attendance record

### Employee Performance API
- `GET /api/employee-performance` - Retrieve all performance reviews
- `POST /api/employee-performance` - Create new performance review
- `PUT /api/employee-performance` - Update existing review
- `DELETE /api/employee-performance?id={id}` - Delete review

## Frontend Pages

### Employees Page (`/employees`)
- Main employee management page
- Displays employee cards with key information
- Search and filter functionality
- Statistics dashboard
- Time clock widget for current user
- Quick links to Shifts, Attendance, and Performance pages

### Employee Shifts Page (`/employee-shifts`)
- Shift management interface
- Displays shift schedules with employee information
- Add/Edit/Delete shifts
- Search functionality
- Statistics: total shifts, active shifts, this week's shifts, average hours

### Employee Attendance Page (`/employee-attendance`)
- Attendance tracking dashboard
- Time clock component for employees
- Attendance records with clock in/out times
- Status tracking (present, late, absent, early departure)
- Statistics: total records, present, late, absent, average hours

### Employee Performance Page (`/employee-performance`)
- Performance review management
- Displays reviews with ratings and metrics
- Add/Edit/Delete reviews
- Search functionality
- Statistics: total reviews, average rating, high performers, this month's reviews

## Time Clock Feature

The time clock component (`components/employee/time-clock.tsx`) provides:
- Real-time clock display
- Clock in / Clock out functionality
- Geolocation tracking
- Automatic hours calculation
- Status badges (present, late, absent)

## Navigation

Updated sidebar navigation includes:
- "Employees" - Main employee management
- "Employee Shifts" - Shift scheduling (Calendar icon)
- "Employee Attendance" - Time clock & attendance (Clock icon)
- "Employee Performance" - Reviews & ratings (Star icon)

All pages accessible to admin and manager roles.

## Security

All tables implement Row Level Security:
- Employees can view their own records
- Managers and admins can view all records
- Only admins can create, update, delete records
- Proper role-based access control

## Features

- **Search & Filter**: All pages include search functionality
- **Statistics Dashboard**: Key metrics displayed on each page
- **Responsive Design**: Mobile-friendly interfaces
- **Error Handling**: Proper error states and loading indicators
- **Data Validation**: Input validation on API endpoints
- **Time Clock**: Real-time clock in/out with location tracking
- **Performance Reviews**: Comprehensive rating system with multiple metrics

## Usage

1. Run the schema: Execute `setup_employee_tables.sql` in your database
2. Run attendance schema: Execute `employee_attendance_schema.sql`
3. Access pages through the sidebar navigation
4. Use the API endpoints for programmatic access
5. All functionality is integrated with the existing POS system

## Dependencies

- Supabase for database and authentication
- Next.js for frontend framework
- Tailwind CSS for styling
- Lucide React for icons
- Sonner for toast notifications
