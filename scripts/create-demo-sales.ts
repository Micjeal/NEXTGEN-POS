// scripts/create-demo-sales.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please make sure your .env.local file has:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helper function to generate random date within last 30 days
function getRandomDateInLast30Days() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime).toISOString();
}

// Helper function to generate invoice number
function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
}

async function createDemoSales() {
  console.log('🚀 Starting to create demo sales data...');

  try {
    // Get existing products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, tax_rate, category_id')
      .eq('is_active', true)
      .limit(20);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      throw new Error('No products found. Please run the seed data script first.');
    }

    // Get existing users (cashiers)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      throw new Error('No users found. Please create demo users first.');
    }

    // Get payment methods
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('is_active', true);

    if (paymentError) throw paymentError;
    if (!paymentMethods || paymentMethods.length === 0) {
      throw new Error('No payment methods found.');
    }

    console.log(`📊 Found ${products.length} products, ${users.length} users, ${paymentMethods.length} payment methods`);

    // Create 50 demo sales
    const demoSales = [];
    for (let i = 0; i < 50; i++) {
      // Select random user
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Generate random items (1-5 items per sale)
      const numItems = Math.floor(Math.random() * 5) + 1;
      const selectedProducts = [];
      const usedProductIds = new Set();

      for (let j = 0; j < numItems; j++) {
        let product;
        let attempts = 0;
        do {
          product = products[Math.floor(Math.random() * products.length)];
          attempts++;
        } while (usedProductIds.has(product.id) && attempts < 10);

        if (attempts >= 10) break; // Avoid infinite loop

        usedProductIds.add(product.id);
        const quantity = Math.floor(Math.random() * 5) + 1;
        const lineTotal = product.price * quantity;
        const taxAmount = lineTotal * (product.tax_rate / 100);
        selectedProducts.push({
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          unit_price: product.price,
          tax_rate: product.tax_rate,
          tax_amount: taxAmount,
          discount_amount: 0,
          line_total: lineTotal + taxAmount
        });
      }

      // Calculate totals
      const subtotal = selectedProducts.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const taxAmount = selectedProducts.reduce((sum, item) => sum + item.tax_amount, 0);
      const total = subtotal + taxAmount;

      // Select random payment method
      const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const sale = {
        user_id: randomUser.id,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total: total,
        status: 'completed',
        invoice_number: generateInvoiceNumber(),
        created_at: getRandomDateInLast30Days(),
        notes: Math.random() > 0.8 ? 'Demo sale' : null
      };

      demoSales.push({ sale, items: selectedProducts });
    }

    // Insert sales and items
    for (const { sale, items } of demoSales) {
      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([sale])
        .select()
        .single();

      if (saleError) {
        console.error('Error inserting sale:', saleError);
        continue;
      }

      // Insert sale items
      const saleItems = items.map(item => ({
        sale_id: saleData.id,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Error inserting sale items:', itemsError);
      } else {
        console.log(`✅ Created sale ${saleData.invoice_number} with ${items.length} items`);
      }
    }

    // Insert corresponding payments
    const { data: sales, error: salesQueryError } = await supabase
      .from('sales')
      .select('id, total, payment_method_id, created_at')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!salesQueryError && sales) {
      for (const sale of sales) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            sale_id: sale.id,
            payment_method_id: sale.payment_method_id,
            amount: sale.total,
            status: 'completed',
            created_at: sale.created_at
          }]);

        if (paymentError) {
          console.error('Error inserting payment:', paymentError);
        }
      }
    }

    // Create demo audit logs
    console.log('Creating demo audit logs...');
    const auditLogActions = ['INSERT', 'UPDATE', 'DELETE'];
    const auditLogTables = ['sales', 'products', 'inventory', 'profiles'];

    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomAction = auditLogActions[Math.floor(Math.random() * auditLogActions.length)];
      const randomTable = auditLogTables[Math.floor(Math.random() * auditLogTables.length)];

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: randomUser.id,
          action: randomAction,
          table_name: randomTable,
          record_id: null,
          created_at: getRandomDateInLast30Days()
        }]);

      if (auditError) {
        console.error('Error inserting audit log:', auditError);
      } else {
        console.log(`✅ Created audit log ${i + 1}/20`);
      }
    }

    // Create demo inventory adjustments
    console.log('Creating demo inventory adjustments...');
    const adjustmentTypes = ['add', 'remove', 'set'];

    for (let i = 0; i < 15; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomType = adjustmentTypes[Math.floor(Math.random() * adjustmentTypes.length)];
      const quantityChange = randomType === 'remove' ? -Math.floor(Math.random() * 10) - 1 : Math.floor(Math.random() * 10) + 1;

      // Get current inventory
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', randomProduct.id)
        .single();

      const currentQty = currentInventory?.quantity || 0;
      const newQty = Math.max(0, currentQty + quantityChange);

      const { error: inventoryError } = await supabase
        .from('inventory_adjustments')
        .insert([{
          product_id: randomProduct.id,
          user_id: randomUser.id,
          adjustment_type: randomType,
          quantity_change: quantityChange,
          quantity_before: currentQty,
          quantity_after: newQty,
          reason: `Demo ${randomType} adjustment`,
          created_at: getRandomDateInLast30Days()
        }]);

      if (inventoryError) {
        console.error('Error inserting inventory adjustment:', inventoryError);
      } else {
        console.log(`✅ Created inventory adjustment ${i + 1}/15`);
        // Update inventory quantity
        await supabase
          .from('inventory')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('product_id', randomProduct.id);
      }
    }

    console.log('\n🎉 Demo sales data creation complete!');
    console.log(`Created ${demoSales.length} demo sales transactions.`);

  } catch (error) {
    console.error('❌ Error creating demo sales:', error.message);
    process.exit(1);
  }
}

// Run the script
createDemoSales();