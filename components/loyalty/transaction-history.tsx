"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Settings, ShoppingCart } from "lucide-react"

interface Transaction {
  id: string
  transaction_type: 'earn' | 'redeem' | 'adjustment'
  points: number
  points_balance_before: number
  points_balance_after: number
  description: string | null
  sale_id: string | null
  created_at: string
  performed_by?: string
}

interface TransactionHistoryProps {
  accountId: string
}

export function TransactionHistory({ accountId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/loyalty/accounts/${accountId}/transactions`)
        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (accountId) {
      fetchTransactions()
    }
  }, [accountId])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'redeem':
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <Settings className="h-4 w-4 text-blue-600" />
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'bg-green-100 text-green-800'
      case 'redeem':
        return 'bg-red-100 text-red-800'
      case 'adjustment':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPointsDisplay = (points: number, type: string) => {
    const sign = type === 'redeem' ? '-' : '+'
    const color = type === 'redeem' ? 'text-red-600' : 'text-green-600'
    return <span className={`font-medium ${color}`}>{sign}{Math.abs(points)}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading transaction history...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactions
                .filter(t => t.transaction_type === 'earn')
                .reduce((sum, t) => sum + t.points, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transactions
                .filter(t => t.transaction_type === 'redeem')
                .reduce((sum, t) => sum + Math.abs(t.points), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Complete history of points earned, redeemed, and adjusted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No transactions found</h3>
              <p className="text-muted-foreground">
                This customer hasn't earned or redeemed any points yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Balance Before</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Sale ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()} <br />
                      <span className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <Badge className={getTransactionColor(transaction.transaction_type)}>
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={transaction.description || ''}>
                        {transaction.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPointsDisplay(transaction.points, transaction.transaction_type)}
                    </TableCell>
                    <TableCell>{transaction.points_balance_before.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      {transaction.points_balance_after.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {transaction.sale_id ? (
                        <span className="font-mono text-sm">{transaction.sale_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}