"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Receipt, TrendingUp, TrendingDown, Calendar, Eye } from "lucide-react"
import { format } from "date-fns"

interface CustomerTransactionHistoryProps {
  transactions: any[]
}

export function CustomerTransactionHistory({ transactions }: CustomerTransactionHistoryProps) {
  const [showAll, setShowAll] = useState(false)

  const displayTransactions = showAll ? transactions : transactions.slice(0, 5)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'redeem':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Receipt className="h-4 w-4 text-blue-500" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-green-600'
      case 'redeem':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Points History
            </CardTitle>
            <CardDescription>
              Your recent points earnings and redemptions
            </CardDescription>
          </div>
          {transactions.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showAll ? 'Show Less' : 'View All'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-muted-foreground">
              Your points transaction history will appear here once you start earning or redeeming points.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">
                        {transaction.transaction_type === 'earn' ? 'Earned' : 'Redeemed'} Points
                      </span>
                      <Badge
                        variant={transaction.transaction_type === 'earn' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.transaction_type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </div>

                      {transaction.sale && (
                        <div className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          Invoice #{transaction.sale.invoice_number}
                        </div>
                      )}
                    </div>

                    {transaction.reason && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                    {transaction.transaction_type === 'earn' ? '+' : '-'}{transaction.points}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Balance: {transaction.points_balance_after}
                  </div>
                </div>
              </div>
            ))}

            {transactions.length > 5 && !showAll && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                >
                  View {transactions.length - 5} More Transactions
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}