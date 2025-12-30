// scripts/seed-products.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
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

// Product data generators
const productTemplates = {
  'Beverages': {
    names: [
      'Coca-Cola', 'Pepsi', 'Sprite', 'Fanta Orange', 'Fanta Lemon', 'Mountain Dew',
      'Dr Pepper', '7-Up', 'Mirinda', 'Schweppes', 'Red Bull', 'Monster Energy',
      'Rockstar Energy', 'Gatorade', 'Powerade', 'Vitamin Water', 'Dasani Water',
      'Aquafina', 'Evian', 'Perrier', 'San Pellegrino', 'Fiji Water', 'Orange Juice',
      'Apple Juice', 'Pineapple Juice', 'Mango Juice', 'Guava Juice', 'Passion Fruit Juice',
      'Tomato Juice', 'Carrot Juice', 'Mixed Fruit Juice', 'Milk', 'Chocolate Milk',
      'Strawberry Milk', 'Banana Milk', 'Soy Milk', 'Almond Milk', 'Oat Milk',
      'Coconut Milk', 'Rice Milk', 'Yogurt Drink', 'Smoothie', 'Protein Shake',
      'Sports Drink', 'Energy Drink', 'Iced Tea', 'Green Tea', 'Black Tea',
      'Herbal Tea', 'Coffee', 'Instant Coffee', 'Ground Coffee', 'Espresso',
      'Cappuccino', 'Latte', 'Mocha', 'Hot Chocolate', 'Beer', 'Wine', 'Whiskey',
      'Vodka', 'Rum', 'Gin', 'Tequila', 'Brandy', 'Champagne', 'Sparkling Wine'
    ],
    sizes: ['250ml', '330ml', '355ml', '500ml', '600ml', '750ml', '1L', '1.5L', '2L', '3L'],
    basePrice: 1500,
    priceRange: 5000
  },
  'Dairy': {
    names: [
      'Whole Milk', 'Low Fat Milk', 'Skim Milk', 'Buttermilk', 'Cream', 'Heavy Cream',
      'Whipping Cream', 'Sour Cream', 'Greek Yogurt', 'Plain Yogurt', 'Vanilla Yogurt',
      'Strawberry Yogurt', 'Banana Yogurt', 'Mixed Berry Yogurt', 'Cheddar Cheese',
      'Mozzarella Cheese', 'Parmesan Cheese', 'Swiss Cheese', 'Gouda Cheese', 'Brie Cheese',
      'Blue Cheese', 'Feta Cheese', 'Goat Cheese', 'Cottage Cheese', 'Ricotta Cheese',
      'Cream Cheese', 'Butter', 'Margarine', 'Ghee', 'Ice Cream', 'Vanilla Ice Cream',
      'Chocolate Ice Cream', 'Strawberry Ice Cream', 'Mint Chocolate Ice Cream', 'Cookie Dough Ice Cream',
      'Pistachio Ice Cream', 'Rocky Road Ice Cream', 'Neapolitan Ice Cream', 'Frozen Yogurt',
      'Sherbet', 'Sorbet', 'Milk Powder', 'Cheese Spread', 'Cheese Slices', 'String Cheese',
      'Cheese Cubes', 'Lactose Free Milk', 'Organic Milk', 'Raw Milk', 'Condensed Milk',
      'Evaporated Milk', 'Whipped Cream', 'Custard', 'Pudding', 'Flan', 'Mousse'
    ],
    sizes: ['200ml', '250ml', '330ml', '500ml', '750ml', '1kg', '500g', '250g', '100g'],
    basePrice: 2000,
    priceRange: 8000
  },
  'Snacks': {
    names: [
      'Potato Chips', 'Tortilla Chips', 'Corn Chips', 'Cheese Puffs', 'Onion Rings',
      'Pretzels', 'Popcorn', 'Microwave Popcorn', 'Trail Mix', 'Mixed Nuts',
      'Peanuts', 'Cashews', 'Almonds', 'Walnuts', 'Pistachios', 'Chocolate Bar',
      'Candy Bar', 'Gummy Bears', 'Jelly Beans', 'Hard Candy', 'Lollipop',
      'Chewing Gum', 'Bubble Gum', 'Crackers', 'Saltine Crackers', 'Graham Crackers',
      'Rice Cakes', 'Corn Cakes', 'Oatmeal Cookies', 'Chocolate Chip Cookies',
      'Sugar Cookies', 'Shortbread Cookies', 'Biscuits', 'Wafer Cookies', 'Cream Filled Cookies',
      'Fruit Snacks', 'Dried Fruit', 'Dried Apricots', 'Dried Mango', 'Dried Pineapple',
      'Raisins', 'Cranberries', 'Blueberries', 'Granola Bar', 'Protein Bar',
      'Energy Bar', 'Cereal Bar', 'Fruit Bar', 'Nut Bar', 'Seed Mix',
      'Beef Jerky', 'Turkey Jerky', 'Pork Rinds', 'Cheese Sticks', 'Yogurt Covered Nuts',
      'Chocolate Covered Almonds', 'Caramel Popcorn', 'Cheese Balls', 'Pita Chips',
      'Vegetable Chips', 'Sweet Potato Chips', 'Kale Chips', 'Seaweed Snacks'
    ],
    sizes: ['50g', '100g', '150g', '200g', '250g', '300g', '400g', '500g', '1kg'],
    basePrice: 1000,
    priceRange: 3000
  },
  'Fresh Produce': {
    names: [
      'Apples', 'Bananas', 'Oranges', 'Grapes', 'Strawberries', 'Blueberries',
      'Raspberries', 'Blackberries', 'Pineapple', 'Mango', 'Papaya', 'Kiwi',
      'Watermelon', 'Cantaloupe', 'Honeydew', 'Grapefruit', 'Lemons', 'Limes',
      'Pears', 'Peaches', 'Plums', 'Cherries', 'Avocado', 'Tomatoes', 'Cucumbers',
      'Lettuce', 'Spinach', 'Kale', 'Broccoli', 'Cauliflower', 'Carrots', 'Potatoes',
      'Sweet Potatoes', 'Onions', 'Garlic', 'Ginger', 'Bell Peppers', 'Chili Peppers',
      'Eggplant', 'Zucchini', 'Squash', 'Cabbage', 'Green Beans', 'Peas',
      'Corn', 'Asparagus', 'Artichokes', 'Brussels Sprouts', 'Celery', 'Radishes',
      'Beets', 'Turnips', 'Parsnips', 'Leeks', 'Scallions', 'Herbs', 'Basil',
      'Parsley', 'Cilantro', 'Mint', 'Thyme', 'Rosemary', 'Oregano', 'Sage',
      'Dill', 'Chives', 'Tarragon', 'Lavender', 'Lemongrass', 'Coriander'
    ],
    sizes: ['1kg', '500g', '250g', '100g', 'each', 'bunch', 'head', 'clove'],
    basePrice: 500,
    priceRange: 2000
  }
};

