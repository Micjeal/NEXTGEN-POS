const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  console.log('Checking database data...');

  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .select('id, order_number, created_at')
    .limit(3);

  if (poError) {
    console.error('PO Error:', poError);
  } else {
    console.log('Purchase Orders:', po);
  }

  const { count: poCount, error: countError } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Count Error:', countError);
  } else {
    console.log('Total PO count:', poCount);
  }

  // Test the same query as the page
  const { data: pageData, error: pageError } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      supplier:suppliers(*),
      creator:profiles!created_by(*),
      approver:profiles!approved_by(*)
    `)
    .order("created_at", { ascending: false })
    .limit(3);

  if (pageError) {
    console.error('Page query error:', pageError);
  } else {
    console.log('Page query result:', pageData?.length, 'records');
    if (pageData && pageData.length > 0) {
      console.log('First record:', {
        id: pageData[0].id,
        order_number: pageData[0].order_number,
        supplier: pageData[0].supplier?.name,
        creator: pageData[0].creator?.full_name
      });
    }
  }
}

checkData().catch(console.error);