// scripts/seed-complete-database.js
const { createClient } = require('@supabase/supabase-js');

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

async function seedCompleteDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Get admin user ID for references
    const { data: adminUser } = await supabase.auth.admin.listUsers();
    const adminId = adminUser.users.find(u => u.email === 'micknick168@gmail.com')?.id;
    const managerId = adminUser.users.find(u => u.email === 'manager@store.com')?.id;
    const cashierId = adminUser.users.find(u => u.email === 'cashier@store.com')?.id;

    if (!adminId || !managerId || !cashierId) {
      console.error('❌ Demo users not found. Please run create-demo-users.js first');
      process.exit(1);
    }

    console.log('👤 Found user IDs:', { adminId, managerId, cashierId });

    // Seed additional branches
    console.log('🏢 Seeding branches...');
    const { data: branches } = await supabase
      .from('branches')
      .insert([
        {
          name: 'Nakawa Branch',
          code: 'NKW',
          address: 'Plot 456, Nakawa Road',
          city: 'Kampala',
          phone: '+256700111222',
          email: 'nakawa@store.com',
          manager_id: managerId,
          is_headquarters: false,
          operating_hours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '18:00' },
            saturday: { open: '09:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' }
          }
        },
        {
          name: 'Kololo Branch',
          code: 'KLL',
          address: 'Plot 789, Kampala Road',
          city: 'Kampala',
          phone: '+256700333444',
          email: 'kololo@store.com',
          manager_id: managerId,
          is_headquarters: false,
          operating_hours: {
            monday: { open: '08:00', close: '19:00' },
            tuesday: { open: '08:00', close: '19:00' },
            wednesday: { open: '08:00', close: '19:00' },
            thursday: { open: '08:00', close: '19:00' },
            friday: { open: '08:00', close: '19:00' },
            saturday: { open: '09:00', close: '17:00' },
            sunday: { open: 'closed', close: 'closed' }
          }
        }
      ])
      .select();

    console.log(`✅ Created ${branches?.length || 0} branches`);

    // Seed employees
    console.log('👥 Seeding employees...');
    const { data: employees } = await supabase
      .from('employees')
      .insert([
        {
          user_id: managerId,
          employee_id: 'EMP-001',
          first_name: 'John',
          last_name: 'Manager',
          email: 'manager@store.com',
          phone: '+256700555666',
          date_of_birth: '1985-05-15',
          gender: 'male',
          address: 'Plot 123, Manager Street',
          city: 'Kampala',
          hire_date: '2023-01-15',
          designation: 'Store Manager',
          department: 'Operations',
          branch_id: branches?.[0]?.id,
          employment_type: 'full_time',
          salary: 2500000.00,
          is_active: true
        },
        {
          user_id: cashierId,
          employee_id: 'EMP-002',
          first_name: 'Jane',
          last_name: 'Cashier',
          email: 'cashier@store.com',
          phone: '+256700777888',
          date_of_birth: '1990-08-20',
          gender: 'female',
          address: 'Plot 456, Cashier Avenue',
          city: 'Kampala',
          hire_date: '2023-03-01',
          designation: 'POS Cashier',
          department: 'Sales',
          branch_id: branches?.[0]?.id,
          employment_type: 'full_time',
          salary: 1200000.00,
          is_active: true
        }
      ])
      .select();

    console.log(`✅ Created ${employees?.length || 0} employees`);

    // Seed suppliers
    console.log('🏭 Seeding suppliers...');
    const { data: suppliers } = await supabase
      .from('suppliers')
      .insert([
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
        }
      ])
      .select();

    console.log(`✅ Created ${suppliers?.length || 0} suppliers`);

    // Seed additional products
    console.log('📦 Seeding additional products...');
    const { data: categories } = await supabase.from('categories').select('id, name');

    const beverageCategory = categories.find(c => c.name === 'Beverages');
    const dairyCategory = categories.find(c => c.name === 'Dairy');

    if (beverageCategory && dairyCategory) {
      const { data: products } = await supabase
        .from('products')
        .insert([
          {
            name: 'Orange Juice 1L',
            barcode: '1234567890123',
            category_id: beverageCategory.id,
            price: 4500.00,
            cost_price: 3200.00,
            tax_rate: 8.0,
            is_active: true
          },
          {
            name: 'Greek Yogurt 500g',
            barcode: '1234567890124',
            category_id: dairyCategory.id,
            price: 8500.00,
            cost_price: 6000.00,
            tax_rate: 0.0,
            is_active: true
          }
        ])
        .select();

      console.log(`✅ Created ${products?.length || 0} additional products`);
    }

    // Seed inventory for all products
    console.log('📊 Seeding inventory...');
    const { data: allProducts } = await supabase.from('products').select('id');

    for (const product of allProducts) {
      await supabase
        .from('inventory')
        .upsert({
          product_id: product.id,
          quantity: Math.floor(Math.random() * 100) + 50,
          min_stock_level: 10,
          max_stock_level: 200
        });
    }

    console.log(`✅ Updated inventory for ${allProducts.length} products`);

    // Seed branch inventory
    console.log('🏪 Seeding branch inventory...');
    for (const branch of branches || []) {
      for (const product of allProducts.slice(0, 5)) { // First 5 products
        await supabase
          .from('branch_inventory')
          .upsert({
            branch_id: branch.id,
            product_id: product.id,
            quantity: Math.floor(Math.random() * 50) + 20,
            min_stock_level: 5,
            max_stock_level: 100
          });
      }
    }

    console.log(`✅ Created branch inventory for ${branches?.length || 0} branches`);

    // Seed purchase orders
    console.log('📋 Seeding purchase orders...');
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .insert([
        {
          supplier_id: suppliers?.[0]?.id,
          order_number: 'PO-2024-001',
          status: 'approved',
          total_amount: 2500000.00,
          tax_amount: 200000.00,
          discount_amount: 0.00,
          shipping_amount: 50000.00,
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_terms: 'Net 30',
          notes: 'Weekly fresh produce order',
          created_by: adminId,
          approved_by: managerId
        }
      ])
      .select();

    console.log(`✅ Created ${purchaseOrders?.length || 0} purchase orders`);

    // Seed purchase order items
    console.log('📝 Seeding purchase order items...');
    if (purchaseOrders?.[0] && allProducts.length > 0) {
      const poItems = allProducts.slice(0, 3).map((product, index) => ({
        purchase_order_id: purchaseOrders[0].id,
        product_id: product.id,
        quantity_ordered: (index + 1) * 50,
        quantity_received: (index + 1) * 45,
        unit_price: 1000.00 + (index * 500),
        tax_rate: 8.0,
        discount_rate: 0.0,
        product_name: `Product ${index + 1}`
      }));

      await supabase.from('purchase_order_items').insert(poItems);
      console.log(`✅ Created ${poItems.length} purchase order items`);
    }

    // Seed product batches
    console.log('🔄 Seeding product batches...');
    const { data: batches } = await supabase
      .from('product_batches')
      .insert([
        {
          batch_number: 'BATCH-2024-001',
          product_id: allProducts[0]?.id,
          supplier_id: suppliers?.[0]?.id,
          purchase_order_id: purchaseOrders?.[0]?.id,
          manufacturing_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          received_date: new Date().toISOString().split('T')[0],
          initial_quantity: 100,
          current_quantity: 85,
          unit_cost: 1500.00,
          storage_location: 'Warehouse A-1',
          quality_status: 'approved',
          quality_notes: 'Passed all quality checks',
          is_active: true
        }
      ])
      .select();

    console.log(`✅ Created ${batches?.length || 0} product batches`);

    // Seed quality inspections
    console.log('🔍 Seeding quality inspections...');
    if (batches?.[0]) {
      await supabase
        .from('quality_inspections')
        .insert([
          {
            batch_id: batches[0].id,
            product_id: allProducts[0]?.id,
            inspection_type: 'incoming',
            inspector_id: adminId,
            inspection_date: new Date().toISOString().split('T')[0],
            temperature: 22.5,
            humidity: 45.0,
            visual_inspection: 'Good condition, no damage',
            microbiological_test: 'Within acceptable limits',
            chemical_test: 'Passed all tests',
            overall_rating: 'excellent',
            comments: 'High quality batch',
            requires_followup: false
          }
        ]);
      console.log('✅ Created quality inspections');
    }

    // Seed additional customers
    console.log('👥 Seeding additional customers...');
    const { data: customers } = await supabase
      .from('customers')
      .insert([
        {
          phone: '+256700123456',
          email: 'customer1@email.com',
          full_name: 'Alice Johnson',
          date_of_birth: '1988-03-15',
          gender: 'female',
          address: 'Plot 100, Customer Street',
          city: 'Kampala',
          membership_tier: 'gold',
          total_spent: 500000.00,
          total_visits: 25,
          last_visit_date: new Date().toISOString(),
          is_active: true,
          notes: 'VIP customer, prefers premium products'
        },
        {
          phone: '+256700234567',
          email: 'customer2@email.com',
          full_name: 'Bob Smith',
          date_of_birth: '1975-07-22',
          gender: 'male',
          address: 'Plot 200, Business Avenue',
          city: 'Kampala',
          membership_tier: 'platinum',
          total_spent: 1200000.00,
          total_visits: 45,
          last_visit_date: new Date().toISOString(),
          is_active: true,
          notes: 'Bulk buyer, owns small shop'
        }
      ])
      .select();

    console.log(`✅ Created ${customers?.length || 0} additional customers`);

    // Seed sales transactions
    console.log('💰 Seeding sales transactions...');
    const { data: sales } = await supabase
      .from('sales')
      .insert([
        {
          invoice_number: 'INV-2024-0001',
          user_id: cashierId,
          customer_id: customers?.[0]?.id,
          branch_id: branches?.[0]?.id,
          subtotal: 15000.00,
          tax_amount: 1200.00,
          discount_amount: 0.00,
          total: 16200.00,
          status: 'completed',
          notes: 'Regular customer purchase'
        },
        {
          invoice_number: 'INV-2024-0002',
          user_id: cashierId,
          customer_id: customers?.[1]?.id,
          branch_id: branches?.[0]?.id,
          subtotal: 25000.00,
          tax_amount: 2000.00,
          discount_amount: 2500.00,
          total: 24500.00,
          status: 'completed',
          notes: 'Bulk purchase with discount'
        }
      ])
      .select();

    console.log(`✅ Created ${sales?.length || 0} sales transactions`);

    // Seed sale items
    console.log('🛒 Seeding sale items...');
    if (sales?.[0] && allProducts.length > 0) {
      const saleItems1 = [
        {
          sale_id: sales[0].id,
          product_id: allProducts[0].id,
          batch_id: batches?.[0]?.id,
          product_name: 'Coca-Cola 500ml',
          quantity: 2,
          unit_price: 2500.00,
          tax_rate: 8.0,
          tax_amount: 400.00,
          discount_amount: 0.00,
          line_total: 5000.00
        },
        {
          sale_id: sales[0].id,
          product_id: allProducts[1].id,
          product_name: 'Pepsi 500ml',
          quantity: 1,
          unit_price: 2250.00,
          tax_rate: 8.0,
          tax_amount: 180.00,
          discount_amount: 0.00,
          line_total: 2250.00
        }
      ];

      await supabase.from('sale_items').insert(saleItems1);
      console.log(`✅ Created ${saleItems1.length} items for sale 1`);
    }

    // Seed payments
    console.log('💳 Seeding payments...');
    if (sales?.[0]) {
      await supabase
        .from('payments')
        .insert([
          {
            sale_id: sales[0].id,
            payment_method_id: 1, // Cash
            amount: 16200.00,
            reference_number: 'CASH-001'
          }
        ]);
      console.log('✅ Created payments');
    }

    // Seed gift cards
    console.log('🎁 Seeding gift cards...');
    const { data: giftCards } = await supabase
      .from('gift_cards')
      .insert([
        {
          card_number: 'GC001234567890',
          pin: '1234',
          initial_amount: 50000.00,
          current_balance: 50000.00,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true,
          issued_to: customers?.[0]?.id,
          issued_by: adminId,
          issued_at: new Date().toISOString(),
          notes: 'Birthday gift card'
        }
      ])
      .select();

    console.log(`✅ Created ${giftCards?.length || 0} gift cards`);

    // Seed customer deposits
    console.log('💰 Seeding customer deposits...');
    const { data: deposits } = await supabase
      .from('customer_deposits')
      .insert([
        {
          deposit_number: 'DEP-2024-001',
          customer_id: customers?.[0]?.id,
          deposit_type: 'custom_order',
          description: 'Custom cake order',
          total_amount: 150000.00,
          deposit_amount: 50000.00,
          balance_due: 100000.00,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          created_by: adminId,
          notes: '50% deposit required for custom orders'
        }
      ])
      .select();

    console.log(`✅ Created ${deposits?.length || 0} customer deposits`);

    // Seed messages
    console.log('💬 Seeding messages...');
    await supabase
      .from('messages')
      .insert([
        {
          sender_id: adminId,
          recipient_role: 'manager',
          subject: 'Staff Meeting Tomorrow',
          content: 'Please attend the monthly staff meeting at 10 AM tomorrow in the conference room.',
          message_type: 'broadcast',
          priority: 'normal',
          is_read: false
        },
        {
          sender_id: managerId,
          recipient_id: cashierId,
          subject: 'Shift Handover',
          content: 'Taking over your shift. All systems operational. Customer count: 25',
          message_type: 'direct',
          priority: 'normal',
          is_read: false
        }
      ]);

    console.log('✅ Created messages');

    // Seed message templates
    console.log('📝 Seeding message templates...');
    await supabase
      .from('message_templates')
      .insert([
        {
          name: 'Shift Handover',
          subject: 'Shift Handover Notes',
          content: 'Dear team member,\n\nI am handing over my shift. Here are the key points:\n\n- Current stock levels: [Add details]\n- Any issues encountered: [Add details]\n- Special notes: [Add details]\n\nPlease review and continue with the operations.\n\nBest regards,\n[Your Name]',
          category: 'operations',
          created_by: adminId,
          is_active: true
        }
      ]);

    console.log('✅ Created message templates');

    // Seed email templates
    console.log('📧 Seeding email templates...');
    await supabase
      .from('email_templates')
      .insert([
        {
          name: 'Welcome Email',
          subject: 'Welcome to SMMS Supermarket!',
          html_content: '<h2>Welcome!</h2><p>Thank you for joining our family.</p>',
          text_content: 'Welcome! Thank you for joining our family.',
          category: 'welcome',
          variables: { customer_name: 'Customer Name', store_name: 'SMMS Supermarket' },
          is_active: true,
          created_by: adminId
        }
      ]);

    console.log('✅ Created email templates');

    // Seed cash drawers
    console.log('💰 Seeding cash drawers...');
    await supabase
      .from('cash_drawers')
      .insert([
        {
          user_id: cashierId,
          branch_id: branches?.[0]?.id,
          drawer_name: 'Main Register',
          status: 'closed',
          opening_balance: 100000.00,
          current_balance: 26200.00,
          expected_balance: 26200.00,
          opened_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date().toISOString(),
          reconciled_at: new Date().toISOString(),
          reconciled_by: managerId,
          notes: 'End of shift reconciliation completed'
        }
      ]);

    console.log('✅ Created cash drawers');

    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Branches: 2 additional');
    console.log('- Employees: 2 detailed profiles');
    console.log('- Suppliers: 2 with full details');
    console.log('- Products: 2 additional');
    console.log('- Purchase Orders: 1 with items');
    console.log('- Product Batches: 1 with quality inspection');
    console.log('- Customers: 2 additional');
    console.log('- Sales: 2 transactions with items and payments');
    console.log('- Gift Cards: 1 active card');
    console.log('- Customer Deposits: 1 active deposit');
    console.log('- Messages: 2 sample messages');
    console.log('- Templates: Email and message templates');
    console.log('- Cash Drawers: 1 reconciled drawer');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedCompleteDatabase().catch(console.error);