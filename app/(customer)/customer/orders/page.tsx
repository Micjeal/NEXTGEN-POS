import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingBag, Receipt, Truck, CheckCircle, Clock,
  Package, MapPin, CreditCard, ChevronRight
} from "lucide-react"
import { redirect } from "next/navigation"

interface Order {
  id: string;
  invoice_number: string;
  total: number;
  tax_amount: number;
  discount_amount: number;
  status: string;
  created_at: string;
  sale_items: any[];
}

export default async function CustomerOrdersPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/customer-login")
  }

  // Get customer data
  const { data: registeredCustomer } = await serviceClient
    .from("registered_customers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!registeredCustomer) {
    redirect("/auth/customer-login")
  }

  const { data: customer } = await serviceClient
    .from("customers")
    .select("*")
    .eq("registered_customer_id", registeredCustomer.id)
    .single()

  let orders: Order[] = []

  if (customer) {
    // Get customer's orders (sales)
    const { data: sales } = await serviceClient
      .from("sales")
      .select(`
        id, invoice_number, total, tax_amount, discount_amount, status, created_at,
        sale_items(count, products(name, price))
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })

    orders = sales || []
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'pending': return Clock
      default: return Package
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground">Track your purchases and order status</p>
        </div>
        <Button>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Shop Again
        </Button>
      </div>

      {!customer ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Customer Account</h3>
            <p className="text-muted-foreground mb-6">
              Make your first purchase to create an account and start tracking your orders!
            </p>
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              Your order history will appear here once you make your first purchase.
            </p>
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Order Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">
                      {orders.filter((order: any) => order.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">
                      {orders.filter((order: any) => order.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">
                      UGX {orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Your Orders
              </CardTitle>
              <CardDescription>
                View and manage your purchase history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order: any) => {
                  const StatusIcon = getStatusIcon(order.status)
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <StatusIcon className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Order #{order.invoice_number}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()} • {order.sale_items?.length || 0} items
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <p className="text-lg font-bold mt-1">
                              UGX {order.total?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{order.sale_items?.length || 0} items</span>
                            </div>
                            {order.status === 'completed' && (
                              <div className="flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                <span>Delivered</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/customer/orders/${order.id}`}>
                                View Details
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                            {order.status === 'completed' && (
                              <Button variant="outline" size="sm">
                                Buy Again
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        {order.sale_items && order.sale_items.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Items:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.sale_items.slice(0, 3).map((item: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {item.products?.name || 'Unknown Item'}
                                </Badge>
                              ))}
                              {order.sale_items.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{order.sale_items.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}