"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DollarSign,
  Users,
  Package,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Play,
  FileDown
} from "lucide-react"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import type { Sale } from "@/lib/types/database"
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

interface SalesChartData {
  date: string
  total: number
  count: number
}

interface MetricsData {
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  totalTransactions: number
  avgOrderValue: number
}

interface SummaryData {
  metrics: MetricsData
  topCustomers: any[]
  lowStockProducts: any[]
}

export default function ReportsPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [chartData, setChartData] = useState<SalesChartData[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportType, setReportType] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [generating, setGenerating] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)

      const [
        summaryRes,
        chartRes,
        salesRes,
        categoriesRes,
        paymentsRes
      ] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/sales-chart?days=30'),
        fetch('/api/sales?limit=1000'),
        fetch('/api/categories'),
        fetch('/api/payment-methods')
      ])

      const [
        summary,
        chart,
        salesData,
        categoriesData,
        paymentsData
      ] = await Promise.all([
        summaryRes.json(),
        chartRes.json(),
        salesRes.json(),
        categoriesRes.json(),
        paymentsRes.json()
      ])

      setSummaryData(summary)
      setChartData(chart)
      setSales(salesData.sales || [])
      setCategories(categoriesData.categories || [])
      setPaymentMethods(paymentsData.paymentMethods || [])
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  const handleGenerateReport = async () => {
    if (!reportType || !dateFrom || !dateTo) {
      alert("Please select report type and date range")
      return
    }

    setGenerating(true)
    try {
      // Validate date range
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)

      if (fromDate > toDate) {
        alert("From date cannot be after To date")
        return
      }

      // Here you would typically call an API to generate the report data
      // For now, we'll simulate report generation with current data
      await new Promise(resolve => setTimeout(resolve, 1500))

      alert(`Report generated successfully! You can now export it as PDF or Excel.`)
    } catch (error) {
      console.error("Report generation error:", error)
      alert("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.text('POS Supermarket System', 20, 30)
    doc.setFontSize(16)
    doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, 45)

    // Add date range
    doc.setFontSize(12)
    doc.text(`Report Period: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`, 20, 60)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 70)

    let yPosition = 90

    // Add report-specific content
    switch (reportType) {
      case 'sales':
        doc.setFontSize(14)
        doc.text('Sales Summary', 20, yPosition)
        yPosition += 20

        doc.setFontSize(12)
        doc.text(`Total Revenue: UGX ${metrics.totalRevenue.toLocaleString()}`, 20, yPosition)
        yPosition += 10
        doc.text(`Total Transactions: ${metrics.totalTransactions}`, 20, yPosition)
        yPosition += 10
        doc.text(`Average Order Value: UGX ${metrics.avgOrderValue.toLocaleString()}`, 20, yPosition)
        yPosition += 20

        // Add sales data
        if (chartData.length > 0) {
          doc.text('Daily Sales Data:', 20, yPosition)
          yPosition += 10
          chartData.slice(0, 10).forEach((day, index) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 30
            }
            doc.text(`${day.date}: ${day.count} transactions - UGX ${day.total.toLocaleString()}`, 30, yPosition)
            yPosition += 8
          })
        }
        break

      case 'inventory':
        doc.setFontSize(14)
        doc.text('Inventory Summary', 20, yPosition)
        yPosition += 20

        doc.setFontSize(12)
        doc.text(`Total Products: ${metrics.totalProducts}`, 20, yPosition)
        yPosition += 20

        // Add low stock alerts
        if (summaryData?.lowStockProducts && summaryData.lowStockProducts.length > 0) {
          doc.text('Low Stock Alerts:', 20, yPosition)
          yPosition += 10
          summaryData.lowStockProducts.slice(0, 15).forEach((product: any) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 30
            }
            doc.text(`${product.name}: ${product.inventory?.quantity || 0} remaining`, 30, yPosition)
            yPosition += 8
          })
        }
        break

      case 'customers':
        doc.setFontSize(14)
        doc.text('Customer Summary', 20, yPosition)
        yPosition += 20

        doc.setFontSize(12)
        doc.text(`Total Customers: ${metrics.totalCustomers}`, 20, yPosition)
        yPosition += 20

        // Add top customers
        if (summaryData?.topCustomers && summaryData.topCustomers.length > 0) {
          doc.text('Top Customers by Spending:', 20, yPosition)
          yPosition += 10
          summaryData.topCustomers.slice(0, 10).forEach((customer: any, index: number) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 30
            }
            doc.text(`${index + 1}. ${customer.full_name}: UGX ${customer.total_spent.toLocaleString()} (${customer.total_visits} visits)`, 30, yPosition)
            yPosition += 8
          })
        }
        break

      case 'financial':
        doc.setFontSize(14)
        doc.text('Financial Summary', 20, yPosition)
        yPosition += 20

        doc.setFontSize(12)
        doc.text(`Total Revenue: UGX ${metrics.totalRevenue.toLocaleString()}`, 20, yPosition)
        yPosition += 10
        doc.text(`Total Transactions: ${metrics.totalTransactions}`, 20, yPosition)
        yPosition += 10
        doc.text(`Average Order Value: UGX ${metrics.avgOrderValue.toLocaleString()}`, 20, yPosition)
        yPosition += 20

        doc.text('Revenue Breakdown:', 20, yPosition)
        yPosition += 10
        // This would include more detailed financial data in a real implementation
        doc.text('• Sales Revenue: Primary income source', 30, yPosition)
        yPosition += 8
        doc.text('• Service Revenue: Additional services', 30, yPosition)
        yPosition += 8
        doc.text('• Other Income: Miscellaneous revenue', 30, yPosition)
        break

      case 'suppliers':
        doc.setFontSize(14)
        doc.text('Supplier Summary', 20, yPosition)
        yPosition += 20

        doc.setFontSize(12)
        doc.text('Supplier performance and procurement metrics', 20, yPosition)
        yPosition += 10
        doc.text('• Supplier evaluation based on delivery time and quality', 20, yPosition)
        yPosition += 8
        doc.text('• Purchase order tracking and fulfillment', 20, yPosition)
        yPosition += 8
        doc.text('• Cost analysis and negotiation opportunities', 20, yPosition)
        break

      case 'employees':
        doc.setFontSize(14)
        doc.text('Employee Summary', 20, yPosition)
        yPosition += 20

        doc.setFontSize(12)
        doc.text('Staff performance and management overview', 20, yPosition)
        yPosition += 10
        doc.text('• Employee productivity metrics', 20, yPosition)
        yPosition += 8
        doc.text('• Attendance and shift management', 20, yPosition)
        yPosition += 8
        doc.text('• Training and development tracking', 20, yPosition)
        break

      default:
        doc.text('Report content will be generated based on selected criteria.', 20, yPosition)
    }

    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, 180, 285)
      doc.text('Generated by POS Supermarket System', 20, 285)
    }

    // Save the PDF
    const fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const handleExportExcel = async () => {
    let data: any[] = []
    let worksheetName = 'Report'

    // Create data based on report type
    switch (reportType) {
      case 'sales':
        worksheetName = 'Sales Report'
        data = [
          ['Report Type', 'Sales Report'],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['Summary'],
          ['Total Revenue', `UGX ${metrics.totalRevenue.toLocaleString()}`],
          ['Total Transactions', metrics.totalTransactions],
          ['Average Order Value', `UGX ${metrics.avgOrderValue.toLocaleString()}`],
          [''],
          ['Daily Sales Data'],
          ['Date', 'Transactions', 'Revenue']
        ]

        // Add daily sales data
        chartData.forEach(day => {
          data.push([day.date, day.count, day.total])
        })
        break

      case 'inventory':
        worksheetName = 'Inventory Report'
        data = [
          ['Report Type', 'Inventory Report'],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['Summary'],
          ['Total Products', metrics.totalProducts],
          [''],
          ['Low Stock Products'],
          ['Product Name', 'Current Stock']
        ]

        // Add low stock products
        if (summaryData?.lowStockProducts) {
          summaryData.lowStockProducts.forEach((product: any) => {
            data.push([product.name, product.inventory?.quantity || 0])
          })
        }
        break

      case 'customers':
        worksheetName = 'Customer Report'
        data = [
          ['Report Type', 'Customer Report'],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['Summary'],
          ['Total Customers', metrics.totalCustomers],
          [''],
          ['Top Customers'],
          ['Rank', 'Customer Name', 'Total Spent', 'Visits', 'Membership Tier']
        ]

        // Add top customers
        if (summaryData?.topCustomers) {
          summaryData.topCustomers.forEach((customer: any, index: number) => {
            data.push([
              index + 1,
              customer.full_name,
              customer.total_spent,
              customer.total_visits,
              customer.membership_tier
            ])
          })
        }
        break

      case 'financial':
        worksheetName = 'Financial Report'
        data = [
          ['Report Type', 'Financial Report'],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['Financial Summary'],
          ['Metric', 'Value'],
          ['Total Revenue', `UGX ${metrics.totalRevenue.toLocaleString()}`],
          ['Total Transactions', metrics.totalTransactions],
          ['Average Order Value', `UGX ${metrics.avgOrderValue.toLocaleString()}`],
          ['Total Customers', metrics.totalCustomers],
          ['Total Products', metrics.totalProducts]
        ]
        break

      case 'suppliers':
        worksheetName = 'Supplier Report'
        data = [
          ['Report Type', 'Supplier Report'],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['Supplier Information'],
          ['This report contains supplier performance metrics and procurement data']
        ]
        break

      case 'employees':
        worksheetName = 'Employee Report'
        data = [
          ['Report Type', 'Employee Report'],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['Employee Information'],
          ['This report contains staff performance and management data']
        ]
        break

      default:
        data = [
          ['Report Type', reportType],
          ['Period', `${dateFrom} to ${dateTo}`],
          ['Generated', new Date().toLocaleDateString()],
          [''],
          ['No specific data available for this report type']
        ]
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Set column widths
    const colWidths = data[0].map(() => ({ wch: 15 }))
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, worksheetName)

    // Generate filename and save
    const fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const metrics = summaryData?.metrics || {
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    avgOrderValue: 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Business Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive insights into your business performance
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Report Generation Interface */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
            <FileText className="h-6 w-6 text-slate-600" />
            Generate Custom Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="customers">Customer Report</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="suppliers">Supplier Report</SelectItem>
                  <SelectItem value="employees">Employee Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={generating || !reportType || !dateFrom || !dateTo}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1"
              >
                <Play className={`mr-2 h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>

          {reportType && dateFrom && dateTo && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              UGX {metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              From {metrics.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{metrics.totalCustomers}</div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Product Catalog</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{metrics.totalProducts}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              UGX {metrics.avgOrderValue.toLocaleString()}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Warnings */}
      {summaryData?.lowStockProducts && summaryData.lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:border-orange-800 dark:from-orange-950/20 dark:to-red-950/20 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
              {summaryData.lowStockProducts.length} product{summaryData.lowStockProducts.length !== 1 ? 's' : ''} are running low on stock and need replenishment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {summaryData.lowStockProducts.slice(0, 8).map((product: any) => (
                <Badge key={product.id} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700 justify-center py-2 px-3 transition-all duration-200 hover:bg-orange-200 dark:hover:bg-orange-800/40 hover:scale-105">
                  {product.name} ({product.inventory?.quantity || 0})
                </Badge>
              ))}
              {summaryData.lowStockProducts.length > 8 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700 justify-center py-2 px-3 transition-all duration-200 hover:bg-orange-200 dark:hover:bg-orange-800/40 hover:scale-105">
                  +{summaryData.lowStockProducts.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Customers */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20 shadow-md">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
            <Users className="h-6 w-6 text-slate-600" />
            Top Customers by Spending
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {summaryData?.topCustomers && summaryData.topCustomers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {summaryData.topCustomers.map((customer: any, index: number) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shadow-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{customer.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {customer.membership_tier}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {customer.total_visits} visits
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      UGX {customer.total_spent.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total spent</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customer data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Reports Dashboard */}
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-lg border-0">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Detailed Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ReportsDashboard
            sales={sales}
            salesChartData={chartData}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </CardContent>
      </Card>
    </div>
  )
}