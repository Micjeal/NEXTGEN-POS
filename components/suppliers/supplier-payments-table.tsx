"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, DollarSign, Calendar, CreditCard, MoreHorizontal, Plus, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SupplierPaymentsTableProps {
  invoices: any[]
  suppliers: any[]
}

export function SupplierPaymentsTable({ invoices, suppliers }: SupplierPaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const { toast } = useToast()

  const filteredInvoices = invoices.filter(inv => {
    const searchLower = searchTerm.toLowerCase()
    return (
      inv.invoice_number?.toLowerCase().includes(searchLower) ||
      inv.supplier?.name?.toLowerCase().includes(searchLower)
    )
  })

  const outstandingInvoices = filteredInvoices.filter(inv => 
    inv.status === "unpaid" || inv.status === "partially_paid"
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "partially_paid": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "unpaid": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "cancelled": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Outstanding</span>
              <span className="text-lg font-bold">
                UGX {outstandingInvoices.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0).toLocaleString()}
              </span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pending</span>
              <span className="text-lg font-bold">{outstandingInvoices.length}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Supplier Invoices & Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0)
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.supplier?.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">UGX {(invoice.total_amount || 0).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">UGX {(invoice.paid_amount || 0).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                          UGX {balance.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowPaymentDialog(true)
                            }}>
                              <Plus className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {filteredInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Paid to date</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0) - (inv.paid_amount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Amount due</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
