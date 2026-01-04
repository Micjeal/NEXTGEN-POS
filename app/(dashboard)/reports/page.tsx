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
  totalCostOfGoods: number
  totalProfit: number
}

interface SummaryData {
  metrics: MetricsData
  topCustomers: any[]
  topProducts: any[]
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
  const [branchId, setBranchId] = useState("")
  const [generating, setGenerating] = useState(false)
  const [taxData, setTaxData] = useState<any>(null)
  const [systemLogs, setSystemLogs] = useState<any[]>([])

  const fetchData = async () => {
    try {
      setRefreshing(true)

      const [
        summaryRes,
        chartRes,
        salesRes,
        categoriesRes,
        paymentsRes,
        systemLogsRes
      ] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/sales-chart?days=30'),
        fetch('/api/sales?limit=1000'),
        fetch('/api/categories'),
        fetch('/api/payment-methods'),
        fetch('/api/reports/system-logs')
      ])

      const [
        summary,
        chart,
        salesData,
        categoriesData,
        paymentsData,
        systemLogsData
      ] = await Promise.all([
        summaryRes.json(),
        chartRes.json(),
        salesRes.json(),
        categoriesRes.json(),
        paymentsRes.json(),
        systemLogsRes.json()
      ])

      setSummaryData(summary)
      setChartData(chart)
      setSales(salesData.sales || [])
      setCategories(categoriesData.categories || [])
      setPaymentMethods(paymentsData.paymentMethods || [])
      setSystemLogs(systemLogsData.logs || [])
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
        doc.text(`Cost of Goods Sold: UGX ${metrics.totalCostOfGoods.toLocaleString()}`, 20, yPosition)
        yPosition += 10
        doc.text(`Total Profit: UGX ${metrics.totalProfit.toLocaleString()}`, 20, yPosition)
        yPosition += 10
        doc.text(`Total Transactions: ${metrics.totalTransactions}`, 20, yPosition)
        yPosition += 10
        doc.text(`Average Order Value: UGX ${metrics.avgOrderValue.toLocaleString()}`, 20, yPosition)
        yPosition += 20

