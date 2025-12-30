# Entity-Relationship Diagram (ERD)

Below is the Entity-Relationship Diagram for the POS Supermarket System database schema.

```mermaid
erDiagram
    %% User Management
    auth-users ||--|| profiles : "extends"
    profiles ||--o{ roles : "has"

    %% Product Management
    categories ||--o{ products : "contains"
    products ||--|| inventory : "has"
    products ||--o{ inventory-adjustments : "adjusted by"
    inventory-adjustments ||--o{ auth-users : "performed by"

    %% Sales & Transactions
    auth-users ||--o{ sales : "creates"
    customers ||--o{ sales : "makes"
    sales ||--o{ sale-items : "contains"
    sale-items ||--o{ products : "for"
    sales ||--o{ payments : "paid by"
    payments ||--o{ payment-methods : "using"

    %% Messaging System
    auth-users ||--o{ messages : "sends"
    messages ||--o{ auth-users : "receives"
    messages ||--o{ messages : "replies to"
    messages ||--o{ message-recipients : "broadcast to"
    message-recipients ||--o{ auth-users : "recipient"
    message-templates ||--o{ auth-users : "created by"

    %% Supplier Management
    suppliers ||--o{ supplier-products : "supplies"
    supplier-products ||--o{ products : "product"
    suppliers ||--o{ purchase-orders : "supplies to"
    purchase-orders ||--o{ profiles : "created by"
    purchase-orders ||--o{ profiles : "approved by"
    purchase-orders ||--o{ purchase-order-items : "contains"
    purchase-order-items ||--o{ products : "for"
    suppliers ||--o{ supplier-invoices : "billed by"
    supplier-invoices ||--o{ purchase-orders : "for"
    supplier-invoices ||--o{ supplier-payments : "paid by"
    supplier-payments ||--o{ profiles : "recorded by"

    %% CRM & Loyalty
    customers ||--o{ customer-loyalty-accounts : "has"
    loyalty-programs ||--o{ customer-loyalty-accounts : "enrolled in"
    customer-loyalty-accounts ||--o{ loyalty-transactions : "has"
    loyalty-transactions ||--o{ sales : "earned from"
    loyalty-transactions ||--o{ auth-users : "created by"

    %% Cash Drawer Management
    auth-users ||--o{ cash-drawers : "owns"
    cash-drawers ||--o{ cash-transactions : "has"
    cash-transactions ||--o{ auth-users : "performed by"
    cash-drawers ||--o{ cash-drawer-audit-logs : "audited"
    cash-drawer-audit-logs ||--o{ auth-users : "by"

    %% Audit & Security
    auth-users ||--o{ audit-logs : "creates"
```

## Entity Descriptions

### Core Entities
- **auth.users**: Supabase authentication users
- **profiles**: Extended user profiles with roles
- **roles**: User role definitions (admin, manager, cashier)
- **categories**: Product categories
- **products**: Product catalog with pricing and details
- **inventory**: Stock levels for products
- **inventory_adjustments**: Audit trail for inventory changes

### Sales & Transactions
- **sales**: POS transactions
- **sale_items**: Individual items in a sale
- **payments**: Payment records for sales
- **payment_methods**: Available payment types (cash, card, etc.)
- **customers**: Customer database for CRM

### Communication
- **messages**: Internal messaging system
- **message_recipients**: Recipients for broadcast messages
- **message_templates**: Reusable message templates

### Procurement
- **suppliers**: Supplier information
- **supplier_products**: Products supplied by each supplier
- **purchase_orders**: Purchase orders for inventory
- **purchase_order_items**: Items in purchase orders
- **supplier_invoices**: Invoices from suppliers
- **supplier_payments**: Payments made to suppliers

### Loyalty Program
- **loyalty_programs**: Loyalty program configurations
- **customer_loyalty_accounts**: Customer loyalty accounts
- **loyalty_transactions**: Points earned/redeemed

### Cash Management
- **cash_drawers**: Cash drawer sessions
- **cash_transactions**: Cash movements in/out
- **cash_drawer_audit_logs**: Audit trail for cash operations

### Security & Audit
- **audit_logs**: General system audit logs

## Relationship Types
- `||--||`: One-to-one relationship
- `||--o{`: One-to-many relationship (one to many)
- `}o--||`: Many-to-one relationship (many to one)
- `}o--o{`: Many-to-many relationship

The diagram shows the normalized database structure with proper foreign key relationships and referential integrity.