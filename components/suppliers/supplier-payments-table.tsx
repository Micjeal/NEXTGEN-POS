"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, CreditCard, DollarSign, Calendar, Building2, FileText, CheckCircle, Clock, XCircle } from "lucide-react"

interface SupplierInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  status: string
  supplier: {
    name: string
  }
  purchase_order: {
    order_number: string
  }
  payments: Array<{
    amount: number
    payment_date: string
    payment_method: string
  }>
}

interface SupplierPaymentsTableProps {
  invoices: SupplierInvoice[]
}

export function SupplierPaymentsTable({ invoices }: SupplierPaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredInvoices = invoices.filter(invoice =>
    invoice.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.purchase_order?.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'overdue': return <XCircle className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
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
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Invoices</span>
              <span className="text-lg font-bold">{invoices.length}</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Paid</span>
              <span className="text-lg font-bold">{invoices.filter(inv => inv.status === 'paid').length}</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
              <span className="text-lg font-bold">{invoices.filter(inv => inv.status === 'pending').length}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Supplier Payments & Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Purchase Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
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
                        <div>
                          <div className="font-medium">{invoice.invoice_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{invoice.supplier?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{invoice.purchase_order?.order_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            UGX {invoice.total_amount?.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            UGX {invoice.paid_amount?.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-red-600" />
                          <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            UGX {balance.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(invoice.status)}
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}