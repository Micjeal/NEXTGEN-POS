# Complete Database ERD (Entity Relationship Diagram)

This comprehensive ERD includes all requested advanced features for the POS system, including the complete customer loyalty system.

```mermaid
erDiagram
     %% Authentication (Supabase)
     AUTH-USERS ||--o{ PROFILES : "extends"
     AUTH-USERS ||--o{ EMPLOYEES : "detailed_profile"

     %% Core User Management
     ROLES ||--o{ PROFILES : "has_role"
     PROFILES ||--o{ EMPLOYEES : "extends_to"

     ROLES {
         uuid id PK
         text name UK
         text description
         text access_level
         timestamptz created_at
     }

     PROFILES {
         uuid id PK
         text email
         text full_name
         uuid role_id FK
         boolean is_active
         timestamptz created_at
         timestamptz updated_at
     }

     %% Multi-Branch Support
     BRANCHES ||--o{ EMPLOYEES : "employs"
     BRANCHES ||--o{ SALES : "location"
     BRANCHES ||--o{ BRANCH-INVENTORY : "stocks"
     BRANCHES ||--o{ STOCK-TRANSFERS : "sends/receives"

     BRANCHES {
         uuid id PK
         text name UK
         text code UK
         text address
         text city
         text phone
         text email
         uuid manager_id FK
         boolean is_headquarters
         boolean is_active
         jsonb operating_hours
         timestamptz created_at
         timestamptz updated_at
     }

     %% Employee Management
     EMPLOYEES ||--o{ EMPLOYEE-SHIFTS : "works"
     EMPLOYEES ||--o{ EMPLOYEE-ATTENDANCE : "attendance"
     EMPLOYEES ||--o{ EMPLOYEE-PERFORMANCE : "performance"

     EMPLOYEES {
         uuid id PK
         uuid user_id FK,UK
         text employee_id UK
         text first_name
         text last_name
         text email UK
         text phone
         date date_of_birth
         text gender
         text address
         text city
         date hire_date
         date termination_date
         text designation
         text department
         uuid branch_id FK
         uuid manager_id FK
         decimal salary
         decimal hourly_rate
         text employment_type
         boolean is_active
         text emergency_contact_name
         text emergency_contact_phone
         text bank_account_number
         text tax_id
         timestamptz created_at
         timestamptz updated_at
     }

     EMPLOYEE-SHIFTS {
         uuid id PK
         uuid employee_id FK
         uuid branch_id FK
         date shift_date
         time start_time
         time end_time
         integer break_duration_minutes
         boolean is_active
         text notes
         uuid created_by FK
         timestamptz created_at
     }

     EMPLOYEE-ATTENDANCE {
         uuid id PK
         uuid employee_id FK
         uuid shift_id FK
         timestamptz check_in_time
         timestamptz check_out_time
         timestamptz break_start_time
         timestamptz break_end_time
         decimal total_hours
         text status
         text notes
         uuid recorded_by FK
         timestamptz created_at
     }

     EMPLOYEE-PERFORMANCE {
         uuid id PK
         uuid employee_id FK
         date review_period_start
         date review_period_end
         uuid reviewer_id FK
         decimal rating
         decimal goals_achievement
         decimal customer_satisfaction
         decimal sales_performance
         decimal punctuality
         decimal teamwork
         text comments
         text improvement_areas
         timestamptz created_at
     }

     %% Product Management
     CATEGORIES ||--o{ PRODUCTS : "contains"
     PRODUCTS ||--|| INVENTORY : "tracked_by"
     PRODUCTS ||--o{ BRANCH-INVENTORY : "branch_stock"
     PRODUCTS ||--o{ PRODUCT-BATCHES : "batches"
     PRODUCTS ||--o{ SALE-ITEMS : "sold_as"
     PRODUCTS ||--o{ SUPPLIER-PRODUCTS : "supplied_by"

     CATEGORIES {
         uuid id PK
         text name UK
         text description
         timestamptz created_at
     }

     PRODUCTS {
         uuid id PK
         text name
         text barcode UK
         uuid category_id FK
         decimal price
         decimal cost_price
         decimal tax_rate
         boolean is_active
         text image_url
         timestamptz created_at
         timestamptz updated_at
     }

     INVENTORY {
         uuid id PK
         uuid product_id FK,UK
         integer quantity
         integer min_stock_level
         integer max_stock_level
         timestamptz updated_at
     }

     BRANCH-INVENTORY {
         uuid id PK
         uuid branch_id FK
         uuid product_id FK
         integer quantity
         integer min_stock_level
         integer max_stock_level
         timestamptz last_updated
     }

     %% Supplier & Purchase Management
     SUPPLIERS ||--o{ SUPPLIER-PRODUCTS : "supplies"
     SUPPLIERS ||--o{ PURCHASE-ORDERS : "orders_from"
     SUPPLIERS ||--o{ SUPPLIER-INVOICES : "billed_by"

     SUPPLIERS {
         uuid id PK
         text name
         text contact_person
         text phone
         text email
         text address
         text city
         text country
         text tax_id
         text payment_terms
         decimal credit_limit
         text supplier_category
         decimal rating
         integer total_orders
         decimal on_time_delivery_rate
         decimal quality_score
         integer average_lead_time_days
         date last_order_date
         decimal total_spent
         text notes
         boolean is_active
         timestamptz created_at
         timestamptz updated_at
     }

     SUPPLIER-PRODUCTS {
         uuid id PK
         uuid supplier_id FK
         uuid product_id FK
         text supplier_product_code
         decimal supplier_price
         integer minimum_order_quantity
         integer lead_time_days
         boolean is_preferred_supplier
         timestamptz last_ordered_at
         timestamptz created_at
     }

     PURCHASE-ORDERS ||--o{ PURCHASE-ORDER-ITEMS : "contains"
     PURCHASE-ORDERS ||--o{ SUPPLIER-INVOICES : "invoiced"

     PURCHASE-ORDERS {
         uuid id PK
         uuid supplier_id FK
         text order_number UK
         text status
         decimal total_amount
         decimal tax_amount
         decimal discount_amount
         decimal shipping_amount
         date expected_delivery_date
         date actual_delivery_date
         text payment_terms
         text notes
         uuid created_by FK
         uuid approved_by FK
         timestamptz created_at
         timestamptz updated_at
     }

     PURCHASE-ORDER-ITEMS {
         uuid id PK
         uuid purchase_order_id FK
         uuid product_id FK
         integer quantity_ordered
         integer quantity_received
         decimal unit_price
         decimal tax_rate
         decimal discount_rate
         decimal line_total
         text product_name
         text notes
         timestamptz created_at
     }

     SUPPLIER-INVOICES ||--o{ SUPPLIER-PAYMENTS : "paid_by"

     SUPPLIER-INVOICES {
         uuid id PK
         uuid supplier_id FK
         uuid purchase_order_id FK
         text invoice_number UK
         date invoice_date
         date due_date
         decimal total_amount
         decimal paid_amount
         text status
         text payment_terms
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     SUPPLIER-PAYMENTS {
         uuid id PK
         uuid supplier_invoice_id FK
         decimal amount
         date payment_date
         text payment_method
         text reference_number
         text notes
         uuid recorded_by FK
         timestamptz created_at
     }

     %% Advanced Inventory Features
     PRODUCT-BATCHES ||--o{ BATCH-TRANSACTIONS : "transactions"
     PRODUCT-BATCHES ||--o{ QUALITY-INSPECTIONS : "inspected"
     PRODUCT-BATCHES ||--o{ PRODUCT-RECALLS : "recalled"
     PRODUCT-BATCHES ||--o{ SALE-ITEMS : "sold_from"

     PRODUCT-BATCHES {
         uuid id PK
         text batch_number UK
         uuid product_id FK
         uuid supplier_id FK
         uuid purchase_order_id FK
         date manufacturing_date
         date expiry_date
         date received_date
         integer initial_quantity
         integer current_quantity
         decimal unit_cost
         text storage_location
         text quality_status
         text quality_notes
         boolean is_active
         timestamptz created_at
     }

     BATCH-TRANSACTIONS {
         uuid id PK
         uuid batch_id FK
         text transaction_type
         integer quantity
         uuid reference_id
         text reference_type
         uuid branch_id FK
         uuid performed_by FK
         text notes
         timestamptz created_at
     }

     QUALITY-INSPECTIONS {
         uuid id PK
         uuid batch_id FK
         uuid product_id FK
         text inspection_type
         uuid inspector_id FK
         date inspection_date
         decimal temperature
         decimal humidity
         text visual_inspection
         text microbiological_test
         text chemical_test
         text overall_rating
         text comments
         text corrective_actions
         boolean requires_followup
         timestamptz created_at
     }

     PRODUCT-RECALLS {
         uuid id PK
         text recall_number UK
         uuid product_id FK
         uuid batch_id FK
         text recall_reason
         text severity_level
         integer affected_quantity
         date start_date
         date end_date
         text status
         uuid initiated_by FK
         boolean regulatory_notification
         boolean customer_notification_sent
         boolean refund_offered
         boolean replacement_offered
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     %% Stock Transfers (Multi-Branch)
     STOCK-TRANSFERS ||--o{ STOCK-TRANSFER-ITEMS : "contains"

     STOCK-TRANSFERS {
         uuid id PK
         text transfer_number UK
         uuid from_branch_id FK
         uuid to_branch_id FK
         text status
         uuid requested_by FK
         uuid approved_by FK
         timestamptz shipped_at
         timestamptz received_at
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     STOCK-TRANSFER-ITEMS {
         uuid id PK
         uuid stock_transfer_id FK
         uuid product_id FK
         integer quantity_requested
         integer quantity_shipped
         integer quantity_received
         decimal unit_cost
         text notes
         timestamptz created_at
     }

     %% Customer Management & Loyalty System
     CUSTOMERS ||--o{ SALES : "makes"
     CUSTOMERS ||--o{ CUSTOMER-DEPOSITS : "deposits"
     CUSTOMERS ||--o{ GIFT-CARDS : "owns"
     CUSTOMERS ||--o{ CUSTOMER-LIFETIME-VALUE : "analytics"
     CUSTOMERS ||--o{ CUSTOMER-LOYALTY-ACCOUNTS : "has_loyalty"

     CUSTOMERS {
         uuid id PK
         text phone UK
         text email UK
         text full_name
         date date_of_birth
         text gender
         text address
         text city
         text country
         text membership_tier
         decimal total_spent
         integer total_visits
         timestamptz last_visit_date
         timestamptz first_visit_date
         boolean is_active
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     LOYALTY-PROGRAMS ||--o{ CUSTOMER-LOYALTY-ACCOUNTS : "enrolls"

     LOYALTY-PROGRAMS {
         uuid id PK
         text name
         text description
         decimal points_per_currency
         decimal currency_to_points_rate
         decimal redemption_rate
         integer minimum_points_for_redemption
         integer points_expiry_months
         boolean is_active
         timestamptz created_at
         timestamptz updated_at
     }

     CUSTOMER-LOYALTY-ACCOUNTS ||--o{ LOYALTY-TRANSACTIONS : "transactions"

     CUSTOMER-LOYALTY-ACCOUNTS {
         uuid id PK
         uuid customer_id FK
         uuid loyalty_program_id FK
         integer current_points
         integer total_points_earned
         integer total_points_redeemed
         text tier
         date join_date
         timestamptz last_activity_date
         boolean is_active
         timestamptz created_at
         timestamptz updated_at
     }

     LOYALTY-TRANSACTIONS {
         uuid id PK
         uuid customer_loyalty_account_id FK
         text transaction_type
         integer points
         integer points_balance_before
         integer points_balance_after
         uuid sale_id FK
         text description
         uuid performed_by FK
         timestamptz created_at
     }

     %% Sales & Transactions
     SALES ||--|{ SALE-ITEMS : "contains"
     SALES ||--|{ PAYMENTS : "paid_by"

     SALES {
         uuid id PK
         text invoice_number UK
         uuid user_id FK
         uuid customer_id FK
         uuid branch_id FK
         decimal subtotal
         decimal tax_amount
         decimal discount_amount
         decimal total
         text status
         text notes
         timestamptz created_at
     }

     SALE-ITEMS {
         uuid id PK
         uuid sale_id FK
         uuid product_id FK
         uuid batch_id FK
         text product_name
         integer quantity
         decimal unit_price
         decimal tax_rate
         decimal tax_amount
         decimal discount_amount
         decimal line_total
         timestamptz created_at
     }

     PAYMENTS {
         uuid id PK
         uuid sale_id FK
         uuid payment_method_id FK
         decimal amount
         text reference_number
         timestamptz created_at
     }

     PAYMENT-METHODS {
         uuid id PK
         text name UK
         boolean is_active
         timestamptz created_at
     }

     %% Additional Payment Features
     GIFT-CARDS ||--o{ GIFT-CARD-TRANSACTIONS : "transactions"

     GIFT-CARDS {
         uuid id PK
         text card_number UK
         text pin
         decimal initial_amount
         decimal current_balance
         date expiry_date
         boolean is_active
         uuid issued_to FK
         uuid issued_by FK
         timestamptz issued_at
         timestamptz last_used_at
         text notes
     }

     GIFT-CARD-TRANSACTIONS {
         uuid id PK
         uuid gift_card_id FK
         text transaction_type
         decimal amount
         decimal balance_before
         decimal balance_after
         uuid sale_id FK
         uuid performed_by FK
         text notes
         timestamptz created_at
     }

     CUSTOMER-DEPOSITS ||--o{ DEPOSIT-PAYMENTS : "payments"

     CUSTOMER-DEPOSITS {
         uuid id PK
         uuid customer_id FK
         text deposit_type
         text description
         decimal total_amount
         decimal deposit_amount
         decimal balance_due
         date due_date
         text status
         timestamptz completed_at
         uuid created_by FK
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     DEPOSIT-PAYMENTS {
         uuid id PK
         uuid deposit_id FK
         uuid payment_method_id FK
         decimal amount
         timestamptz payment_date
         text reference_number
         uuid recorded_by FK
         text notes
         timestamptz created_at
     }

     %% Communication & Automation
     AUTH-USERS ||--o{ MESSAGES : "sends"
     MESSAGES ||--o{ MESSAGES : "replies_to"
     AUTH-USERS ||--o{ EMAIL-SETTINGS : "preferences"

     MESSAGES {
         uuid id PK
         uuid sender_id FK
         uuid recipient_id FK
         text recipient_role
         text subject
         text content
         text message_type
         text priority
         boolean is_read
         uuid parent_message_id FK
         timestamptz created_at
         timestamptz updated_at
     }

     MESSAGE-TEMPLATES {
         uuid id PK
         text name
         text subject
         text content
         text category
         uuid created_by FK
         boolean is_active
         timestamptz created_at
     }

     EMAIL-TEMPLATES ||--o{ EMAIL-LOGS : "used_for"

     EMAIL-TEMPLATES {
         uuid id PK
         text name
         text subject
         text html_content
         text text_content
         text category
         jsonb variables
         boolean is_active
         uuid created_by FK
         timestamptz created_at
         timestamptz updated_at
     }

     EMAIL-LOGS {
         uuid id PK
         uuid template_id FK
         text recipient_email
         text recipient_name
         text subject
         text status
         text provider_message_id
         timestamptz sent_at
         timestamptz delivered_at
         timestamptz opened_at
         timestamptz clicked_at
         text error_message
         jsonb metadata
     }

     EMAIL-SETTINGS {
         uuid id PK
         uuid user_id FK
         text email_type
         boolean enabled
         text frequency
         timestamptz created_at
         timestamptz updated_at
     }

     %% Cash Management
     AUTH-USERS ||--o{ CASH-DRAWERS : "manages"

     CASH-DRAWERS {
         uuid id PK
         uuid user_id FK
         uuid branch_id FK
         text drawer_name
         text status
         decimal opening_balance
         decimal current_balance
         decimal expected_balance
         timestamptz opened_at
         timestamptz closed_at
         timestamptz reconciled_at
         uuid reconciled_by FK
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     %% Analytics & Reporting
     SALES-FORECASTS {
         uuid id PK
         uuid product_id FK
         uuid category_id FK
         uuid branch_id FK
         date forecast_date
         text forecast_period
         integer forecasted_quantity
         decimal forecasted_revenue
         decimal confidence_level
         integer actual_quantity
         decimal actual_revenue
         decimal accuracy_percentage
         uuid created_by FK
         timestamptz created_at
     }

     CUSTOMER-LIFETIME-VALUE {
         uuid id PK
         uuid customer_id FK
         date calculation_date
         decimal total_revenue
         integer total_orders
         decimal average_order_value
         decimal purchase_frequency
         integer customer_age_days
         decimal predicted_clv
         text clv_segment
         decimal churn_probability
         timestamptz last_updated
     }

     SEASONAL-TRENDS {
         uuid id PK
         uuid product_id FK
         uuid category_id FK
         integer year
         integer month
         decimal total_sales
         integer total_quantity
         decimal average_price
         decimal growth_percentage
         decimal seasonal_index
         timestamptz created_at
     }

     PROFIT-MARGINS {
         uuid id PK
         uuid product_id FK
         uuid category_id FK
         uuid branch_id FK
         date analysis_date
         decimal cost_price
         decimal selling_price
         decimal gross_margin
         decimal net_margin
         decimal markup_percentage
         decimal competitive_index
         text recommendations
         timestamptz created_at
     }

     %% Stock Transfers (Multi-Branch)
     STOCK-TRANSFERS ||--o{ STOCK-TRANSFER-ITEMS : "contains"

     STOCK-TRANSFERS {
         uuid id PK
         text transfer_number UK
         uuid from_branch_id FK
         uuid to_branch_id FK
         text status
         uuid requested_by FK
         uuid approved_by FK
         timestamptz shipped_at
         timestamptz received_at
         text notes
         timestamptz created_at
         timestamptz updated_at
     }

     STOCK-TRANSFER-ITEMS {
         uuid id PK
         uuid stock_transfer_id FK
         uuid product_id FK
         integer quantity_requested
         integer quantity_shipped
         integer quantity_received
         decimal unit_cost
         text notes
         timestamptz created_at
     }

     %% Audit & Security
     AUTH-USERS ||--o{ AUDIT-LOGS : "creates"
     AUTH-USERS ||--o{ LOGIN-ATTEMPTS : "attempts"
     AUTH-USERS ||--o{ SECURITY-INCIDENTS : "involved_in"

     AUDIT-LOGS {
         uuid id PK
         text user_id FK
         text action
         text table_name
         uuid record_id
         jsonb old_data
         jsonb new_data
         text ip_address
         timestamptz created_at
     }

     LOGIN-ATTEMPTS {
         uuid id PK
         text email
         text ip_address
         text user_agent
         boolean successful
         timestamptz attempted_at
     }

     SECURITY-INCIDENTS {
         uuid id PK
         text incident_type
         text severity
         text description
         text status
         timestamptz detected_at
         timestamptz resolved_at
         uuid user_id FK
         text ip_address
     }

     %% External References

     AUTH-USERS {
         uuid id PK
         text email UK
         jsonb raw_user_meta_data
         timestamptz created_at
         timestamptz updated_at
     }
```

