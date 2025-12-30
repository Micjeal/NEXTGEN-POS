// scripts/seed-customers.js
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

// Customer data generators
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa', 'Robert', 'Maria',
  'William', 'Anna', 'Richard', 'Jennifer', 'Charles', 'Linda', 'Daniel', 'Patricia', 'Matthew', 'Barbara',
  'Anthony', 'Elizabeth', 'Mark', 'Susan', 'Steven', 'Margaret', 'Paul', 'Dorothy', 'Andrew', 'Helen',
  'Joshua', 'Nancy', 'Kevin', 'Betty', 'Brian', 'Karen', 'George', 'Donna', 'Edward', 'Carol',
  'Ronald', 'Ruth', 'Timothy', 'Sharon', 'Jason', 'Michelle', 'Jeffrey', 'Laura', 'Ryan', 'Sarah',
  'Jacob', 'Kimberly', 'Nicholas', 'Deborah', 'Eric', 'Amanda', 'Jonathan', 'Melissa', 'Stephen', 'Rebecca',
  'Larry', 'Stephanie', 'Justin', 'Sharon', 'Scott', 'Cynthia', 'Brandon', 'Kathleen', 'Benjamin', 'Amy',
  'Samuel', 'Shirley', 'Gregory', 'Angela', 'Alexander', 'Helen', 'Patrick', 'Anna', 'Jack', 'Brenda',
  'Dennis', 'Emma', 'Jerry', 'Marie', 'Tyler', 'Diana', 'Aaron', 'Catherine', 'Jose', 'Christine',
  'Adam', 'Frances', 'Nathan', 'Joyce', 'Henry', 'Virginia', 'Douglas', 'Ann', 'Peter', 'Martha',
  'Zachary', 'Betty', 'Kyle', 'Doris', 'Walter', 'Heather', 'Ethan', 'Jean', 'Jeremy', 'Victoria'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const streets = [
  'Main Street', 'Church Road', 'Market Avenue', 'Garden Lane', 'River Road', 'Hill Street', 'Park Avenue',
  'Station Road', 'Victoria Street', 'Queen Street', 'King Road', 'Prince Avenue', 'Duke Lane', 'Earl Street',
  'High Street', 'Low Road', 'North Avenue', 'South Lane', 'East Street', 'West Road', 'Central Avenue',
  'Industrial Road', 'Commercial Street', 'Residential Lane', 'Business Avenue', 'Shopping Road', 'Hospital Street',
  'School Lane', 'University Avenue', 'College Road', 'Library Street', 'Museum Lane', 'Park Road', 'Garden Avenue',
  'Forest Street', 'Lake Road', 'Mountain Lane', 'Valley Avenue', 'Plains Street', 'Desert Road', 'Ocean Lane'
];

const cities = [
  'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Masaka', 'Mukono', 'Nansana', 'Kira', 'Ssabagabo', 'Wakiso',
  'Gulu', 'Lira', 'Soroti', 'Arua', 'Kitgum', 'Hoima', 'Mbale', 'Tororo', 'Fort Portal', 'Busia'
];

const membershipTiers = ['bronze', 'silver', 'gold', 'platinum'];

function generateRandomPhone() {
  const prefixes = ['070', '071', '072', '073', '074', '075', '076', '077', '078', '079'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `+256${prefix}${number}`;
}

function generateRandomEmail(firstName, lastName, index) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

function generateRandomDateOfBirth() {
  const start = new Date(1950, 0, 1);
  const end = new Date(2005, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function generateCustomer(index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const dateOfBirth = generateRandomDateOfBirth();
  const phone = generateRandomPhone();
  const email = generateRandomEmail(firstName, lastName, index);
  const address = `Plot ${Math.floor(Math.random() * 1000) + 1}, ${streets[Math.floor(Math.random() * streets.length)]}`;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const membershipTier = membershipTiers[Math.floor(Math.random() * membershipTiers.length)];
  const totalSpent = Math.floor(Math.random() * 1000000); // 0 to 1,000,000 UGX
  const totalVisits = Math.floor(Math.random() * 100) + 1; // 1 to 100 visits
  const lastVisitDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
  const firstVisitDate = new Date(Date.now() - (Math.random() * 365 * 2 + 365) * 24 * 60 * 60 * 1000).toISOString(); // 1-2 years ago

  return {
    phone,
    email,
    full_name: fullName,
    date_of_birth: dateOfBirth,
    gender,
    address,
    city,
    country: 'Uganda',
    membership_tier: membershipTier,
    total_spent: totalSpent,
    total_visits: totalVisits,
    last_visit_date: lastVisitDate,
    first_visit_date: firstVisitDate,
    is_active: true,
    notes: null
  };
}

async function seedCustomers() {
  console.log('👥 Starting customer seeding...');

  try {
    // Check current customer count
    const { count: currentCount, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting customers:', countError.message);
      process.exit(1);
    }

    console.log(`👤 Current customers: ${currentCount || 0}`);

    // Generate 200 customers
    const customers = [];
    const targetTotal = 200;

    for (let i = 0; i < targetTotal; i++) {
      const customer = generateCustomer(i);
      customers.push(customer);
    }

    console.log(`🎯 Generating ${customers.length} customers...`);

    // Insert customers in batches to avoid payload size limits
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('customers')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        process.exit(1);
      }

      inserted += data.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(customers.length/batchSize)} (${inserted}/${customers.length})`);
    }

    console.log('\n🎉 Customer seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`- Customers created: ${customers.length}`);
    console.log(`- Total customers now: ${(currentCount || 0) + customers.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedCustomers().catch(console.error);