# Complete POS Database Schema

This is a comprehensive database structure for a Point of Sale (POS) supermarket system with advanced features including customer loyalty, analytics, and enterprise-level functionality.

## Overview

The database supports complete CRUD operations for:
- User management with role-based login
- Product and inventory management
- Sales and transaction processing
- Customer management with loyalty programs
- Points-based rewards and tier systems
- Customer analytics and lifetime value
- Internal messaging and communication
- Cash drawer management
- Multi-branch operations
- Advanced reporting and analytics

## Key Features

- **Role-Based Access**: Three roles (Admin, Manager, Cashier) with different access levels
- **Customer Loyalty System**: Points earning, redemption, and tier-based rewards
- **POS Operations**: Complete sales workflow with items, payments, and receipts
- **Inventory Tracking**: Advanced stock levels, batch tracking, and quality control
- **Customer CRM**: Comprehensive customer profiles, purchase history, and analytics
- **Internal Communication**: Messaging system for staff communication
- **Cash Management**: Cash drawer tracking for POS operations
- **Analytics Dashboard**: Sales forecasting, customer lifetime value, seasonal trends
- **Multi-Branch Support**: Branch-specific inventory and operations

## Database Tables

### Core Tables
- `roles` - User roles (admin, manager, cashier)
- `profiles` - User profiles extending auth.users
- `categories` - Product categories
- `products` - Product catalog with pricing and inventory
- `inventory` - Stock levels for products
- `customers` - Customer information, history, and loyalty data

### Loyalty System Tables
- `loyalty_programs` - Configurable loyalty programs
- `customer_loyalty_accounts` - Individual customer loyalty accounts
- `loyalty_transactions` - Points earning and redemption history

### Transaction Tables
- `sales` - Sales transactions
- `sale_items` - Individual items in sales
- `payments` - Payment records for sales
- `payment_methods` - Available payment methods

### Advanced Features
- `product_batches` - Batch/lot tracking with expiry dates
- `quality_inspections` - Quality control and testing
- `gift_cards` - Gift card management
- `customer_deposits` - Layaway and custom order deposits
- `branches` - Multi-branch support
- `branch_inventory` - Branch-specific stock levels

### Analytics & Reporting
- `customer_lifetime_value` - CLV analysis and segmentation
- `seasonal_trends` - Seasonal sales pattern analysis
- `profit_margins` - Profit margin analysis and optimization
- `sales_forecasts` - Predictive sales forecasting

### Communication & Operations
- `messages` - Internal staff messages
- `cash_drawers` - Cash management for POS
- `email_templates` - Automated email templates
- `audit_logs` - Comprehensive audit trails

## Role Access Levels

### Admin
- Full system access to all modules
- Can manage users, products, categories, settings
- Access to all sales data and reports
- Customer analytics and loyalty program management
- Can send system-wide messages
- Multi-branch management and oversight

### Manager
- Product and inventory management
- Customer management and loyalty program oversight
- View all sales reports and analytics
- Access to messaging system
- Can manage categories and products
- Customer lifetime value analysis
- Branch-specific operations

### Cashier
- POS operations (create sales, process payments)
- View and manage assigned cash drawer
- Customer lookup and loyalty points redemption
- Access to messages and cash drawer operations
- Limited to own sales data
- Can create customer records during transactions

## Setup Instructions

1. **Run the Schema**:
   ```sql
   -- Execute the entire contents of scripts/simple_database_schema.sql
   -- in your Supabase SQL Editor
   ```

2. **Create Demo Users**:
   ```bash
   npx tsx scripts/create-demo-users.js
   ```

3. **Demo Users**:
   - **Admin**: micknick168@gmail.com / admin123
   - **Manager**: manager@store.com / manager123
   - **Cashier**: cashier@store.com / cashier123

## CRUD Operations Supported

### Products
- Create: Managers/Admins can add new products
- Read: All authenticated users can view products
- Update: Managers/Admins can modify products
- Delete: Admins can delete products

### Sales
- Create: All authenticated users can create sales
- Read: Users see their own sales; Managers/Admins see all
- Update: Managers/Admins can modify sales
- Delete: Not supported (use status changes)

### Customers
- Create: All users can create customers (automatic on first purchase)
- Read: All authenticated users can view customers
- Update: Managers/Admins can modify customers
- Delete: Admins can delete customers

### Loyalty Programs
- Create: Admins can create and configure loyalty programs
- Read: All authenticated users can view active programs
- Update: Admins can modify program settings
- Delete: Admins can deactivate programs

### Loyalty Accounts
- Create: Automatic when customer is created
- Read: Customers can view their own accounts; Staff can view all
- Update: System updates points and tiers automatically
- Delete: Not supported (accounts are permanent)

### Inventory
- Create: Auto-created with products
- Read: All authenticated users
- Update: Managers/Admins can adjust inventory
- Delete: Not applicable

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based policies control access
- Audit trails through triggers and functions
- Secure authentication via Supabase Auth

## Performance

- Optimized indexes on frequently queried columns
- Efficient RLS policies
- Proper foreign key relationships
- Auto-generated invoice numbers

## Loyalty System Features

### Points Earning
- Automatic points earning on purchases
- Configurable points per currency spent
- Tier-based earning multipliers

### Tier System
- Bronze (default)
- Silver (higher earning rates)
- Gold (premium benefits)
- Platinum (VIP status)

### Redemption
- Points can be redeemed for discounts
- Configurable redemption rates
- Minimum points requirements

## Customer Analytics

### Lifetime Value Analysis
- Total revenue per customer
- Average order value
- Purchase frequency
- Churn probability prediction

### Reporting Features
- Seasonal trends analysis
- Profit margin optimization
- Sales forecasting
- Customer segmentation

## Advanced Features

This comprehensive schema includes:
- Complete loyalty and rewards system
- Multi-branch operations support
- Advanced inventory management (batches, quality control)
- Customer lifetime value analytics
- Automated email communications
- Comprehensive audit trails
- Regulatory compliance features

Use this for full-featured POS operations with enterprise-level capabilities.