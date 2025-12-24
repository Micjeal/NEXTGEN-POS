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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  RefreshCw, ShoppingCart, CreditCard, Search, User, Scan,
  Package, DollarSign, Plus, Minus, Trash2, CheckCircle, XCircle
} from "lucide-react"
import type { Customer } from "@/lib/types/database"

interface POSTerminalProps {
  products: Product[]
  paymentMethods: PaymentMethod[]
}

export function POSTerminal({ products: initialProducts, paymentMethods }: POSTerminalProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
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
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          inventory(*)
        `)
        .eq('is_active', true)
        .not('inventory', 'is', null)
        .order('name')

      if (error) throw error

      if (data) {
        setProducts(data as Product[])
        toast({
          title: 'Products Refreshed',
          description: 'The product list has been updated.'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh products',
        variant: 'destructive'
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [supabase, toast])

  // Auto-refresh products every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshProducts, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [refreshProducts])

  // Auto-focus barcode input
  useEffect(() => {
    barcodeRef.current?.focus()
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
      if (selectedCustomer) {
        saleData.customer_id = selectedCustomer.id
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
          .select("quantity")
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
        }
      }

      // Update customer information and award loyalty points
      let pointsEarned = 0
      if (selectedCustomer) {
        try {
          // Update customer stats
          await supabase
            .from("customers")
            .update({
              total_spent: selectedCustomer.total_spent + totals.total,
              total_visits: selectedCustomer.total_visits + 1,
              last_visit_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", selectedCustomer.id)

          // Calculate and award loyalty points (1 point per 100 UGX)
          pointsEarned = Math.floor(totals.total / 100)

          if (pointsEarned > 0) {
            // Try to create loyalty transaction (will work if loyalty tables exist)
            try {
              await supabase
                .from("loyalty_transactions")
                .insert({
                  customer_loyalty_account_id: selectedCustomer.id, // This will need to be updated to use actual account ID
                  transaction_type: "earn",
                  points: pointsEarned,
                  points_balance_after: (loyaltyPoints || 0) + pointsEarned,
                  sale_id: sale.id,
                  reason: `Purchase: ${invoiceNumber}`,
                  created_by: user.id,
                })
            } catch (loyaltyError) {
              console.log('Loyalty system not available, points not awarded')
            }
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
        customer: selectedCustomer || undefined,
        pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      })
      setShowInvoice(true)

      // Clear cart and customer selection
      clearCart()
      setSelectedCustomer(null)
      setLoyaltyPoints(0)
      setPointsToEarn(0)

      const successMessage = selectedCustomer
        ? `Sale completed! ${pointsEarned > 0 ? `${pointsEarned} loyalty points earned.` : ''}`
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
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Enter phone number (e.g., +256700000000)"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                      </div>
                      <Button disabled>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2">
                      <User className="h-4 w-4" />
                      Register New Customer
                    </Button>
                  </div>
                </div>
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
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-auto">
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
                            UGX {product.price.toLocaleString()}
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
                              UGX {item.product.price.toLocaleString()} each
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
                            UGX {(item.product.price * item.quantity).toLocaleString()}
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
                    UGX {totals.subtotal.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tax</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    UGX {totals.taxAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    UGX {totals.total.toLocaleString()}
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
                    UGX {totals.total.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium">UGX {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tax</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      UGX {totals.taxAmount.toLocaleString()}
                    </span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Discount</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -UGX {totals.discountAmount.toLocaleString()}
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
                disabled={cartItems.length === 0}
              />
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="flex-1 overflow-y-auto p-4">
          </div>
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
        />
      )}
    </div>
  )
}