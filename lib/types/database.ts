// Database types for SMMS POS System

export type Role = {
  id: string
  name: "admin" | "manager" | "cashier"
  description: string | null
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string
  role_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  role?: Role
}

export type Category = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type Product = {
  id: string
  name: string
  barcode: string | null
  category_id: string | null
  price: number
  cost_price: number
  tax_rate: number
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
  category?: Category
  inventory?: Inventory
}

export type Inventory = {
  id: string
  product_id: string
  quantity: number
  min_stock_level: number
  max_stock_level: number
  updated_at: string
}

export type InventoryAdjustment = {
  id: string
  product_id: string
  user_id: string
  adjustment_type: "add" | "remove" | "set" | "sale" | "return"
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reason: string | null
  created_at: string
}

export type PaymentMethod = {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export type Sale = {
  id: string
  invoice_number: string
  user_id: string
  customer_id: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  status: "pending" | "completed" | "refunded" | "cancelled"
  notes: string | null
  created_at: string
  items?: SaleItem[]
  payments?: Payment[]
  profile?: Profile
  customer?: Customer
}

export type SaleItem = {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  line_total: number
  created_at: string
  product?: Product
}

export type Payment = {
  id: string
  sale_id: string
  payment_method_id: string
  amount: number
  reference_number: string | null
  created_at: string
  payment_method?: PaymentMethod
}

export type Message = {
  id: string
  sender_id: string
  recipient_id: string | null
  recipient_role: "admin" | "manager" | "cashier" | null
  subject: string
  content: string
  message_type: "direct" | "role_based" | "broadcast" | "system"
  priority: "normal" | "urgent" | "critical"
  is_read: boolean
  parent_message_id: string | null
  created_at: string
  updated_at: string
  sender?: Profile
  recipient?: Profile
}

export type MessageRecipient = {
  id: string
  message_id: string
  recipient_id: string
  is_read: boolean
  read_at: string | null
  created_at: string
  recipient?: Profile
}

export type MessageTemplate = {
  id: string
  name: string
  subject: string
  content: string
  category: string
  created_by: string | null
  is_active: boolean
  created_at: string
  creator?: Profile
}

export type Customer = {
  id: string
  phone: string | null
  email: string | null
  full_name: string
  date_of_birth: string | null
  gender: "male" | "female" | "other" | null
  address: string | null
  city: string | null
  country: string
  membership_tier: "bronze" | "silver" | "gold" | "platinum"
  total_spent: number
  total_visits: number
  last_visit_date: string | null
  first_visit_date: string
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type LoyaltyProgram = {
  id: string
  name: string
  description: string | null
  points_per_currency: number
  currency_to_points_rate: number
  minimum_points_redeem: number
  points_expiry_months: number
  redemption_value_per_point: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CustomerLoyaltyAccount = {
  id: string
  customer_id: string
  loyalty_program_id: string
  current_points: number
  total_points_earned: number
  total_points_redeemed: number
  tier: string
  join_date: string
  last_points_earned: string | null
  expiry_date: string | null
  is_active: boolean
  customers?: Customer
  loyalty_program?: LoyaltyProgram
}

export type LoyaltyTransaction = {
  id: string
  customer_loyalty_account_id: string
  transaction_type: "earn" | "redeem" | "expire" | "adjust" | "transfer"
  points: number
  points_balance_after: number
  sale_id: string | null
  reason: string | null
  expiry_date: string | null
  created_by: string | null
  created_at: string
  customer_loyalty_account?: CustomerLoyaltyAccount
}

export type AuditLog = {
  id: string
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export type SecurityIncident = {
  id: string
  incident_type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  status: "open" | "investigating" | "resolved" | "closed"
  detected_at: string
  resolved_at: string | null
  user_id: string | null
  ip_address: string | null
}

export type LoginAttempt = {
  id: string
  email: string
  ip_address: string | null
  user_agent: string | null
  successful: boolean
  attempted_at: string
}

// Supplier Management Types
export type Supplier = {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string
  tax_id: string | null
  payment_terms: string | null
  credit_limit: number
  supplier_category: string
  rating: number
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SupplierProduct = {
  id: string
  supplier_id: string
  product_id: string
  supplier_product_code: string | null
  supplier_price: number | null
  minimum_order_quantity: number
  lead_time_days: number
  is_preferred_supplier: boolean
  last_ordered_at: string | null
  created_at: string
  supplier?: Supplier
  product?: Product
}

export type PurchaseOrder = {
  id: string
  supplier_id: string
  order_number: string
  status: "draft" | "pending" | "approved" | "ordered" | "partially_received" | "received" | "cancelled"
  total_amount: number
  tax_amount: number
  discount_amount: number
  shipping_amount: number
  expected_delivery_date: string | null
  actual_delivery_date: string | null
  payment_terms: string | null
  notes: string | null
  created_by: string
  approved_by: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
  creator?: Profile
  approver?: Profile
  items?: PurchaseOrderItem[]
}

export type PurchaseOrderItem = {
  id: string
  purchase_order_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  tax_rate: number
  discount_rate: number
  line_total: number
  notes: string | null
  created_at: string
  purchase_order?: PurchaseOrder
  product?: Product
}

export type SupplierInvoice = {
  id: string
  supplier_id: string
  purchase_order_id: string | null
  invoice_number: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  paid_amount: number
  status: "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled"
  payment_terms: string | null
  notes: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
  purchase_order?: PurchaseOrder
}

export type SupplierPayment = {
  id: string
  supplier_invoice_id: string
  amount: number
  payment_date: string
  payment_method: string | null
  reference_number: string | null
  notes: string | null
  recorded_by: string
  created_at: string
  supplier_invoice?: SupplierInvoice
  recorder?: Profile
}

// Email System Types
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  category: 'alerts' | 'reports' | 'welcome' | 'marketing' | 'system'
  variables: Record<string, any>
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  creator?: Profile
}

export type EmailLog = {
  id: string
  template_id?: string
  recipient_email: string
  recipient_name?: string
  subject: string
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
  provider_message_id?: string
  sent_at: string
  delivered_at?: string
  opened_at?: string
  clicked_at?: string
  error_message?: string
  metadata?: Record<string, any>
  template?: EmailTemplate
}

export type EmailSettings = {
  id: string
  user_id: string
  email_type: 'low_stock' | 'daily_sales' | 'customer_welcome' | 'birthday' | 'system_updates' | 'marketing'
  enabled: boolean
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
  user?: Profile
}

// Cart types for POS
export type CartItem = {
  product: Product
  quantity: number
  discount: number
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
}
