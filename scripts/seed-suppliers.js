// scripts/seed-suppliers.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Supplier data
const suppliers = [
  {
    name: 'Fresh Foods Ltd',
    contact_person: 'David Supplier',
    phone: '+256700999000',
    email: 'david@freshfoods.co.ug',
    address: 'Industrial Area, Plot 100',
    city: 'Kampala',
    tax_id: 'TX123456',
    payment_terms: 'Net 30',
    credit_limit: 5000000.00,
    supplier_category: 'local',
    rating: 4.5,
    total_orders: 25,
    on_time_delivery_rate: 95.0,
    quality_score: 4.8,
    average_lead_time_days: 5,
    last_order_date: new Date().toISOString().split('T')[0],
    total_spent: 15000000.00,
    notes: 'Reliable local supplier for fresh produce',
    is_active: true
  },
  {
    name: 'Global Beverages Inc',
    contact_person: 'Sarah International',
    phone: '+256701111222',
    email: 'sarah@globalbev.com',
    address: 'International Business Park',
    city: 'Kampala',
    tax_id: 'TX789012',
    payment_terms: 'Net 45',
    credit_limit: 10000000.00,
    supplier_category: 'international',
    rating: 4.2,
    total_orders: 15,
    on_time_delivery_rate: 88.0,
    quality_score: 4.5,
    average_lead_time_days: 14,
    last_order_date: new Date().toISOString().split('T')[0],
    total_spent: 25000000.00,
    notes: 'International beverage supplier',
    is_active: true
  },
  {
    name: 'Dairy Distributors Ltd',
    contact_person: 'Michael Dairy',
    phone: '+256701333444',
    email: 'michael@dairydist.co.ug',
    address: 'Agricultural Zone, Plot 200',
    city: 'Entebbe',
    tax_id: 'TX345678',
    payment_terms: 'Net 30',
    credit_limit: 3000000.00,
    supplier_category: 'local',
    rating: 4.7,
    total_orders: 30,
    on_time_delivery_rate: 97.0,
    quality_score: 4.9,
    average_lead_time_days: 3,
    last_order_date: new Date().toISOString().split('T')[0],
    total_spent: 12000000.00,
    notes: 'Premium dairy products supplier',
    is_active: true
  },
  {
    name: 'Snack Masters Ltd',
    contact_person: 'Jennifer Snacks',
    phone: '+256701555666',
    email: 'jennifer@snackmasters.co.ug',
    address: 'Food Processing Park',
    city: 'Jinja',
    tax_id: 'TX567890',
    payment_terms: 'Net 30',
    credit_limit: 2000000.00,
    supplier_category: 'local',
    rating: 4.3,
    total_orders: 20,
    on_time_delivery_rate: 92.0,
    quality_score: 4.6,
    average_lead_time_days: 7,
    last_order_date: new Date().toISOString().split('T')[0],
    total_spent: 8000000.00,
    notes: 'Wide range of snack products',
    is_active: true
  },
  {
    name: 'Bulk Wholesale Co',
    contact_person: 'Robert Bulk',
    phone: '+256701777888',
    email: 'robert@bulkwholesale.com',
    address: 'Warehouse District',
    city: 'Kampala',
    tax_id: 'TX901234',
    payment_terms: 'Net 60',
    credit_limit: 15000000.00,
    supplier_category: 'wholesale',
    rating: 4.0,
    total_orders: 40,
    on_time_delivery_rate: 85.0,
    quality_score: 4.2,
    average_lead_time_days: 10,
    last_order_date: new Date().toISOString().split('T')[0],
    total_spent: 30000000.00,
    notes: 'Bulk supplier for large orders',
    is_active: true
  }
];

async function seedSuppliers() {
  console.log('🏭 Starting supplier seeding...');

  try {
    // Check current supplier count
    const { count: currentCount, error: countError } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting suppliers:', countError.message);
      process.exit(1);
    }

    console.log(`🏭 Current suppliers: ${currentCount || 0}`);

    // Insert suppliers
    const { data, error } = await supabase
      .from('suppliers')
      .insert(suppliers)
      .select();

    if (error) {
      console.error('❌ Error inserting suppliers:', error.message);
      process.exit(1);
    }

    console.log(`✅ Created ${data.length} suppliers`);

    console.log('\n🎉 Supplier seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`- Suppliers created: ${suppliers.length}`);
    console.log(`- Total suppliers now: ${(currentCount || 0) + suppliers.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedSuppliers().catch(console.error);