        doc.text('Revenue Breakdown:', 20, yPosition)
        yPosition += 10
        doc.text('• Sales Revenue: Primary income source', 30, yPosition)
        yPosition += 8
        doc.text('• Cost of Goods: Based on product cost prices', 30, yPosition)
        yPosition += 8
        doc.text('• Gross Profit: Revenue minus cost of goods', 30, yPosition)
        yPosition += 8
        doc.text('• Operating Expenses: Not included in this summary', 30, yPosition)
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
          ['Cost of Goods Sold', `UGX ${metrics.totalCostOfGoods.toLocaleString()}`],
          ['Total Profit', `UGX ${metrics.totalProfit.toLocaleString()}`],
          ['Total Transactions', metrics.totalTransactions],
          ['Average Order Value', `UGX ${metrics.avgOrderValue.toLocaleString()}`],
          ['Total Customers', metrics.totalCustomers],
          ['Total Products', metrics.totalProducts],
          [''],
          ['Top Products by Revenue'],
          ['Product Name', 'Units Sold', 'Total Revenue']
        ]

        // Add top products data
        if (summaryData?.topProducts) {
          summaryData.topProducts.slice(0, 10).forEach((product: any) => {
            data.push([product.name, product.total_quantity, `UGX ${product.total_revenue.toLocaleString()}`])
          })
        }
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
    avgOrderValue: 0,
    totalCostOfGoods: 0,
    totalProfit: 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/30 to-blue-400/30 blur-3xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Business Reports & Analytics
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  Comprehensive insights into your business performance
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:shadow-xl transition-all duration-300 self-start sm:self-auto px-6 py-3 rounded-xl"
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Report Generation Interface */}
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-950/50 dark:via-slate-900/50 dark:to-slate-800/50 shadow-xl border-0 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Generate Custom Reports</h3>
              <p className="text-sm text-muted-foreground">Create detailed reports for specific time periods</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-3">
              <Label htmlFor="report-type" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-12 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="sales" className="rounded-lg">📊 Sales Report</SelectItem>
                  <SelectItem value="inventory" className="rounded-lg">📦 Inventory Report</SelectItem>
                  <SelectItem value="customers" className="rounded-lg">👥 Customer Report</SelectItem>
                  <SelectItem value="financial" className="rounded-lg">💰 Financial Report</SelectItem>
                  <SelectItem value="suppliers" className="rounded-lg">🏢 Supplier Report</SelectItem>
                  <SelectItem value="employees" className="rounded-lg">👷 Employee Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="date-from" className="text-sm font-semibold text-slate-700 dark:text-slate-300">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-12 pl-12 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="date-to" className="text-sm font-semibold text-slate-700 dark:text-slate-300">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-12 pl-12 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerateReport}
                disabled={generating || !reportType || !dateFrom || !dateTo}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                <Play className={`mr-2 h-5 w-5 ${generating ? 'animate-pulse' : ''}`} />
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>

          {reportType && dateFrom && dateTo && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="flex items-center gap-3 h-11 px-6 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="flex items-center gap-3 h-11 px-6 rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
              >
                <FileDown className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/30 dark:via-blue-900/30 dark:to-blue-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Revenue</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              UGX {metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              From {metrics.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950/30 dark:via-green-900/30 dark:to-green-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Active Customers</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">{metrics.totalCustomers}</div>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/30 dark:via-purple-900/30 dark:to-purple-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">Product Catalog</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">{metrics.totalProducts}</div>
            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-orange-950/30 dark:via-orange-900/30 dark:to-orange-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100">Avg Order Value</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">
              UGX {metrics.avgOrderValue.toLocaleString()}
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-emerald-950/30 dark:via-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Total Profit</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
              UGX {metrics.totalProfit.toLocaleString()}
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              Revenue - Cost of Goods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Warnings */}
      {summaryData?.lowStockProducts && summaryData.lowStockProducts.length > 0 && (
        <Card className="relative overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 dark:border-orange-800 dark:from-orange-950/30 dark:via-red-950/30 dark:to-orange-900/30 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-400/5"></div>
          <CardHeader className="pb-6 relative">
            <CardTitle className="flex items-center gap-4 text-orange-800 dark:text-orange-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Low Stock Alert</h3>
                <p className="text-sm text-orange-600 dark:text-orange-300 font-medium">
                  {summaryData.lowStockProducts.length} product{summaryData.lowStockProducts.length !== 1 ? 's' : ''} need replenishment
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {summaryData.lowStockProducts.slice(0, 8).map((product: any) => (
                <div key={product.id} className="group flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-400">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 truncate">{product.name}</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">{product.inventory?.quantity || 0} remaining</p>
                  </div>
                </div>
              ))}
              {summaryData.lowStockProducts.length > 8 && (
                <div className="group flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-400">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">+{summaryData.lowStockProducts.length - 8} more</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">Low stock items</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Activity Monitoring */}
      <Card className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950/30 dark:via-slate-900/30 dark:to-slate-800/30 shadow-xl border-0">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Database Activity Monitor</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Real-time system activities and database operations
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {systemLogs.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {systemLogs.slice(0, 10).map((log: any, index: number) => (
                <div key={log.id || index} className="group flex items-start gap-4 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 font-semibold">
                        {log.event_type}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 mx-auto mb-4 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Recent Activity</h4>
              <p className="text-slate-600 dark:text-slate-400">Database activity will appear here as operations occur</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950/30 dark:via-slate-900/30 dark:to-slate-800/30 shadow-xl border-0">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-teal-600 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Top Customers by Spending</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Highest value customers and their purchase history
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {summaryData?.topCustomers && summaryData.topCustomers.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {summaryData.topCustomers.map((customer: any, index: number) => (
                <div key={customer.id} className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white text-lg font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">{customer.full_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary" className="text-xs px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 font-semibold">
                            {customer.membership_tier}
                          </Badge>
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {customer.total_visits} visits
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <p className="font-bold text-2xl text-slate-900 dark:text-slate-100 mb-1">
                        UGX {customer.total_spent.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total spent</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 mx-auto mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Customer Data</h4>
              <p className="text-slate-600 dark:text-slate-400">Customer information will appear here once available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950/30 dark:via-slate-900/30 dark:to-slate-800/30 shadow-xl border-0">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Top Products by Sales Volume</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Best-selling products and their performance metrics
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {summaryData?.topProducts && summaryData.topProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {summaryData.topProducts.map((product: any, index: number) => (
                <div key={product.id} className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">{product.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {product.total_quantity} units sold
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <p className="font-bold text-2xl text-slate-900 dark:text-slate-100 mb-1">
                        UGX {product.total_revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 mx-auto mb-4 shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Product Data</h4>
              <p className="text-slate-600 dark:text-slate-400">Product sales information will appear here once available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Reports Dashboard */}
      <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-800/50 shadow-2xl border-0 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Detailed Analytics Dashboard</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Comprehensive charts and insights for business intelligence
              </p>
            </div>
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