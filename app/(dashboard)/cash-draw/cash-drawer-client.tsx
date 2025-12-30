"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Plus, Minus, Receipt, Lock, Unlock, AlertTriangle, CheckCircle, XCircle, RefreshCw, CreditCard, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { useToast } from "@/hooks/use-toast"

interface CashDrawer {
  id: string
  status: 'open' | 'closed' | 'reconciled'
  opening_balance: number
  current_balance: number
  expected_balance: number
  opened_at: string
  closed_at?: string
  reconciled_at?: string
  notes?: string
}

interface CashTransaction {
  id: string
  transaction_type: string
  amount: number
  description: string
  balance_before: number
  balance_after: number
  created_at: string
  notes?: string
}

interface TodaySummary {
  salesTotal: number
  salesCount: number
  customerCount: number
  paymentBreakdown: {
    cash: number
    card: number
    mobile: number
    other: number
  }
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
  category: string
}

interface LowStockItem {
  name: string
  inventory: {
    quantity: number
  }
}

interface CashDrawerData {
  drawer: CashDrawer | null
  transactions: CashTransaction[]
  todaySummary?: TodaySummary
  topProducts?: TopProduct[]
  lowStockItems?: LowStockItem[]
}

export default function CashDrawerClient() {
  const [data, setData] = useState<CashDrawerData>({ drawer: null, transactions: [] })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  // Form states
  const [openingBalance, setOpeningBalance] = useState("")
  const [transactionAmount, setTransactionAmount] = useState("")
  const [transactionDescription, setTransactionDescription] = useState("")
  const [transactionType, setTransactionType] = useState("")
  const [transactionNotes, setTransactionNotes] = useState("")
  const [closeActualBalance, setCloseActualBalance] = useState("")
  const [closeNotes, setCloseNotes] = useState("")
  const [reconcileActualBalance, setReconcileActualBalance] = useState("")
  const [reconcileNotes, setReconcileNotes] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const response = await fetch("/api/cash-drawer?t=" + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch cash drawer data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up real-time subscriptions
    const supabase = createClient()

    // Subscribe to cash drawer changes
    const drawerSubscription = supabase
      .channel('cash_drawer_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cash_drawers'
      }, (payload) => {
        console.log('Drawer change:', payload)
        fetchData() // Refresh data when drawer changes
      })
      .subscribe()

    // Subscribe to cash transaction changes
    const transactionSubscription = supabase
      .channel('cash_transaction_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cash_transactions'
      }, (payload) => {
        console.log('Transaction change:', payload)
        fetchData() // Refresh data when transactions change
      })
      .subscribe()

    // Fallback polling every 5 seconds in case real-time doesn't work
    const pollInterval = setInterval(fetchData, 5000)

    // Cleanup subscriptions and polling
    return () => {
      drawerSubscription.unsubscribe()
      transactionSubscription.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [])

  const handleOpenDrawer = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid opening balance",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch("/api/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open_drawer",
          opening_balance: parseFloat(openingBalance)
        })
      })

      if (response.ok) {
        toast({
          title: "Cash Drawer Open",
          description: "Cash drawer has been opened successfully"
        })
        setOpeningBalance("")
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to open drawer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error opening drawer:", error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseDrawer = async () => {
    if (!closeActualBalance || parseFloat(closeActualBalance) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid actual balance",
        variant: "destructive"
      })
      return
    }

    if (!data.drawer) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close_drawer",
          drawer_id: data.drawer.id,
          actual_balance: parseFloat(closeActualBalance),
          notes: closeNotes
        })
      })

      if (response.ok) {
        toast({
          title: "Cash Drawer Closed",
          description: "Cash drawer has been closed successfully"
        })
        setCloseActualBalance("")
        setCloseNotes("")
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to close drawer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error closing drawer:", error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!transactionAmount || !transactionDescription || !transactionType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!data.drawer) return

    const amount = parseFloat(transactionAmount)
    if (amount === 0) {
      toast({
        title: "Invalid Amount",
        description: "Transaction amount cannot be zero",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch("/api/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_transaction",
          drawer_id: data.drawer.id,
          transaction_type: transactionType,
          amount: amount,
          description: transactionDescription,
          notes: transactionNotes
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Transaction added successfully"
        })
        setTransactionAmount("")
        setTransactionDescription("")
        setTransactionType("")
        setTransactionNotes("")
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add transaction",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReconcile = async () => {
    if (!reconcileActualBalance || parseFloat(reconcileActualBalance) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid actual balance",
        variant: "destructive"
      })
      return
    }

    if (!data.drawer) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reconcile",
          drawer_id: data.drawer.id,
          actual_balance: parseFloat(reconcileActualBalance),
          notes: reconcileNotes
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Drawer reconciled successfully${result.discrepancy !== 0 ? ` (discrepancy: ${formatCurrency(result.discrepancy)})` : ''}`
        })
        setReconcileActualBalance("")
        setReconcileNotes("")
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to reconcile drawer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error reconciling drawer:", error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const { drawer, transactions } = data
  const isDrawerOpen = drawer?.status === 'open'
  const discrepancy = drawer ? drawer.current_balance - drawer.expected_balance : 0

  // Calculate daily cash in and out using UTC dates
  const today = new Date()
  const todayString = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`
  const todaysTransactions = transactions.filter(t => {
    const date = new Date(t.created_at)
    const dateString = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
    return dateString === todayString
  })
  const cashInToday = data.todaySummary?.paymentBreakdown.cash || 0
  const cashOutToday = Math.abs(todaysTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0))

  return (
    <div className="space-y-6">
      {/* Drawer Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDrawerOpen ? (
              <Unlock className="h-5 w-5 text-green-600" aria-hidden="true" />
            ) : (
              <Lock className="h-5 w-5 text-red-600" aria-hidden="true" />
            )}
            Drawer Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Badge
              variant={isDrawerOpen ? "default" : "secondary"}
              className="text-lg px-4 py-2 self-start"
              aria-live="polite"
            >
              {isDrawerOpen ? "OPEN" : drawer?.status === 'closed' ? "CLOSED" : "RECONCILED"}
            </Badge>
            {drawer && (
              <div className="text-sm text-muted-foreground">
                {isDrawerOpen ? (
                  <>Opened at {new Date(drawer.opened_at).toLocaleString()}</>
                ) : drawer.closed_at ? (
                  <>Closed at {new Date(drawer.closed_at).toLocaleString()}</>
                ) : (
                  <>Reconciled at {new Date(drawer.reconciled_at!).toLocaleString()}</>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      {drawer && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20" role="region" aria-labelledby="current-balance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="current-balance" className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" aria-label={`Current balance: ${formatCurrency(drawer.current_balance)}`}>
                {formatCurrency(drawer.current_balance)}
              </div>
              <p className="text-xs text-muted-foreground">Available cash in drawer</p>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="expected-balance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="expected-balance" className="text-sm font-medium">Expected Balance</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`Expected balance: ${formatCurrency(drawer.expected_balance)}`}>
                {formatCurrency(drawer.expected_balance)}
              </div>
              <p className="text-xs text-muted-foreground">Expected based on transactions</p>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="opening-float">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="opening-float" className="text-sm font-medium">Opening Float</CardTitle>
              <Plus className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`Opening float: ${formatCurrency(drawer.opening_balance)}`}>
                {formatCurrency(drawer.opening_balance)}
              </div>
              <p className="text-xs text-muted-foreground">Initial cash amount</p>
            </CardContent>
          </Card>

          {Math.abs(discrepancy) > 0.01 && (
            <Card
              className={`border-2 ${discrepancy > 0 ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}
              role="alert"
              aria-labelledby="discrepancy-amount"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle id="discrepancy-amount" className="text-sm font-medium">Discrepancy</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${discrepancy > 0 ? 'text-yellow-600' : 'text-red-600'}`} aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${discrepancy > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatCurrency(discrepancy)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {discrepancy > 0 ? 'Over' : 'Short'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Daily Cash In Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Daily Cash In Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cash In Today</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(cashInToday)}</p>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Transactions today: {todaysTransactions.length}
          </div>
        </CardContent>
      </Card>

      {/* Today's Sales Summary */}
      {data.todaySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Today's Sales Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.todaySummary.salesTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sales Count</p>
                <p className="text-2xl font-bold text-blue-600">{data.todaySummary.salesCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold text-purple-600">{data.todaySummary.customerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Breakdown */}
      {data.todaySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Payment Methods Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.todaySummary.paymentBreakdown.cash > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cash</span>
                  <span className="font-semibold text-green-600">{formatCurrency(data.todaySummary.paymentBreakdown.cash)}</span>
                </div>
              )}
              {data.todaySummary.paymentBreakdown.card > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Card</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(data.todaySummary.paymentBreakdown.card)}</span>
                </div>
              )}
              {data.todaySummary.paymentBreakdown.mobile > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mobile Money</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(data.todaySummary.paymentBreakdown.mobile)}</span>
                </div>
              )}
              {data.todaySummary.paymentBreakdown.other > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Other</span>
                  <span className="font-semibold text-gray-600">{formatCurrency(data.todaySummary.paymentBreakdown.other)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products Today */}
      {data.topProducts && data.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Top Products Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={product.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}.</span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.quantity} sold</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      {data.lowStockItems && data.lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.lowStockItems.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    {item.inventory.quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Alert */}
      {drawer && Math.abs(discrepancy) > 0.01 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            There is a discrepancy of {formatCurrency(Math.abs(discrepancy))} between the current balance and expected balance.
            Please reconcile the drawer to resolve this issue.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {!drawer && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Unlock className="h-4 w-4 mr-2" />
                    Open Drawer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Open Cash Drawer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="opening-balance">Opening Balance</Label>
                      <Input
                        id="opening-balance"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleOpenDrawer} disabled={actionLoading} className="w-full">
                      {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                      Open Drawer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isDrawerOpen && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Cash Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="transaction-type">Transaction Type</Label>
                        <Select value={transactionType} onValueChange={setTransactionType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash_in">Cash In</SelectItem>
                            <SelectItem value="cash_out">Cash Out</SelectItem>
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="transaction-amount">Amount</Label>
                        <Input
                          id="transaction-amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={transactionAmount}
                          onChange={(e) => setTransactionAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="transaction-description">Description</Label>
                        <Input
                          id="transaction-description"
                          placeholder="Transaction description"
                          value={transactionDescription}
                          onChange={(e) => setTransactionDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="transaction-notes">Notes (Optional)</Label>
                        <Textarea
                          id="transaction-notes"
                          placeholder="Additional notes"
                          value={transactionNotes}
                          onChange={(e) => setTransactionNotes(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddTransaction} disabled={actionLoading} className="w-full">
                        {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                        Add Transaction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Close Drawer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close Cash Drawer</AlertDialogTitle>
                      <AlertDialogDescription>
                        Enter the actual cash amount counted in the drawer. This will close the drawer for the day.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="close-actual-balance">Actual Balance Counted</Label>
                        <Input
                          id="close-actual-balance"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={closeActualBalance}
                          onChange={(e) => setCloseActualBalance(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="close-notes">Notes (Optional)</Label>
                        <Textarea
                          id="close-notes"
                          placeholder="Closing notes"
                          value={closeNotes}
                          onChange={(e) => setCloseNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCloseDrawer} disabled={actionLoading}>
                        {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                        Close Drawer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {drawer?.status === 'closed' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reconcile Drawer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reconcile Cash Drawer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Expected balance: {formatCurrency(drawer.expected_balance)}
                        {Math.abs(discrepancy) > 0.01 && (
                          <><br />Discrepancy: {formatCurrency(discrepancy)}</>
                        )}
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="reconcile-actual-balance">Confirmed Actual Balance</Label>
                      <Input
                        id="reconcile-actual-balance"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={reconcileActualBalance}
                        onChange={(e) => setReconcileActualBalance(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reconcile-notes">Reconciliation Notes</Label>
                      <Textarea
                        id="reconcile-notes"
                        placeholder="Explain any discrepancies"
                        value={reconcileNotes}
                        onChange={(e) => setReconcileNotes(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleReconcile} disabled={actionLoading} className="w-full">
                      {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                      Reconcile Drawer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {transaction.transaction_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={transaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.balance_after)}</TableCell>
                    <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}