## Major Relationship Categories

### 1. **User Management & Authentication**

- `AUTH-USERS` → `PROFILES` (1:1 extension)
- `AUTH-USERS` → `EMPLOYEES` (1:1 detailed profile)
- `ROLES` → `PROFILES` (1:Many role assignment)

### 2. **Multi-Branch Operations**

- `BRANCHES` → `EMPLOYEES` (1:Many branch staff)
- `BRANCHES` → `SALES` (1:Many branch sales)
- `BRANCHES` → `BRANCH-INVENTORY` (1:Many branch stock)
- `BRANCHES` → `STOCK-TRANSFERS` (Many:Many inter-branch transfers)

### 3. **Employee Lifecycle Management**

- `EMPLOYEES` → `EMPLOYEE-SHIFTS` (1:Many work schedules)
- `EMPLOYEES` → `EMPLOYEE-ATTENDANCE` (1:Many attendance records)
- `EMPLOYEES` → `EMPLOYEE-PERFORMANCE` (1:Many performance reviews)

### 4. **Product & Inventory Management**

- `CATEGORIES` → `PRODUCTS` (1:Many categorization)
- `PRODUCTS` → `INVENTORY` (1:1 central stock tracking)
- `PRODUCTS` → `BRANCH-INVENTORY` (1:Many branch-specific stock)
- `PRODUCTS` → `PRODUCT-BATCHES` (1:Many batch tracking)
- `PRODUCT-BATCHES` → `BATCH-TRANSACTIONS` (1:Many traceability)

