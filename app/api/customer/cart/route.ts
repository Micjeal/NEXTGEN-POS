import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer data
    const { data: registeredCustomer } = await supabase
      .from("registered_customers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single();

    let customerRecord = customer;
    if (!customerRecord) {
      // Create customer record
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          phone: registeredCustomer.phone,
          email: registeredCustomer.email,
          full_name: registeredCustomer.full_name,
          date_of_birth: registeredCustomer.date_of_birth,
          gender: registeredCustomer.gender,
          address: registeredCustomer.address,
          city: registeredCustomer.city,
          country: registeredCustomer.country,
          registered_customer_id: registeredCustomer.id,
          first_visit_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 });
      }
      customerRecord = newCustomer;
    }

    // Get cart items with product details
    const { data: cartItems, error } = await supabase
      .from('customer_cart')
      .select(`
        id,
        product_id,
        quantity,
        added_at,
        updated_at,
        products (
          id,
          name,
          price,
          image_url,
          categories (
            name
          )
        )
      `)
      .eq('customer_id', customerRecord!.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart:', error);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    // Calculate totals
    const items = (cartItems as any)?.map((item: any) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        id: item.id,
        product_id: item.product_id,
        name: product?.name || 'Unknown Product',
        description: '',
        price: product?.price || 0,
        image_url: product?.image_url || '',
        stock_quantity: 10, // Default stock for demo
        category: product?.categories?.name || 'Uncategorized',
        quantity: item.quantity,
        subtotal: (product?.price || 0) * item.quantity,
        added_at: item.added_at,
        updated_at: item.updated_at,
      };
    }).filter(Boolean) || [];

    const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return NextResponse.json({
      items,
      total,
      itemCount,
    });
  } catch (error) {
    console.error('Error in GET /api/customer/cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer data
    const { data: registeredCustomer } = await supabase
      .from("registered_customers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single();

    let customerRecord = customer;
    if (!customerRecord) {
      // Create customer record
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          phone: registeredCustomer.phone,
          email: registeredCustomer.email,
          full_name: registeredCustomer.full_name,
          date_of_birth: registeredCustomer.date_of_birth,
          gender: registeredCustomer.gender,
          address: registeredCustomer.address,
          city: registeredCustomer.city,
          country: registeredCustomer.country,
          registered_customer_id: registeredCustomer.id,
          first_visit_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 });
      }
      customerRecord = newCustomer;
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId || quantity < 1) {
      return NextResponse.json({ error: 'Invalid product ID or quantity' }, { status: 400 });
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
    }

    // For demo purposes, assume sufficient stock
    // In production, you would check inventory table
    const availableStock = 1000;
    if (availableStock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('customer_cart')
      .select('id, quantity')
      .eq('customer_id', customerRecord!.id)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking cart:', checkError);
      return NextResponse.json({ error: 'Failed to check cart' }, { status: 500 });
    }

    let result;
    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        return NextResponse.json({ error: 'Insufficient stock for requested quantity' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('customer_cart')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select();

      if (error) {
        console.error('Error updating cart:', error);
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
      }
      result = data;
    } else {
      // Add new item
      const { data, error } = await supabase
        .from('customer_cart')
        .insert({
          customer_id: customerRecord!.id,
          product_id: productId,
          quantity,
        })
        .select();

      if (error) {
        console.error('Error adding to cart:', error);
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, item: result?.[0] });
  } catch (error) {
    console.error('Error in POST /api/customer/cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer data
    const { data: registeredCustomer } = await supabase
      .from("registered_customers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single();

    let customerRecord = customer;
    if (!customerRecord) {
      // Create customer record
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          phone: registeredCustomer.phone,
          email: registeredCustomer.email,
          full_name: registeredCustomer.full_name,
          date_of_birth: registeredCustomer.date_of_birth,
          gender: registeredCustomer.gender,
          address: registeredCustomer.address,
          city: registeredCustomer.city,
          country: registeredCustomer.country,
          registered_customer_id: registeredCustomer.id,
          first_visit_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 });
      }
      customerRecord = newCustomer;
    }

    const { productId, quantity } = await request.json();

    if (!productId || quantity < 0) {
      return NextResponse.json({ error: 'Invalid product ID or quantity' }, { status: 400 });
    }

    if (quantity === 0) {
      // Remove item from cart
      const { error } = await supabase
        .from('customer_cart')
        .delete()
        .eq('customer_id', customerRecord!.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from cart:', error);
        return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
      }
    } else {
      // Check if product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
      }

      // For demo purposes, assume sufficient stock
      const availableStock = 1000;
      if (availableStock < quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }

      // Update quantity
      const { error } = await supabase
        .from('customer_cart')
        .update({
          quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customerRecord!.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error updating cart:', error);
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/customer/cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer data
    const { data: registeredCustomer } = await supabase
      .from("registered_customers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single();

    let customerRecord = customer;
    if (!customerRecord) {
      // Create customer record
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          phone: registeredCustomer.phone,
          email: registeredCustomer.email,
          full_name: registeredCustomer.full_name,
          date_of_birth: registeredCustomer.date_of_birth,
          gender: registeredCustomer.gender,
          address: registeredCustomer.address,
          city: registeredCustomer.city,
          country: registeredCustomer.country,
          registered_customer_id: registeredCustomer.id,
          first_visit_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 });
      }
      customerRecord = newCustomer;
    }

    const { error } = await supabase
      .from('customer_cart')
      .delete()
      .eq('customer_id', customerRecord!.id);

    if (error) {
      console.error('Error clearing cart:', error);
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/customer/cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}