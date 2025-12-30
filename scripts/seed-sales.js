// scripts/seed-sales.js
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

async function seedSales() {
  console.log('💰 Starting sales transaction seeding...');

  try {
    // Get existing data
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, tax_rate')
      .limit(50); // Use first 50 products

    if (prodError || !products || products.length === 0) {
      console.error('❌ No products found. Please run product seeding first');
      process.exit(1);
    }

    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id')
      .limit(20); // Use first 20 customers

    if (custError || !customers || customers.length === 0) {
      console.error('❌ No customers found. Please run customer seeding first');
      process.exit(1);
    }

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(5); // Use first 5 users

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found');
      process.exit(1);
    }

    const { data: paymentMethods, error: pmError } = await supabase
      .from('payment_methods')
      .select('id')
      .limit(10);

    if (pmError || !paymentMethods || paymentMethods.length === 0) {
      console.error('❌ No payment methods found');
      process.exit(1);
    }

    console.log(`📦 Found ${products.length} products, ${customers.length} customers, ${users.length} users, ${paymentMethods.length} payment methods`);

    // Generate 100 sales transactions
    const sales = [];
    const saleItems = [];
    const payments = [];

    for (let i = 0; i < 100; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const user = users[Math.floor(Math.random() * users.length)];

      // Generate random sale date within last 30 days
      const saleDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      // Generate 1-5 items per sale
      const numItems = Math.floor(Math.random() * 5) + 1;
      const selectedProducts = [];
      let subtotal = 0;
      let taxAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        if (!selectedProducts.find(p => p.id === product.id)) {
          selectedProducts.push(product);
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = product.price;
          const lineTax = (unitPrice * quantity * (product.tax_rate || 0)) / 100;
          const lineTotal = (unitPrice * quantity) + lineTax;

          subtotal += unitPrice * quantity;
          taxAmount += lineTax;
        }
      }

      const discountAmount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0; // 10% discount sometimes
      const total = subtotal + taxAmount - discountAmount;

      const sale = {
        invoice_number: `INV-2024-${String(1000 + i).padStart(4, '0')}`,
        user_id: user.id,
        customer_id: customer.id,
        subtotal: Math.round(subtotal),
        tax_amount: Math.round(taxAmount),
        discount_amount: Math.round(discountAmount),
        total: Math.round(total),
        status: 'completed',
        created_at: saleDate.toISOString()
      };

      sales.push(sale);

      // Generate sale items
      selectedProducts.forEach((product, index) => {
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = product.price;
        const lineTax = (unitPrice * quantity * (product.tax_rate || 0)) / 100;
        const lineTotal = (unitPrice * quantity) + lineTax;

        saleItems.push({
          sale_id: `temp_${i}`, // Will be replaced with actual sale ID
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          tax_rate: product.tax_rate || 0,
          tax_amount: Math.round(lineTax),
          discount_amount: 0,
          line_total: Math.round(lineTotal)
        });
      });

      // Generate payment
      payments.push({
        sale_id: `temp_${i}`, // Will be replaced
        payment_method_id: Math.floor(Math.random() * 4) + 1, // 1-4
        amount: Math.round(total),
        reference_number: `PAY-${String(1000 + i).padStart(4, '0')}`
      });
    }

    console.log(`🎯 Generating ${sales.length} sales transactions...`);

    // Insert sales in batches
    const batchSize = 20;
    let insertedSales = 0;

    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize);
      const { data: insertedBatch, error } = await supabase
        .from('sales')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`❌ Error inserting sales batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        process.exit(1);
      }

      // Update sale items and payments with actual sale IDs
      for (let j = 0; j < insertedBatch.length; j++) {
        const saleId = insertedBatch[j].id;
        const batchIndex = i + j;

        // Update sale items
        const startItemIndex = saleItems.findIndex(item => item.sale_id === `temp_${batchIndex}`);
        const endItemIndex = saleItems.findLastIndex(item => item.sale_id === `temp_${batchIndex}`) + 1;
        const saleItemBatch = saleItems.slice(startItemIndex, endItemIndex);

        saleItemBatch.forEach(item => item.sale_id = saleId);

        if (saleItemBatch.length > 0) {
          const { error: itemError } = await supabase
            .from('sale_items')
            .insert(saleItemBatch);

          if (itemError) {
            console.error('❌ Error inserting sale items:', itemError.message);
          }
        }

        // Update payment
        const paymentIndex = payments.findIndex(p => p.sale_id === `temp_${batchIndex}`);
        if (paymentIndex !== -1) {
          payments[paymentIndex].sale_id = saleId;

          const { error: payError } = await supabase
            .from('payments')
            .insert([payments[paymentIndex]]);

          if (payError) {
            console.error('❌ Error inserting payment:', payError.message);
          }
        }
      }

      insertedSales += insertedBatch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sales.length/batchSize)} (${insertedSales}/${sales.length})`);
    }

    console.log('\n🎉 Sales seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`- Sales transactions: ${sales.length}`);
    console.log(`- Sale items: ${saleItems.length}`);
    console.log(`- Payments: ${payments.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedSales().catch(console.error);