### 5. **Customer Management & Loyalty System**
- `CUSTOMERS` → `SALES` (1:Many purchase history)
- `CUSTOMERS` → `CUSTOMER-LOYALTY-ACCOUNTS` (1:Many loyalty accounts)
- `LOYALTY-PROGRAMS` → `CUSTOMER-LOYALTY-ACCOUNTS` (1:Many enrollments)
- `CUSTOMER-LOYALTY-ACCOUNTS` → `LOYALTY-TRANSACTIONS` (1:Many point transactions)
- `LOYALTY-TRANSACTIONS` → `SALES` (Many:1 linked to purchases)

### 6. **Supplier & Procurement**
- `SUPPLIERS` → `SUPPLIER-PRODUCTS` (1:Many supplier catalog)
- `SUPPLIERS` → `PURCHASE-ORDERS` (1:Many orders)
- `PURCHASE-ORDERS` → `PURCHASE-ORDER-ITEMS` (1:Many line items)
- `PURCHASE-ORDERS` → `SUPPLIER-INVOICES` (1:Many invoices)
- `SUPPLIER-INVOICES` → `SUPPLIER-PAYMENTS` (1:Many payments)

### 7. **Sales & Customer Transactions**
- `CUSTOMERS` → `SALES` (1:Many purchase history)
- `SALES` → `SALE-ITEMS` (1:Many transaction items)
- `SALES` → `PAYMENTS` (1:Many payment methods)
- `SALE-ITEMS` → `PRODUCT-BATCHES` (Many:1 batch traceability)

