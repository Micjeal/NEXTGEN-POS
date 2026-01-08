import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get single catalog product
export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string; productId: string } }
) {
  try {
    const supabase = await createClient();
    const { supplierId, productId } = params;

    const { data: product, error } = await supabase
      .from('supplier_catalog')
      .select(`
        *,
        product:products(id, name, sku, category, description, image_url)
      `)
      .eq('id', productId)
      .eq('supplier_id', supplierId)
      .single();

    if (error) throw error;
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching catalog product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update catalog product
export async function PATCH(
  request: NextRequest,
  { params }: { params: { supplierId: string; productId: string } }
) {
  try {
    const supabase = await createClient();
    const { supplierId, productId } = params;
    const body = await request.json();

    const { data: product, error } = await supabase
      .from('supplier_catalog')
      .update({
        supplier_sku: body.supplier_sku,
        supplier_price: body.supplier_price,
        min_order_quantity: body.min_order_quantity,
        lead_time_days: body.lead_time_days,
        pack_size: body.pack_size,
        is_active: body.is_active,
        last_updated: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('supplier_id', supplierId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating catalog product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove product from catalog
export async function DELETE(
  request: NextRequest,
  { params }: { params: { supplierId: string; productId: string } }
) {
  try {
    const supabase = await createClient();
    const { supplierId, productId } = params;

    const { error } = await supabase
      .from('supplier_catalog')
      .delete()
      .eq('id', productId)
      .eq('supplier_id', supplierId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing product from catalog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
