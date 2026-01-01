"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, Receipt, Package, Truck, CheckCircle, Clock,
  MapPin, CreditCard, Calendar, ShoppingBag, Loader2, AlertCircle
} from "lucide-react"
import Image from "next/image"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  products: {
    id: string
    name: string
    description?: string
    image_url?: string
    sku?: string
  }
}

interface OrderDetails {
  id: string
  invoice_number: string
  total: number
  tax_amount: number
  discount_amount: number
  status: string
  created_at: string
  updated_at: string
  payment_method?: string
  payment_status?: string
  notes?: string
  sale_items: OrderItem[]
  orderSummary: {
    subtotal: number
    tax: number
    discount: number
    total: number
  }
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadOrderDetails(params.id as string)
    }
  }, [params.id])

  const loadOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/customer/orders/${orderId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/customer-login")
          return
        }
        if (response.status === 404) {
          toast({
            title: "Order Not Found",
            description: "The order you're looking for doesn't exist or doesn't belong to you.",
            variant: "destructive"
          })
          router.push("/customer/orders")
          return
        }
        throw new Error('Failed to load order details')
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Error loading order details:', error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'pending': return Clock
      case 'processing': return Package
      case 'shipped': return Truck
      default: return Package
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
        <p className="text-muted-foreground mb-6">
          The order you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/customer/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/customer/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">Order #{order.invoice_number}</p>
        </div>
      </div>

      {/* Order Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg capitalize">{order.status}</h3>
                <p className="text-sm text-muted-foreground">
                  Ordered on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>
                {order.sale_items.length} item{order.sale_items.length !== 1 ? 's' : ''} in this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.sale_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    {item.products.image_url ? (
                      <Image
                        src={item.products.image_url}
                        alt={item.products.name}
                        width={64}
                        height={64}
                        className="object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.products.name}</h4>
                    {item.products.description && (
                      <p className="text-sm text-muted-foreground">{item.products.description}</p>
                    )}
                    {item.products.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {item.products.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">UGX {item.unit_price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium">UGX {item.total_price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.status === 'completed' && (
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>UGX {order.orderSummary.subtotal.toLocaleString()}</span>
              </div>

              {order.orderSummary.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>UGX {order.orderSummary.tax.toLocaleString()}</span>
                </div>
              )}

              {order.orderSummary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-UGX {order.orderSummary.discount.toLocaleString()}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>UGX {order.orderSummary.total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.payment_method && (
                <div className="flex justify-between">
                  <span className="text-sm">Payment Method</span>
                  <span className="text-sm font-medium capitalize">{order.payment_method}</span>
                </div>
              )}

              {order.payment_status && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Payment Status</span>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm">Invoice Number</span>
                <span className="text-sm font-mono">{order.invoice_number}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Receipt className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>

              {order.status === 'completed' && (
                <Button className="w-full" variant="outline">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Buy Again
                </Button>
              )}

              {order.status === 'pending' && (
                <Button className="w-full" variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}