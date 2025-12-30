// scripts/seed-purchase-orders.js
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

async function seedPurchaseOrders() {
  console.log('📋 Starting purchase order seeding...');

  try {
    // Get existing data
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, cost_price')
      .limit(50);

    if (prodError || !products || products.length === 0) {
      console.error('❌ No products found');
      process.exit(1);
    }

    const { data: suppliers, error: suppError } = await supabase
      .from('suppliers')
      .select('id')
      .limit(10);

    if (suppError || !suppliers || suppliers.length === 0) {
      console.error('❌ No suppliers found');
      process.exit(1);
    }

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(5);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found');
      process.exit(1);
    }

    console.log(`📦 Found ${products.length} products, ${suppliers.length} suppliers, ${users.length} users`);

    // Generate 50 purchase orders
    const purchaseOrders = [];
    const purchaseOrderItems = [];

    for (let i = 0; i < 50; i++) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days

      // Generate 2-8 items per order
      const numItems = Math.floor(Math.random() * 7) + 2;
      const selectedProducts = [];
      let totalAmount = 0;
      let taxAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        if (!selectedProducts.find(p => p.id === product.id)) {
          selectedProducts.push(product);
          const quantity = Math.floor(Math.random() * 100) + 10; // 10-110
          const unitPrice = product.cost_price || 1000;
          const lineTax = (unitPrice * quantity * 8) / 100; // 8% tax
          const lineTotal = (unitPrice * quantity) + lineTax;

          totalAmount += unitPrice * quantity;
          taxAmount += lineTax;

          purchaseOrderItems.push({
            purchase_order_id: `temp_${i}`,
            product_id: product.id,
            quantity_ordered: quantity,
            quantity_received: Math.floor(quantity * 0.9), // 90% received
            unit_price: unitPrice,
            tax_rate: 8.0,
            product_name: product.name
          });
        }
      }

      const discountAmount = Math.random() > 0.8 ? Math.floor(totalAmount * 0.05) : 0; // 5% discount sometimes
      const shippingAmount = Math.floor(totalAmount * 0.02); // 2% shipping
      const finalTotal = totalAmount + taxAmount - discountAmount + shippingAmount;

      const po = {
        supplier_id: supplier.id,
        order_number: `PO-2024-${String(1000 + i).padStart(4, '0')}`,
        status: ['draft', 'pending', 'approved', 'ordered', 'partially_received', 'received'][Math.floor(Math.random() * 6)],
        total_amount: Math.round(finalTotal),
        tax_amount: Math.round(taxAmount),
        discount_amount: Math.round(discountAmount),
        shipping_amount: Math.round(shippingAmount),
        expected_delivery_date: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: 'Net 30',
        created_by: user.id,
        created_at: orderDate.toISOString()
      };

      purchaseOrders.push(po);
    }

    console.log(`🎯 Generating ${purchaseOrders.length} purchase orders...`);

    // Insert purchase orders in batches
    const batchSize = 10;
    let insertedPOs = 0;

    for (let i = 0; i < purchaseOrders.length; i += batchSize) {
      const batch = purchaseOrders.slice(i, i + batchSize);
      const { data: insertedBatch, error } = await supabase
        .from('purchase_orders')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`❌ Error inserting PO batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        process.exit(1);
      }

      // Update purchase order items with actual PO IDs
      for (let j = 0; j < insertedBatch.length; j++) {
        const poId = insertedBatch[j].id;
        const batchIndex = i + j;

        const startItemIndex = purchaseOrderItems.findIndex(item => item.purchase_order_id === `temp_${batchIndex}`);
        const endItemIndex = purchaseOrderItems.findLastIndex(item => item.purchase_order_id === `temp_${batchIndex}`) + 1;
        const poItemBatch = purchaseOrderItems.slice(startItemIndex, endItemIndex);

        poItemBatch.forEach(item => item.purchase_order_id = poId);

        if (poItemBatch.length > 0) {
          const { error: itemError } = await supabase
            .from('purchase_order_items')
            .insert(poItemBatch);

          if (itemError) {
            console.error('❌ Error inserting PO items:', itemError.message);
          }
        }
      }

      insertedPOs += insertedBatch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(purchaseOrders.length/batchSize)} (${insertedPOs}/${purchaseOrders.length})`);
    }

    console.log('\n🎉 Purchase order seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`- Purchase orders: ${purchaseOrders.length}`);
    console.log(`- Purchase order items: ${purchaseOrderItems.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedPurchaseOrders().catch(console.error);