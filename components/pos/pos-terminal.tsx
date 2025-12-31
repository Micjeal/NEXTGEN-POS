"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Product, PaymentMethod, CartItem } from "@/lib/types/database"
import { ProductSearch } from "./product-search"
import { CartDisplay } from "./cart-display"
import { PaymentPanel } from "./payment-panel"
import { InvoiceModal } from "./invoice-modal"
import { CustomerLookup } from "./customer-lookup"
import { calculateCartTotals } from "@/lib/utils/cart"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  RefreshCw, ShoppingCart, CreditCard, Search, User, Scan,
  Package, DollarSign, Plus, Minus, Trash2, CheckCircle, XCircle, AlertTriangle, Award
} from "lucide-react"

interface Customer {
  id: string
  phone: string | null
  email: string | null
  full_name: string
  membership_tier: string
  total_spent: number
  total_visits: number
  last_visit_date: string | null
  registered_customer_id?: string | null
}

interface POSTerminalProps {
   products: Product[]
   paymentMethods: PaymentMethod[]
   currency: string
 }

export function POSTerminal({ products: initialProducts, paymentMethods, currency }: POSTerminalProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedLoyaltyProgram, setSelectedLoyaltyProgram] = useState<any>(null)
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [pointsToEarn, setPointsToEarn] = useState(0)
  const [lastSale, setLastSale] = useState<{
    invoiceNumber: string
    items: CartItem[]
    totals: ReturnType<typeof calculateCartTotals>
    paymentMethod: string
    customer?: Customer
    pointsEarned?: number
  } | null>(null)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [insufficientFundsDialogOpen, setInsufficientFundsDialogOpen] = useState(false)
  const [requiredChange, setRequiredChange] = useState(0)
  const [addCashAmount, setAddCashAmount] = useState("")
  const [addCashDescription, setAddCashDescription] = useState("")
  const [showAddCashForm, setShowAddCashForm] = useState(false)
  const [manualDiscount, setManualDiscount] = useState(0)
  const [previousManualDiscount, setPreviousManualDiscount] = useState(0)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const totals = calculateCartTotals(cartItems)

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Function to refresh products
  const refreshProducts = useCallback(async () => {
    setIsRefreshing(true)
    console.log('POSTerminal: Starting to refresh products via API...')
    try {
      const response = await fetch('/api/products', {
        cache: 'no-store' // Ensure fresh data
      })
      const data = response.ok ? await response.json() : { products: [] }
      const products = data.products || []

      console.log('POSTerminal: Refresh result:', { products: products?.length || 0, error: !response.ok ? data.error : null })
      if (!response.ok) throw new Error(data.error || 'Failed to fetch products')

      if (products) {
        setProducts(products as Product[])
        toast({
          title: 'Products Refreshed',
          description: 'The product list has been updated.'
        })
      }
    } catch (error) {
      console.error('POSTerminal: Refresh error:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh products',
        variant: 'destructive'
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  // Auto-refresh products every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshProducts, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [refreshProducts])

  // Auto-focus barcode input
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  // Fetch available loyalty programs
  const fetchLoyaltyPrograms = async () => {
    try {
      const response = await fetch('/api/loyalty/programs')
      if (response.ok) {
        const { programs } = await response.json()
        setAvailablePrograms(programs || [])
        // Set default program if available
        if (programs && programs.length > 0 && !selectedLoyaltyProgram) {
          setSelectedLoyaltyProgram(programs[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch loyalty programs:', error)
    }
  }

  // Fetch programs on component mount
  useEffect(() => {
    fetchLoyaltyPrograms()
  }, [])

  const addToCart = useCallback(
    (product: Product) => {
      // Check stock
      const currentInCart = cartItems.find((item) => item.product.id === product.id)
      const currentQty = currentInCart?.quantity || 0
      const availableStock = product.inventory?.quantity || 0

      if (currentQty >= availableStock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${availableStock} units available for ${product.name}`,
          variant: "destructive",
        })
        return
      }

      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id)
        if (existing) {
          return prev.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        }
        return [...prev, { product, quantity: 1, discount: 0 }]
      })

      // Show success feedback
      toast({
        title: "Added to Cart",
        description: `${product.name} added successfully`,
      })
    },
    [cartItems, toast],
  )

  const handleBarcodeSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const product = products.find((p) => p.barcode === barcodeInput.trim())
      if (product) {
        addToCart(product)
        setBarcodeInput("")
      } else {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${barcodeInput}`,
          variant: "destructive",
        })
      }
      barcodeRef.current?.focus()
    },
    [barcodeInput, products, addToCart, toast],
  )

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const item = cartItems.find((item) => item.product.id === productId)
    const availableStock = item?.product.inventory?.quantity || 0

    if (quantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableStock} units available`,
        variant: "destructive",
      })
      return
    }

    setCartItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCartItems([])
    barcodeRef.current?.focus()
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
    })
  }

  const handlePointsRedemption = async (points: number, discount: number) => {
    if (!selectedCustomer) return

    try {
      // Check if customer exists and is registered
      let customerId = selectedCustomer.id
      const existingCustomer = await supabase
        .from("customers")
        .select("id, registered_customer_id")
        .eq("id", selectedCustomer.id)
        .single()

      if (!existingCustomer.data) {
        toast({
          title: "Redemption Failed",
          description: "Customer record not found",
          variant: "destructive",
        })
        return
      }

      if (!existingCustomer.data.registered_customer_id) {
        toast({
          title: "Redemption Failed",
          description: "Only registered customers can redeem loyalty points",
          variant: "destructive",
        })
        return
      }

      customerId = existingCustomer.data.id

      // Get loyalty account
      const { data: account } = await supabase
        .from("customer_loyalty_accounts")
        .select("id, current_points, total_points_redeemed")
        .eq("customer_id", customerId)
        .single()

      if (!account || account.current_points < points) {
        toast({
          title: "Insufficient Points",
          description: "Customer doesn't have enough loyalty points",
          variant: "destructive",
        })
        return
      }

      // Create redemption transaction
      const newBalance = account.current_points - points
      await supabase
        .from("loyalty_transactions")
        .insert({
          customer_loyalty_account_id: account.id,
          transaction_type: "redeem",
          points: -points, // Negative for redemption
          points_balance_after: newBalance,
          reason: `Redemption for discount: ${currency} ${discount}`,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })

      // Update account balance
      await supabase
        .from("customer_loyalty_accounts")
        .update({
          current_points: newBalance,
          total_points_redeemed: account.total_points_redeemed + points
        })
        .eq("id", account.id)

      // Apply discount to cart
      setCartItems(prev => prev.map(item => ({
        ...item,
        discount: item.discount + (discount * (item.product.price * item.quantity) / totals.subtotal)
      })))

      setLoyaltyPoints(newBalance)

      toast({
        title: "Points Redeemed",
        description: `Redeemed ${points} points for ${currency} ${discount} discount`,
      })
    } catch (error) {
      console.error('Points redemption error:', error)
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem loyalty points",
        variant: "destructive",
      })
    }
  }

  const applyManualDiscount = (discount: number) => {
    if (discount < 0) return
    const discountDifference = discount - previousManualDiscount
    if (discountDifference === 0) return
    const currentSubtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    if (currentSubtotal === 0) return
    setCartItems(prev => prev.map(item => {
      const itemSubtotal = item.product.price * item.quantity
      const proportion = itemSubtotal / currentSubtotal
      const additionalDiscount = discountDifference * proportion
      return { ...item, discount: item.discount + additionalDiscount }
    }))
    setPreviousManualDiscount(discount)
    setManualDiscount(discount)
  }

  const generateUniqueInvoiceNumber = async (): Promise<string> => {
    const supabase = createClient();
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const { data: invoiceData, error } = await supabase
          .rpc("generate_invoice_number");

        if (error) throw error;

        // Add a random suffix to ensure uniqueness
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        return `${invoiceData}-${randomSuffix}`;
      } catch (error: any) {
        if (error?.code === '23505' && retryCount < maxRetries - 1) {
          // If it's a duplicate key error and we have retries left, try again
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before retry
          continue;
        }
        // If we've exhausted retries or it's a different error, fall back to timestamp
        console.warn('Falling back to timestamp-based invoice number after', retryCount + 1, 'retries');
        return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
    }

    // Fallback in case all retries fail
    return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const processPayment = async (paymentMethodId: string, amount: number) => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before checkout",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer before processing payment for loyalty tracking",
        variant: "destructive",
      });
      return;
    }

    // Check cash drawer balance for cash payments requiring change
    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId)
    const isCashPayment = selectedPaymentMethod?.name.toLowerCase().includes('cash')
    const changeAmount = amount - totals.total

    if (isCashPayment && changeAmount > 0) {
      try {
        const response = await fetch('/api/cash-drawer')
        if (response.ok) {
          const { drawer } = await response.json()
          if (!drawer) {
            toast({
              title: "No Cash Drawer",
              description: "Please open a cash drawer before processing cash payments",
              variant: "destructive",
            });
            return;
          }
          if (drawer.current_balance < changeAmount) {
            setRequiredChange(changeAmount)
            setInsufficientFundsDialogOpen(true)
            return
          }
        } else {
          toast({
            title: "Error",
            description: "Unable to verify cash drawer balance",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error checking cash drawer:', error)
        toast({
          title: "Error",
          description: "Unable to verify cash drawer balance",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate a unique invoice number with retry mechanism
      const invoiceNumber = await generateUniqueInvoiceNumber();

      // Handle customer creation first if needed
      let finalCustomerId: string | undefined = selectedCustomer?.id

      if (selectedCustomer) {
        // Check if customer exists, if not create it (for registered customers)
        const existingCustomer = await supabase
          .from("customers")
          .select("id")
          .eq("id", selectedCustomer.id)
          .single()

        if (!existingCustomer.data) {
          // Create new customer record for registered customer
          const { data: newCustomer, error: createError } = await supabase
            .from("customers")
            .insert({
              registered_customer_id: selectedCustomer.id,
              full_name: selectedCustomer.full_name,
              phone: selectedCustomer.phone,
              email: selectedCustomer.email,
              membership_tier: selectedCustomer.membership_tier,
              total_spent: 0,
              total_visits: 0,
              last_visit_date: null
            })
            .select("id")
            .single()

          if (createError) {
            console.error('Failed to create customer record:', createError)
            // Continue without customer
            finalCustomerId = undefined
          } else if (newCustomer) {
            finalCustomerId = newCustomer.id
          }
        }
      }

      // Create sale with customer information
      const saleData: any = {
        invoice_number: invoiceNumber,
        user_id: user.id,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        total: totals.total,
        status: "completed",
      }

      // Add customer ID if customer is selected
      if (finalCustomerId) {
        saleData.customer_id = finalCustomerId
      }

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert(saleData)
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = cartItems.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        tax_rate: item.product.tax_rate,
        tax_amount: (item.product.price * item.quantity * item.product.tax_rate) / 100,
        discount_amount: item.discount,
        line_total:
          item.product.price * item.quantity +
          (item.product.price * item.quantity * item.product.tax_rate) / 100 -
          item.discount,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

      if (itemsError) throw itemsError

      // Get payment method details for PCI compliance routing
      const currentPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId)
      if (!currentPaymentMethod) {
        throw new Error("Invalid payment method")
      }

      // Route to PCI-compliant payment processing based on method type
      let paymentResult;
      const methodName = currentPaymentMethod.name.toLowerCase();

      if (methodName.includes('cash')) {
        // Cash payment - no PCI concerns
        paymentResult = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: sale.id,
            paymentMethodId,
            amount,
            paymentType: 'cash'
          })
        }).then(res => res.json());
      } else if (methodName.includes('card') || methodName.includes('credit') || methodName.includes('debit')) {
        // Card payment - requires PCI compliance
        // In a real implementation, card data would be collected securely
        // For now, we'll simulate with mock data
        const mockCardData = {
          number: "4111111111111111", // Test card number
          expiryMonth: "12",
          expiryYear: "25",
          cvv: "123",
          holderName: "Test User"
        };

        paymentResult = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: sale.id,
            paymentMethodId,
            amount,
            paymentType: 'card',
            cardData: mockCardData
          })
        }).then(res => res.json());
      } else if (methodName.includes('mobile') || methodName.includes('airtel') || methodName.includes('mtn')) {
        // Mobile money payment
        // In a real implementation, phone number would be collected
        const mockPhoneNumber = "+256700000000";
        paymentResult = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: sale.id,
            paymentMethodId,
            amount,
            paymentType: 'mobile',
            phoneNumber: mockPhoneNumber
          })
        }).then(res => res.json());
      } else {
        // Fallback to cash processing for unknown methods
        paymentResult = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: sale.id,
            paymentMethodId,
            amount,
            paymentType: 'cash'
          })
        }).then(res => res.json());
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment processing failed");
      }

      // Update inventory (deduct stock)
      for (const item of cartItems) {
        const { data: currentInventory } = await supabase
          .from("inventory")
          .select("quantity, min_stock_level")
          .eq("product_id", item.product.id)
          .single()

        if (currentInventory) {
          const newQuantity = currentInventory.quantity - item.quantity

          // Update inventory
          await supabase.from("inventory").update({ quantity: newQuantity }).eq("product_id", item.product.id)

          // Log adjustment
          await supabase.from("inventory_adjustments").insert({
            product_id: item.product.id,
            user_id: user.id,
            adjustment_type: "sale",
            quantity_change: -item.quantity,
            quantity_before: currentInventory.quantity,
            quantity_after: newQuantity,
            reason: `Sale: ${invoiceNumber}`,
          })

          // Check for alerts
          if (newQuantity === 0) {
            // Trigger out-of-stock alert
            try {
              await fetch('/api/emails/out-of-stock-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              })
            } catch (emailError) {
              console.error('Failed to send out-of-stock alert:', emailError)
            }
          } else if (newQuantity <= currentInventory.min_stock_level) {
            // Trigger low-stock alert
            try {
              await fetch('/api/emails/low-stock-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              })
            } catch (emailError) {
              console.error('Failed to send low-stock alert:', emailError)
            }
          }
        }
      }

      // Update customer information and award loyalty points
      let pointsEarned = 0
      let customerId = selectedCustomer.id

      if (selectedCustomer) {
        try {
          // Check if customer exists, if not create it (for registered customers)
          const existingCustomer = await supabase
            .from("customers")
            .select("id")
            .eq("id", selectedCustomer.id)
            .single()

          if (!existingCustomer.data) {
            // Create new customer record for registered customer
            const { data: newCustomer, error: createError } = await supabase
              .from("customers")
              .insert({
                registered_customer_id: selectedCustomer.id,
                full_name: selectedCustomer.full_name,
                phone: selectedCustomer.phone,
                email: selectedCustomer.email,
                membership_tier: selectedCustomer.membership_tier,
                total_spent: 0,
                total_visits: 0,
                last_visit_date: null
              })
              .select("id")
              .single()

            if (createError) {
              console.error('Failed to create customer record:', createError)
              // Continue without customer update
            } else if (newCustomer) {
              customerId = newCustomer.id
            }
          }

          // Update customer stats
          await supabase
            .from("customers")
            .update({
              total_spent: selectedCustomer.total_spent + totals.total,
              total_visits: selectedCustomer.total_visits + 1,
              last_visit_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", customerId)

          // Try to award loyalty points if loyalty system is available and program is selected
          // Only award points to registered customers
          try {
            // Check if customer is registered (has registered_customer_id)
            const { data: customerRecord } = await supabase
              .from("customers")
              .select("registered_customer_id")
              .eq("id", customerId)
              .single()

            if (!customerRecord?.registered_customer_id) {
              console.log('Customer is not registered, skipping loyalty points')
            } else {
              // Use selected loyalty program (skip if "none" is selected)
              const program = selectedLoyaltyProgram

              if (program) {
                // Calculate points based on program settings
                pointsEarned = Math.floor(totals.total * program.points_per_currency)

                if (pointsEarned > 0) {
                  // Get or create customer loyalty account
                  let { data: account } = await supabase
                    .from("customer_loyalty_accounts")
                    .select("*")
                    .eq("customer_id", customerId)
                    .eq("loyalty_program_id", program.id)
                    .single()

                  if (!account) {
                    // Create new loyalty account
                    const { data: newAccount, error: accountError } = await supabase
                      .from("customer_loyalty_accounts")
                      .insert({
                        customer_id: customerId,
                        loyalty_program_id: program.id,
                        tier: selectedCustomer.membership_tier || 'bronze',
                        is_active: true
                      })
                      .select("id, current_points, total_points_earned")
                      .single()

                    if (accountError) {
                      console.log('Failed to create loyalty account:', accountError)
                      // Continue without loyalty if account creation fails
                    } else {
                      account = newAccount
                    }
                  }

                  if (account) {
                    // Create loyalty transaction
                    const newBalance = (account.current_points || 0) + pointsEarned
                    const { error: transactionError } = await supabase
                      .from("loyalty_transactions")
                      .insert({
                        customer_loyalty_account_id: account.id,
                        transaction_type: "earn",
                        points: pointsEarned,
                        points_balance_after: newBalance,
                        sale_id: sale.id,
                        reason: `Purchase: ${invoiceNumber}`,
                        created_by: user.id,
                      })

                    if (transactionError) {
                      console.log('Failed to create loyalty transaction:', transactionError)
                    } else {
                      // Update account balance
                      await supabase
                        .from("customer_loyalty_accounts")
                        .update({
                          current_points: newBalance,
                          total_points_earned: (account.total_points_earned || 0) + pointsEarned,
                          last_points_earned: new Date().toISOString()
                        })
                        .eq("id", account.id)
                    }
                  }
                }
              } else {
                console.log('No active loyalty program found')
              }
            }
          } catch (loyaltyError) {
            console.log('Loyalty system not available or error:', loyaltyError)
            // Continue with sale even if loyalty fails
          }
        } catch (customerError) {
          console.error('Error updating customer:', customerError)
        }
      }

      // Get payment method name
      const paymentMethod = paymentMethods.find((pm) => pm.id === paymentMethodId)

      // Show invoice with customer and points information
      setLastSale({
        invoiceNumber,
        items: [...cartItems],
        totals: { ...totals },
        paymentMethod: paymentMethod?.name || "Unknown",
        customer: selectedCustomer ? selectedCustomer as any : undefined,
        pointsEarned: (selectedLoyaltyProgram && pointsEarned > 0) ? pointsEarned : undefined,
      })
      setShowInvoice(true)

      // Send transaction receipt to customer if they have email
      if (selectedCustomer?.email) {
        try {
          await fetch('/api/emails/transaction-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ saleId: sale.id })
          })
        } catch (emailError) {
          console.error('Failed to send transaction receipt:', emailError)
          // Don't fail the sale if email fails
        }
      }

      // Send transaction alert to staff
      try {
        await fetch('/api/emails/transaction-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: sale.id })
        })
      } catch (emailError) {
        console.error('Failed to send transaction alert:', emailError)
        // Don't fail the sale if email fails
      }

      // Clear cart and customer selection
      clearCart()
      setSelectedCustomer(null)
      setSelectedLoyaltyProgram(availablePrograms.length > 0 ? availablePrograms[0] : null)
      setLoyaltyPoints(0)
      setPointsToEarn(0)

      const successMessage = selectedCustomer
        ? selectedLoyaltyProgram
          ? `Sale completed! ${pointsEarned > 0 ? `${pointsEarned} loyalty points earned.` : ''}`
          : "Sale completed successfully"
        : "Sale completed successfully"

      toast({
        title: "Sale Complete",
        description: successMessage,
      })
    } catch (err) {
      // Type guard to check if error is an instance of Error
      const error = err as Error & {
        code?: string;
        response?: { data?: any };
        [key: string]: any;
      };

      console.error("Payment error:", {
        error,
        message: error?.message || 'Unknown error',
        name: error?.name || 'UnknownError',
        stack: error?.stack,
        response: error?.response?.data || 'No response data',
      });

      let errorMessage = 'An error occurred during payment processing';

      if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.code === '23505') {
        errorMessage = 'Duplicate transaction detected. Please try again.';
      } else if (error?.code === '23503') {
        errorMessage = 'Invalid product or payment method. Please verify your selection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Status Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">POS Terminal • Online</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Products: <span className="font-semibold">{products.length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Cart: <span className="font-semibold">{cartItems.length} items</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={selectedCustomer ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 ${!selectedCustomer ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
                >
                  <User className="h-4 w-4" />
                  {selectedCustomer ? `Customer: ${selectedCustomer.full_name}` : 'Select Customer *'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Selection
                  </DialogTitle>
                  <DialogDescription>
                    Search for existing customers or register new ones for loyalty tracking.
                  </DialogDescription>
                </DialogHeader>
                <CustomerLookup
                  selectedCustomer={selectedCustomer}
                  onCustomerSelected={(customer, loyaltyInfo) => {
                    setSelectedCustomer(customer)
                    setLoyaltyPoints(loyaltyInfo?.current_points || 0)
                    setCustomerDialogOpen(false)
                  }}
                  onClearCustomer={() => {
                    setSelectedCustomer(null)
                    setLoyaltyPoints(0)
                  }}
                  currency={currency}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshProducts}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => barcodeRef.current?.focus()}
              className="gap-2"
            >
              <Scan className="h-4 w-4" />
              Scanner
            </Button>

            {/* Loyalty Program Selection */}
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedLoyaltyProgram?.id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setSelectedLoyaltyProgram(null)
                  } else {
                    const program = availablePrograms.find(p => p.id === value)
                    setSelectedLoyaltyProgram(program || null)
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      None (No Points)
                    </div>
                  </SelectItem>
                  {availablePrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {program.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:flex overflow-auto">
          {/* Left Panel - Products */}
          <div className="w-64 md:w-72 lg:w-80 flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 shadow-lg">
          {/* Product Search Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Product Search</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Search and add items to cart</p>
              </div>
            </div>

            {/* Search Inputs */}
            <div className="space-y-3">
              <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Barcode Scanner</label>
                <div className="flex gap-2">
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan or type barcode..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                  <Button type="submit" size="sm" className="px-3">
                    Add
                  </Button>
                </div>
              </form>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products by name, barcode, or category..."
                  className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {searchTerm && (
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-slate-800/30">
              <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                {filteredProducts.map((product) => {
                const stock = product.inventory?.quantity || 0
                const isLowStock = stock > 0 && stock <= 5
                const isOutOfStock = stock === 0

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`
                      group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                      p-6 flex flex-col text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.02]
                      ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white dark:hover:from-slate-700 dark:hover:to-slate-800'}
                      min-h-48 flex-shrink-0 shadow-sm
                    `}
                  >
                    {/* Stock Status */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${isOutOfStock
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : isLowStock
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                      {isOutOfStock ? 'Out' : stock}
                    </div>

                    {/* Product Name */}
                    <div className="pr-10 mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Price</div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                            {currency} {product.price.toLocaleString()}
                          </div>
                        </div>
                        {!isOutOfStock ? (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                            <Plus className="h-5 w-5" />
                          </div>
                        ) : (
                          <XCircle className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              </div>
            </div>
          )}
        </div>

        {/* Middle Panel - Cart */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
          {/* Cart Header */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Current Sale</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Transaction items</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {cartItems.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-bold">
                      {cartItems.length} items
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <ShoppingCart className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Cart is Empty
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                  Scan barcodes or click products to add items to your cart
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => barcodeRef.current?.focus()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    Focus Scanner
                  </Button>
                  <Button
                    onClick={refreshProducts}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4"
                  >
                    <div className="flex items-start justify-between">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {currency} {item.product.price.toLocaleString()} each
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4 ml-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-12 text-center">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {item.quantity}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              in cart
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={(item.product.inventory?.quantity || 0) <= item.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-28">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Line Total</div>
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {currency} {(item.product.price * item.quantity).toLocaleString()}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Items</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Subtotal</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {currency} {totals.subtotal.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tax</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currency} {totals.taxAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currency} {totals.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Payment */}
        <div className="w-80 md:w-88 lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-shrink-0">
          {/* Payment Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Payment Terminal</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Complete transaction</p>
              </div>
            </div>

            {/* Total Display */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-center mb-3">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Amount Due</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {currency} {totals.total.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium">{currency} {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tax</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {currency} {totals.taxAmount.toLocaleString()}
                    </span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Discount</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{currency} {totals.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Panel */}
            <div className="space-y-4">
              <PaymentPanel
                totals={totals}
                paymentMethods={paymentMethods}
                onProcessPayment={processPayment}
                isProcessing={isProcessing}
                disabled={cartItems.length === 0 || !selectedCustomer}
                currency={currency}
                selectedCustomer={selectedCustomer}
                loyaltyPoints={loyaltyPoints}
                onPointsRedeemed={handlePointsRedemption}
              />
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="flex-1 overflow-y-auto p-4">
          </div>
        </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <Tabs defaultValue="products" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="cart">Cart ({cartItems.length})</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="flex-1 overflow-auto">
              {/* Products Panel */}
              <div className="w-full flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                {/* Product Search Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">Product Search</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Search and add items to cart</p>
                    </div>
                  </div>

                  {/* Search Inputs */}
                  <div className="space-y-3">
                    <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Barcode Scanner</label>
                      <div className="flex gap-2">
                        <input
                          ref={barcodeRef}
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="Scan or type barcode..."
                          className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoComplete="off"
                        />
                        <Button type="submit" size="sm" className="px-3">
                          Add
                        </Button>
                      </div>
                    </form>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products by name, barcode, or category..."
                        className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          aria-label="Clear search"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Grid */}
                {searchTerm && (
                  <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-slate-800/30">
                    <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                      {filteredProducts.map((product) => {
                      const stock = product.inventory?.quantity || 0
                      const isLowStock = stock > 0 && stock <= 5
                      const isOutOfStock = stock === 0

                      return (
                        <button
                          key={product.id}
                          onClick={() => !isOutOfStock && addToCart(product)}
                          disabled={isOutOfStock}
                          className={`
                            group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                            p-6 flex flex-col text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.02]
                            ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white dark:hover:from-slate-700 dark:hover:to-slate-800'}
                            min-h-48 flex-shrink-0 shadow-sm
                          `}
                        >
                          {/* Stock Status */}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${isOutOfStock
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : isLowStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                            {isOutOfStock ? 'Out' : stock}
                          </div>

                          {/* Product Name */}
                          <div className="pr-10 mb-3">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight line-clamp-2">
                              {product.name}
                            </h3>
                          </div>

                          {/* Category */}
                          <div className="mb-3">
                            <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded">
                              {product.category?.name || 'Uncategorized'}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="mt-auto">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Price</div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                                  {currency} {product.price.toLocaleString()}
                                </div>
                              </div>
                              {!isOutOfStock ? (
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                                  <Plus className="h-5 w-5" />
                                </div>
                              ) : (
                                <XCircle className="h-6 w-6 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="cart" className="flex-1 overflow-auto">
              {/* Cart Panel */}
              <div className="w-full flex flex-col bg-slate-50 dark:bg-slate-950">
                {/* Cart Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 dark:text-slate-100">Current Sale</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Transaction items</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {cartItems.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-bold">
                            {cartItems.length} items
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearCart}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Clear
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8">
                      <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                        <ShoppingCart className="h-12 w-12 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Cart is Empty
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                        Scan barcodes or click products to add items to your cart
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => barcodeRef.current?.focus()}
                          variant="outline"
                          className="gap-2"
                        >
                          <Scan className="h-4 w-4" />
                          Focus Scanner
                        </Button>
                        <Button
                          onClick={refreshProducts}
                          variant="outline"
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh Products
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4"
                        >
                          <div className="flex items-start justify-between">
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {item.product.name}
                                  </h3>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {currency} {item.product.price.toLocaleString()} each
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-4 ml-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-12 text-center">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">
                                    {item.quantity}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    in cart
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  disabled={(item.product.inventory?.quantity || 0) <= item.quantity}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Line Total */}
                              <div className="text-right min-w-28">
                                <div className="text-xs text-slate-500 dark:text-slate-400">Line Total</div>
                                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                  {currency} {(item.product.price * item.quantity).toLocaleString()}
                                </div>
                              </div>

                              {/* Remove Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Summary */}
                {cartItems.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Items</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Subtotal</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {currency} {totals.subtotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tax</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {currency} {totals.taxAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {currency} {totals.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="payment" className="flex-1 overflow-auto">
              {/* Payment Panel */}
              <div className="w-full flex flex-col bg-white dark:bg-slate-900">
                {/* Payment Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">Payment Terminal</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Complete transaction</p>
                    </div>
                  </div>

                  {/* Total Display */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="text-center mb-3">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Amount Due</p>
                        <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                          {currency} {totals.total.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                          <span className="font-medium">{currency} {totals.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Tax</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {currency} {totals.taxAmount.toLocaleString()}
                          </span>
                        </div>
                        {totals.discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Discount</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              -{currency} {totals.discountAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Panel */}
                  <div className="space-y-4">
                    <PaymentPanel
                      totals={totals}
                      paymentMethods={paymentMethods}
                      onProcessPayment={processPayment}
                      isProcessing={isProcessing}
                      disabled={cartItems.length === 0 || !selectedCustomer}
                      currency={currency}
                      selectedCustomer={selectedCustomer}
                      loyaltyPoints={loyaltyPoints}
                      onPointsRedeemed={handlePointsRedemption}
                    />
                  </div>
                </div>

                {/* Quick Actions & Stats */}
                <div className="flex-1 overflow-y-auto p-4">
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {lastSale && (
        <InvoiceModal
          open={showInvoice}
          onOpenChange={setShowInvoice}
          invoiceNumber={lastSale.invoiceNumber}
          items={lastSale.items}
          totals={lastSale.totals}
          paymentMethod={lastSale.paymentMethod}
          customer={lastSale.customer}
          pointsEarned={lastSale.pointsEarned}
          currency={currency}
        />
      )}

      <AlertDialog open={insufficientFundsDialogOpen} onOpenChange={setInsufficientFundsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Insufficient Funds
            </AlertDialogTitle>
            <AlertDialogDescription>
              The cash drawer does not have enough money to provide change for this transaction.
              <br />
              <br />
              <strong>Required change: {currency} {requiredChange.toLocaleString()}</strong>
              <br />
              Please request more money from the manager or use a different payment method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setInsufficientFundsDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}