### 8. **Advanced Payment Features**
- `CUSTOMERS` → `GIFT-CARDS` (1:Many owned cards)
- `GIFT-CARDS` → `GIFT-CARD-TRANSACTIONS` (1:Many usage history)
- `CUSTOMERS` → `CUSTOMER-DEPOSITS` (1:Many layaways/deposits)
- `CUSTOMER-DEPOSITS` → `DEPOSIT-PAYMENTS` (1:Many payments)

### 9. **Communication & Automation**
- `AUTH-USERS` → `MESSAGES` (1:Many sent messages)
- `MESSAGES` → `MESSAGES` (Many:1 threading)
- `EMAIL-TEMPLATES` → `EMAIL-LOGS` (1:Many usage tracking)
- `AUTH-USERS` → `EMAIL-SETTINGS` (1:Many notification preferences)

### 10. **Analytics & Business Intelligence**
- `PRODUCTS` → `SALES-FORECASTS` (1:Many forecasting data)
- `CUSTOMERS` → `CUSTOMER-LIFETIME-VALUE` (1:Many CLV analytics)
- `PRODUCTS` → `SEASONAL-TRENDS` (1:Many trend analysis)
- `PRODUCTS` → `PROFIT-MARGINS` (1:Many margin analysis)

### 11. **Quality Control & Compliance**
- `PRODUCT-BATCHES` → `QUALITY-INSPECTIONS` (1:Many inspections)
- `PRODUCT-BATCHES` → `PRODUCT-RECALLS` (Many:1 recall management)

### 12. **Audit & Security**
- `AUTH-USERS` → `AUDIT-LOGS` (1:Many activity tracking)
- `AUTH-USERS` → `LOGIN-ATTEMPTS` (1:Many authentication attempts)
- `AUTH-USERS` → `SECURITY-INCIDENTS` (1:Many security events)

## Database Architecture Principles

### **Normalization Level** 3NF (Third Normal Form)
- Eliminates transitive dependencies
- Ensures data integrity and reduces redundancy
- Maintains referential integrity through foreign keys

### **Scalability Features**
- UUID primary keys for distributed systems
- JSONB fields for flexible metadata storage
- Partitioning-ready date-based fields
- Extensible enum types for status fields

### **Security Design**
- Row Level Security (RLS) on all tables
- Role-based access control
- Comprehensive audit logging
- Encrypted sensitive data fields

### **Performance Optimizations**
- Strategic indexing on foreign keys
- Composite indexes for common query patterns
- Generated columns for calculated fields
- Efficient data types and constraints

This complete ERD represents a production-ready POS system with enterprise-level features for retail operations, inventory management, customer relationship management, and business analytics, including a comprehensive loyalty system."" 
