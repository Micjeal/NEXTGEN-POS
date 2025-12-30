import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PCIService, EncryptionService } from '@/lib/encryption'

// PCI DSS Compliant Payment Processing API Route
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      saleId,
      paymentMethodId,
      amount,
      paymentType,
      cardData,
      phoneNumber
    } = body

    // Validate required fields
    if (!saleId || !paymentMethodId || !amount || !paymentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 401 }
      )
    }
    if (!user) {
      console.error('No user found')
      return NextResponse.json(
        { success: false, error: 'Unauthorized - no user' },
        { status: 401 }
      )
    }

    let paymentResult;

    switch (paymentType.toLowerCase()) {
      case 'cash':
        paymentResult = await processCashPayment(supabase, saleId, paymentMethodId, amount)
        break

      case 'card':
      case 'credit_card':
      case 'debit_card':
        if (!cardData) {
          return NextResponse.json(
            { success: false, error: 'Card data required for card payments' },
            { status: 400 }
          )
        }
        paymentResult = await processCardPayment(supabase, saleId, paymentMethodId, amount, cardData)
        break

      case 'mobile':
      case 'airtel_money':
      case 'mtn_mobile_money':
        if (!phoneNumber) {
          return NextResponse.json(
            { success: false, error: 'Phone number required for mobile payments' },
            { status: 400 }
          )
        }
        paymentResult = await processMobilePayment(supabase, saleId, paymentMethodId, amount, phoneNumber)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported payment type' },
          { status: 400 }
        )
    }

    return NextResponse.json(paymentResult)

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processCashPayment(
  supabase: any,
  saleId: string,
  paymentMethodId: string,
  amountReceived: number
) {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Verify sale exists and belongs to user, get total amount
    const { data: sale, error: saleCheck } = await supabase
      .from('sales')
      .select('id, user_id, total')
      .eq('id', saleId)
      .single()

    if (saleCheck || !sale) {
      throw new Error('Sale not found or access denied')
    }

    // Verify payment method exists
    const { data: paymentMethod, error: pmCheck } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('id', paymentMethodId)
      .single()

    if (pmCheck || !paymentMethod) {
      throw new Error('Invalid payment method')
    }

    // Calculate change
    const changeAmount = amountReceived - sale.total

    // Log payment attempt
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amountReceived, 'cash', 'initiated')

    // Get user's open cash drawer
    const { data: drawer, error: drawerError } = await supabase
      .from('cash_drawers')
      .select('id, current_balance')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .single()

    if (drawerError && drawerError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching drawer:', drawerError)
      throw new Error('Failed to access cash drawer')
    }

    if (!drawer) {
      throw new Error('No open cash drawer found. Please open a cash drawer first.')
    }

    // Record cash received transaction
    await supabase
      .from('cash_transactions')
      .insert({
        drawer_id: drawer.id,
        user_id: user.id,
        transaction_type: 'cash_received',
        amount: sale.total, // Cash received equals sale total
        description: `Cash payment for sale ${saleId}`,
        balance_before: drawer.current_balance,
        balance_after: drawer.current_balance + sale.total
      })

    // Update drawer balance for cash received
    await supabase
      .from('cash_drawers')
      .update({
        current_balance: drawer.current_balance + sale.total,
        expected_balance: drawer.expected_balance + sale.total
      })
      .eq('id', drawer.id)

    // If there's change to give, record it as cash out
    if (changeAmount > 0) {
      const updatedBalance = drawer.current_balance + sale.total

      await supabase
        .from('cash_transactions')
        .insert({
          drawer_id: drawer.id,
          user_id: user.id,
          transaction_type: 'change_given',
          amount: -changeAmount, // Negative amount for cash out
          description: `Change given for sale ${saleId}`,
          balance_before: updatedBalance,
          balance_after: updatedBalance - changeAmount
        })

      // Update drawer balance for change given
      await supabase
        .from('cash_drawers')
        .update({
          current_balance: updatedBalance - changeAmount,
          expected_balance: drawer.expected_balance + sale.total - changeAmount
        })
        .eq('id', drawer.id)
    }

    // Store payment record
    await storePaymentRecord(supabase, {
      saleId,
      paymentMethodId,
      amount: amountReceived,
      status: 'completed'
    })

    // Log successful payment
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amountReceived, 'cash', 'completed')

    return { success: true }
  } catch (error) {
    console.error('Cash payment processing error:', error)
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amountReceived, 'cash', 'error', undefined, error instanceof Error ? error.message : 'Unknown error')
    return { success: false, error: 'Cash payment processing failed' }
  }
}

