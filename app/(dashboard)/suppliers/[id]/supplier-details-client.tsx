"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, FileText, CreditCard, ArrowLeft, Package, DollarSign, Clock, Star, Plus, Edit, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  supplier_category: string
  rating: number
  is_active: boolean
  payment_terms: string
  credit_limit: number
  total_orders?: number
  on_time_delivery_rate?: number
  quality_score?: number
  average_lead_time_days?: number
}

interface SupplierProduct {
  id: string
  supplier_product_code?: string
  supplier_price?: number
  minimum_order_quantity?: number
  lead_time_days?: number
  is_preferred_supplier: boolean
  product: {
    id: string
    name: string
    category?: {
      name: string
    }
  }
}

interface PurchaseOrder {
  id: string
  order_number: string
  status: string
  total_amount: number
  expected_delivery_date?: string
  created_at: string
  creator?: {
    full_name: string
  }
}

interface SupplierInvoice {
  id: string
  invoice_number: string
  total_amount: number
  status: string
  due_date?: string
  created_at: string
  purchase_order?: {
    order_number: string
  }
}

interface ApiResponse<T> {
  data: T[]
  meta: {
    total: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export default function SupplierDetailsClient({ supplierId }: { supplierId: string }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSupplierData()
  }, [supplierId])

  const fetchSupplierData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch supplier details
      const supplierRes = await fetch(`/api/suppliers/${supplierId}`)
      if (!supplierRes.ok) throw new Error("Failed to fetch supplier")
      const supplierData = await supplierRes.json()
      setSupplier(supplierData.data)

      // Fetch products, orders, and invoices in parallel
      const [productsRes, ordersRes, invoicesRes] = await Promise.all([
        fetch(`/api/suppliers/${supplierId}/products`),
        fetch(`/api/suppliers/${supplierId}/orders`),
        fetch(`/api/suppliers/${supplierId}/invoices`)
      ])

      if (productsRes.ok) {
        const productsData: ApiResponse<SupplierProduct> = await productsRes.json()
        setProducts(productsData.data)
      }

      if (ordersRes.ok) {
        const ordersData: ApiResponse<PurchaseOrder> = await ordersRes.json()
        setOrders(ordersData.data)
      }

      if (invoicesRes.ok) {
        const invoicesData: ApiResponse<SupplierInvoice> = await invoicesRes.json()
        setInvoices(invoicesData.data)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'international': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'local': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'ordered': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'partially_received': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'received': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/suppliers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || "Supplier not found"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suppliers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {supplier.name}
            </h1>
            <p className="text-muted-foreground">Supplier Details & Product Catalog</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Supplier
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline" size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Supplier Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Products Supplied</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{products.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{supplier.total_orders || 0}</div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Purchase orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Credit Limit</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              UGX {supplier.credit_limit.toLocaleString()}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Available credit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Lead Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{supplier.average_lead_time_days || 7}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Days average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge className={getCategoryColor(supplier.supplier_category)}>
                      {supplier.supplier_category.charAt(0).toUpperCase() + supplier.supplier_category.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {getRatingStars(supplier.rating)}
                      </div>
                      <span className="text-sm">{supplier.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {supplier.contact_person && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact Person:</span>
                      <span>{supplier.contact_person}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{supplier.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Address</h4>
                <div className="space-y-1">
                  {supplier.address && <p>{supplier.address}</p>}
                  {supplier.city && <p>{supplier.city}, {supplier.country}</p>}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Business Terms</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span>{supplier.payment_terms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">On-time Delivery:</span>
                    <span>{supplier.on_time_delivery_rate || 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality Score:</span>
                    <span>{supplier.quality_score || 5.0}/5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Recent Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Products Supplied by {supplier.name}</CardTitle>
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Supplier Code</TableHead>
                    <TableHead>Supplier Price</TableHead>
                    <TableHead>Min Order Qty</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Preferred</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((sp) => (
                      <TableRow key={sp.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sp.product?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {sp.product?.category?.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{sp.supplier_product_code || '-'}</TableCell>
                        <TableCell>
                          {sp.supplier_price ? `UGX ${sp.supplier_price.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>{sp.minimum_order_quantity || 1}</TableCell>
                        <TableCell>{sp.lead_time_days || 7} days</TableCell>
                        <TableCell>
                          <Badge variant={sp.is_preferred_supplier ? "default" : "secondary"}>
                            {sp.is_preferred_supplier ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No products match your search" : "No products found for this supplier"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.order_number}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            UGX {order.total_amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.expected_delivery_date ? (
                            new Date(order.expected_delivery_date).toISOString().split('T')[0]
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.creator?.full_name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toISOString().split('T')[0]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-medium">{invoice.invoice_number}</div>
                        </TableCell>
                        <TableCell>{invoice.purchase_order?.order_number || '-'}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            UGX {invoice.total_amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'partially_paid' ? 'secondary' :
                            invoice.status === 'overdue' ? 'destructive' : 'outline'
                          }>
                            {invoice.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? (
                            new Date(invoice.due_date).toISOString().split('T')[0]
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(invoice.created_at).toISOString().split('T')[0]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}