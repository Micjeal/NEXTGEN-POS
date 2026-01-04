import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  return NextResponse.json({ message: 'GET method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shipping_address, payment_method, notes, order_type } = body

    // Validate required fields
    if (!shipping_address || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Get registered customer with all necessary fields
    const { data: registeredCustomer, error: regError } = await serviceClient
      .from('registered_customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (regError || !registeredCustomer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Get or create customer profile
    let { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('*')
      .eq('registered_customer_id', registeredCustomer.id)
      .single()

    if (customerError && customerError.code === 'PGRST116') { // Not found
      // Create customer record
      const { data: newCustomer, error: createError } = await serviceClient
        .from('customers')
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
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 })
      }
      customer = newCustomer
    } else if (customerError) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await serviceClient
      .from('customer_cart')
      .select(`
        *,
        product:products(*)
      `)
      .eq('customer_id', customer.id)

    if (cartError) {
      console.error('Error fetching cart:', cartError)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0
    const saleItems = []

    for (const item of cartItems) {
      const product = item.product
      if (!product) continue

      const lineTotal = item.quantity * product.price
      const itemTax = lineTotal * (product.tax_rate / 100)

      subtotal += lineTotal
      taxAmount += itemTax

      saleItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        tax_rate: product.tax_rate,
        tax_amount: itemTax,
        discount_amount: 0,
        line_total: lineTotal,
      })
    }

    const total = subtotal + taxAmount

    // Generate invoice number
    const invoiceNumber = `ONL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create the sale record with pending status for online orders
    const saleData = {
      id: uuidv4(),
      invoice_number: invoiceNumber,
      user_id: user.id,
      customer_id: customer.id,
      order_type: order_type || 'online',
      subtotal: subtotal,
      tax_amount: taxAmount,
      discount_amount: 0,
      total: total,
      status: 'pending', // Online orders start as pending for admin approval
      notes: notes || null,
      shipping_address: shipping_address,
      payment_method: payment_method,
    }

    const { data: sale, error: saleError } = await serviceClient
      .from('sales')
      .insert(saleData)
      .select()
      .single()

    if (saleError) {
      console.error('Error creating sale:', saleError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create sale items
    const saleItemsData = saleItems.map(item => ({
      id: uuidv4(),
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      discount_amount: item.discount_amount,
      line_total: item.line_total,
    }))

    const { error: itemsError } = await serviceClient
      .from('sale_items')
      .insert(saleItemsData)

    if (itemsError) {
      console.error('Error creating sale items:', itemsError)
      // Don't fail the whole request, but log it
    }

    // Get payment method ID - map frontend values to database names
    let paymentMethodId = null
    if (payment_method) {
      // Map frontend payment method values to database names
      const paymentMethodMapping: { [key: string]: string } = {
        'cash_on_delivery': 'Cash',
        'card': 'Card',
        'mobile_money': 'Mobile Payment',
        'bank_transfer': 'Bank Transfer'
      }

      const dbPaymentMethodName = paymentMethodMapping[payment_method] || payment_method

      const { data: paymentMethodData, error: pmError } = await serviceClient
        .from('payment_methods')
        .select('id')
        .eq('name', dbPaymentMethodName)
        .single()

      if (!pmError && paymentMethodData) {
        paymentMethodId = paymentMethodData.id
      } else {
        // If payment method doesn't exist, create it
        const { data: newPaymentMethod, error: createPmError } = await serviceClient
          .from('payment_methods')
          .insert({ name: dbPaymentMethodName, is_active: true })
          .select('id')
          .single()

        if (!createPmError && newPaymentMethod) {
          paymentMethodId = newPaymentMethod.id
        }
      }
    }

    // Create payment record
    const paymentData = {
      id: uuidv4(),
      sale_id: sale.id,
      payment_method_id: paymentMethodId,
      amount: total,
      reference_number: `PAY-${Date.now()}`,
    }

    const { error: paymentError } = await serviceClient
      .from('payments')
      .insert(paymentData)

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      // Don't fail the whole request
    }

    // Clear the cart
    const { error: clearError } = await serviceClient
      .from('customer_cart')
      .delete()
      .eq('customer_id', customer.id)

    if (clearError) {
      console.error('Error clearing cart:', clearError)
      // Don't fail the whole request
    }

    // Update inventory (reduce stock) - commented out since function doesn't exist
    // for (const item of cartItems) {
    //   const { error: inventoryError } = await serviceClient.rpc('decrement_inventory', {
    //     product_id: item.product_id,
    //     quantity: item.quantity
    //   })

    //   if (inventoryError) {
    //     console.error('Error updating inventory:', inventoryError)
    //   }
    // }

    return NextResponse.json({
      orderId: sale.id,
      invoiceNumber: sale.invoice_number,
      message: 'Order placed successfully. Waiting for admin approval.'
    }, { status: 201 })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