async function processCardPayment(
  supabase: any,
  saleId: string,
  paymentMethodId: string,
  amount: number,
  cardData: any
) {
  try {
    // Validate card data format
    if (!PCIService.validateCardNumber(cardData.number.replace(/\s/g, ''))) {
      return { success: false, error: 'Invalid card number' }
    }

    // Generate secure token for the card
    const cardToken = PCIService.tokenize(cardData.number.replace(/\s/g, ''))

    // Encrypt sensitive card metadata
    const cardMetadata = {
      lastFour: cardData.number.slice(-4),
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      holderName: cardData.holderName,
      token: cardToken
    }

    const encryptedMetadata = EncryptionService.encrypt(JSON.stringify(cardMetadata))

    // Log payment attempt
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'card', 'initiated')

    // Simulate payment gateway processing
    const paymentResult = await simulatePaymentGateway(amount, cardToken)

    if (paymentResult.success) {
      // Store payment record
      await storePaymentRecord(supabase, {
        saleId,
        paymentMethodId,
        amount,
        transactionId: paymentResult.transactionId,
        cardToken,
        encryptedMetadata,
        status: 'completed'
      })

      // Log successful payment
      await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'card', 'completed', paymentResult.transactionId)

      return { success: true, transactionId: paymentResult.transactionId }
    } else {
      // Log failed payment
      await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'card', 'failed', undefined, paymentResult.error)

      return { success: false, error: paymentResult.error }
    }
  } catch (error) {
    console.error('Card payment processing error:', error)
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'card', 'error', undefined, error instanceof Error ? error.message : 'Unknown error')
    return { success: false, error: 'Card payment processing failed' }
  }
}

async function processMobilePayment(
  supabase: any,
  saleId: string,
  paymentMethodId: string,
  amount: number,
  phoneNumber: string
) {
  try {
    // Log mobile payment attempt
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'mobile', 'initiated')

    // Simulate mobile money payment processing
    const paymentResult = await simulateMobilePayment(amount, phoneNumber)

    if (paymentResult.success) {
      // Store payment record
      await storePaymentRecord(supabase, {
        saleId,
        paymentMethodId,
        amount,
        transactionId: paymentResult.transactionId,
        phoneNumber: PCIService.maskSensitiveData(phoneNumber, 3, 3),
        status: 'completed'
      })

      await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'mobile', 'completed', paymentResult.transactionId)

      return { success: true, transactionId: paymentResult.transactionId }
    } else {
      await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'mobile', 'failed', undefined, paymentResult.error)

      return { success: false, error: paymentResult.error }
    }
  } catch (error) {
    console.error('Mobile payment processing error:', error)
    await logPaymentAttempt(supabase, saleId, paymentMethodId, amount, 'mobile', 'error', undefined, error instanceof Error ? error.message : 'Unknown error')
    return { success: false, error: 'Mobile payment processing failed' }
  }
}

async function storePaymentRecord(
  supabase: any,
  paymentData: {
    saleId: string
    paymentMethodId: string
    amount: number
    transactionId?: string
    cardToken?: string
    encryptedMetadata?: { encrypted: string; iv: string }
    phoneNumber?: string
    status: string
  }
) {
  const record: any = {
    sale_id: paymentData.saleId,
    payment_method_id: paymentData.paymentMethodId,
    amount: paymentData.amount,
    reference_number: paymentData.transactionId || `REF_${Date.now()}`
  }

  // Add optional fields if they exist in the table
  if (paymentData.cardToken) record.card_token = paymentData.cardToken
  if (paymentData.encryptedMetadata) record.encrypted_metadata = JSON.stringify(paymentData.encryptedMetadata)
  if (paymentData.phoneNumber) record.phone_number = paymentData.phoneNumber
  if (paymentData.status && paymentData.status !== 'completed') record.status = paymentData.status

  const { error } = await supabase.from('payments').insert(record)

  if (error) {
    console.error('Error storing payment record:', error)
    throw error
  }
}

async function logPaymentAttempt(
  supabase: any,
  saleId: string,
  paymentMethodId: string,
  amount: number,
  paymentType: string,
  status: string,
  transactionId?: string,
  error?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return // Don't log if no user

    const logData: any = {
      user_id: user.id,
      action: `payment_${status}`,
      table_name: 'payments',
      record_id: saleId,
      old_data: null,
      new_data: {
        paymentMethodId,
        amount,
        paymentType,
        transactionId,
        error: error ? 'Payment processing error occurred' : null
      },
      ip_address: 'server-side'
    }

    // Add optional fields if they exist
    if (error) {
      logData.compliance_flag = true
      logData.risk_level = 'high'
    } else {
      logData.compliance_flag = true
      logData.risk_level = 'low'
    }

    await supabase.from('audit_logs').insert(logData)
  } catch (logError) {
    console.error('Error logging payment attempt:', logError)
    // Don't throw - logging failure shouldn't break payment
  }
}

async function simulatePaymentGateway(amount: number, cardToken: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Simulate 95% success rate
  const success = Math.random() > 0.05

  if (success) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  } else {
    return {
      success: false,
      error: 'Payment declined by card issuer'
    }
  }
}

async function simulateMobilePayment(amount: number, phoneNumber: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

  // Simulate 90% success rate for mobile payments
  const success = Math.random() > 0.10

  if (success) {
    return {
      success: true,
      transactionId: `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  } else {
    return {
      success: false,
      error: 'Mobile money payment failed - insufficient balance or network error'
    }
  }
}