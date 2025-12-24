"use client"

import { useState, useMemo, useEffect } from "react"
import type { Sale, Product, Payment, Profile, Role, AuditLog } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { 
  DollarSign, 
  Receipt, 
  ShoppingCart, 
  Download, 
  Package, 
  BarChart2,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { formatDate } from "@/lib/utils/date"
import { SalesChart } from "./sales-chart"
import { createClient } from "@/lib/supabase/client"

interface SalesChartData {
  date: string;
  total: number;
  count: number;
}

interface ReportsDashboardProps {
  sales: Sale[];
  salesChartData: SalesChartData[];
  categories: any[];
  paymentMethods: any[];
}

export function ReportsDashboard({ sales, salesChartData, categories, paymentMethods }: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at).toISOString().split("T")[0];
      
      // Check date range first
      if (saleDate < dateFrom || saleDate > dateTo) {
        return false;
      }

      // Filter by category if selected
      if (selectedCategory !== 'all') {
        const hasMatchingItem = sale.items?.some(item => 
          item.product?.category_id === selectedCategory
        );
        if (!hasMatchingItem) return false;
      }

      // Filter by payment method if selected
      if (selectedPaymentMethod !== 'all') {
        const hasMatchingPayment = sale.payments?.some(
          payment => payment.payment_method_id === selectedPaymentMethod
        );
        if (!hasMatchingPayment) return false;
      }

      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesInvoice = sale.invoice_number?.toLowerCase().includes(query);
        const matchesCashier = sale.profile?.full_name?.toLowerCase().includes(query);
        const matchesItems = sale.items?.some(item => 
          item.product?.name?.toLowerCase().includes(query)
        );
        
        if (!matchesInvoice && !matchesCashier && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [sales, dateFrom, dateTo, selectedCategory, selectedPaymentMethod, searchQuery]);

  // Calculate summary statistics
  const totalSales = useMemo(() => 
    filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0), 
    [filteredSales]
  );
  
  const totalTransactions = filteredSales.length;
  const avgSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Get recent transactions (last 10 sales)
  const recentTransactions = useMemo(() => 
    [...filteredSales]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10),
    [filteredSales]
  );

  // Get top selling products
  const topProducts = useMemo(() => {
    const productMap = new Map();
    
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const productId = item.product_id;
        const productName = item.product?.name || `Product ${productId}`;
        const current = productMap.get(productId) || { name: productName, quantity: 0, revenue: 0 };
        
        productMap.set(productId, {
          ...current,
          quantity: current.quantity + (item.quantity || 0),
          revenue: current.revenue + ((item.quantity || 0) * (item.unit_price || 0))
        });
      });
    });
    
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!salesChartData || !Array.isArray(salesChartData)) {
      console.error('Invalid salesChartData:', salesChartData);
      return [];
    }
    
    return salesChartData.map(item => ({
      date: item.date,
      total: Number(item.total) || 0,
      count: Number(item.count) || 0
    }));
  }, [salesChartData]);

  // Debug log
  useEffect(() => {
    console.log('Chart Data:', chartData);
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          <select
            id="payment-method"
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Methods</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search transactions..."
          className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" disabled={sales.length === 0}>
            <Receipt className="mr-2 h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="inventory" disabled>
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filtered Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                <p className="text-xs text-muted-foreground">
                  {totalTransactions} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(avgSale)}</div>
                <p className="text-xs text-muted-foreground">
                  Per transaction
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  In selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {topProducts.length > 0 ? topProducts[0].name : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {topProducts.length > 0 ? `${topProducts[0].quantity} units sold` : 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <SalesChart data={chartData} />
              ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                  No sales data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No product data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.slice(0, 50).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.created_at).toLocaleString()}</TableCell>
                      <TableCell>{sale.profile?.full_name || "Unknown"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.tax_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
