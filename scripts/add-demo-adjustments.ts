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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addDemoAdjustments() {
  console.log('🚀 Adding demo inventory adjustments...');

  try {
    // Get existing products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .limit(5);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      throw new Error('No products found. Please create some products first.');
    }

    // Get existing users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .limit(2);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      throw new Error('No users found. Please create some users first.');
    }

    console.log(`📊 Found ${products.length} products and ${users.length} users`);

    // Create demo adjustments
    const adjustments = [];
    for (let i = 0; i < 5; i++) {
      const product = products[i % products.length];
      const user = users[i % users.length];
      const quantityChange = Math.floor(Math.random() * 20) + 1;
      const adjustmentType = i % 2 === 0 ? 'add' : 'remove';

      // Get current inventory
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', product.id)
        .single();

      const currentQty = currentInventory?.quantity || 0;
      const newQty = adjustmentType === 'add' ? currentQty + quantityChange : Math.max(0, currentQty - quantityChange);

      adjustments.push({
        product_id: product.id,
        user_id: user.id,
        adjustment_type: adjustmentType,
        quantity_change: adjustmentType === 'add' ? quantityChange : -quantityChange,
        quantity_before: currentQty,
        quantity_after: newQty,
        reason: `Demo ${adjustmentType} adjustment for ${product.name}`,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() // Spread over last few days
      });

      // Update inventory
      await supabase
        .from('inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('product_id', product.id);
    }

    // Insert adjustments
    const { error: insertError } = await supabase
      .from('inventory_adjustments')
      .insert(adjustments);

    if (insertError) throw insertError;

    console.log('✅ Successfully added demo inventory adjustments');
    console.log(`Created ${adjustments.length} adjustment records`);

  } catch (error) {
    console.error('❌ Error adding demo adjustments:', error.message);
    process.exit(1);
  }
}

// Run the script
addDemoAdjustments();