function generateRandomBarcode() {
  return Math.floor(Math.random() * 9000000000000) + 1000000000000;
}

function generateProduct(category, categoryId, index) {
  const template = productTemplates[category];
  const nameIndex = index % template.names.length;
  const sizeIndex = Math.floor(index / template.names.length) % template.sizes.length;

  const baseName = template.names[nameIndex];
  const size = template.sizes[sizeIndex];
  const fullName = `${baseName} ${size}`;

  const price = template.basePrice + Math.floor(Math.random() * template.priceRange);
  const costPrice = Math.floor(price * 0.7); // 70% of selling price
  const taxRate = category === 'Beverages' ? 8.0 : 0.0; // Beverages have tax

  return {
    name: fullName,
    barcode: generateRandomBarcode().toString(),
    category_id: categoryId,
    price: price,
    cost_price: costPrice,
    tax_rate: taxRate,
    is_active: true,
    image_url: null
  };
}

async function seedProducts() {
  console.log('🌱 Starting product seeding...');

  try {
    // Get existing categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name');

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message);
      process.exit(1);
    }

    if (!categories || categories.length === 0) {
      console.error('❌ No categories found. Please run database setup first');
      process.exit(1);
    }

    console.log(`📂 Found ${categories.length} categories:`, categories.map(c => c.name).join(', '));

    // Check current product count
    const { count: currentCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting products:', countError.message);
      process.exit(1);
    }

    console.log(`📦 Current products: ${currentCount || 0}`);

    // Generate 500 products
    const products = [];
    const targetTotal = 500;
    const productsPerCategory = Math.floor(targetTotal / categories.length);
    const remainder = targetTotal % categories.length;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const count = productsPerCategory + (i < remainder ? 1 : 0);

      for (let j = 0; j < count; j++) {
        const product = generateProduct(category.name, category.id, j);
        products.push(product);
      }
    }

    console.log(`🎯 Generating ${products.length} products...`);

    // Insert products in batches to avoid payload size limits
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        process.exit(1);
      }

      inserted += data.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)} (${inserted}/${products.length})`);
    }

    // Create inventory entries for all products
    console.log('📊 Creating inventory entries...');
    const { data: allProducts, error: prodError } = await supabase
      .from('products')
      .select('id');

    if (prodError) {
      console.error('❌ Error fetching products for inventory:', prodError.message);
      process.exit(1);
    }

    const inventoryEntries = allProducts.map(product => ({
      product_id: product.id,
      quantity: Math.floor(Math.random() * 100) + 10, // 10-110 units
      min_stock_level: 5,
      max_stock_level: 200
    }));

    // Insert inventory in batches
    for (let i = 0; i < inventoryEntries.length; i += batchSize) {
      const batch = inventoryEntries.slice(i, i + batchSize);
      const { error } = await supabase
        .from('inventory')
        .upsert(batch);

      if (error) {
        console.error(`❌ Error inserting inventory batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        process.exit(1);
      }
    }

    console.log(`✅ Created inventory for ${allProducts.length} products`);

    console.log('\n🎉 Product seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`- Products created: ${products.length}`);
    console.log(`- Inventory entries: ${allProducts.length}`);
    console.log(`- Categories used: ${categories.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedProducts().catch(console.error);