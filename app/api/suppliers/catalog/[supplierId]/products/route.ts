import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List supplier catalog products
export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const supplierId = params.supplierId;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('supplier_catalog')
      .select(`
        *,
        product:products(id, name, sku, category, image_url)
      `, { count: 'exact' })
      .eq('supplier_id', supplierId);

    if (activeOnly) query = query.eq('is_active', true);
    if (search) {
      query = query.or(`product.name.ilike.%${search}%,product.sku.ilike.%${search}%`);
    }
    if (category) query = query.eq('product.category', category);

    query = query
      .order('product_name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data: products, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching supplier catalog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add product to supplier catalog
export async function POST(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const supabase = await createClient();
    const supplierId = params.supplierId;
    const body = await request.json();

    // Check if product already exists in this supplier's catalog
    const { data: existing, error: checkError } = await supabase
      .from('supplier_catalog')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('product_id', body.product_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Product already exists in supplier catalog' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('supplier_catalog')
      .insert({
        supplier_id: supplierId,
        product_id: body.product_id,
        supplier_sku: body.supplier_sku,
        supplier_price: body.supplier_price,
        min_order_quantity: body.min_order_quantity || 1,
        lead_time_days: body.lead_time_days || 7,
        pack_size: body.pack_size || 1,
        is_active: body.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error adding product to supplier catalog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
