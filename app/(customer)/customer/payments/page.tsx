import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard, Plus, Trash2, Shield, Lock
} from "lucide-react"
import { redirect } from "next/navigation"

export default async function CustomerPaymentsPage() {
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

  let customer = null
  let paymentTransactions: any[] = []

  if (registeredCustomer) {
    const { data: customerData } = await serviceClient
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single()

    if (customerData) {
      customer = customerData

      // Get payment transaction history (sales with payment info)
      const { data: transactions } = await serviceClient
        .from("sales")
        .select(`
          id,
          invoice_number,
          total,
          payment_method,
          payment_status,
          created_at,
          status
        `)
        .eq("customer_id", customer.id)
        .not("payment_status", "is", null)
        .order("created_at", { ascending: false })
        .limit(10)

      paymentTransactions = transactions || []
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your saved payment options for faster checkout</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Saved Cards
            </CardTitle>
            <CardDescription>
              Your stored payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved cards</h3>
              <p className="text-muted-foreground mb-4">
                Add a payment method to speed up your checkout process.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </div>

            {/* Future: Saved cards list */}
            {/*
            <div className="space-y-4">
              {savedCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• {card.last4}</p>
                      <p className="text-sm text-muted-foreground">Expires {card.expMonth}/{card.expYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.isDefault && <Badge variant="secondary">Default</Badge>}
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            */}
          </CardContent>
        </Card>

        {/* Payment Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payment Security
            </CardTitle>
            <CardDescription>
              Your payment information is protected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <Lock className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Secure Payments</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  All transactions are encrypted and secure
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">PCI Compliant</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  We follow industry security standards
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Accepted Payment Methods</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Visa</Badge>
                <Badge variant="outline">Mastercard</Badge>
                <Badge variant="outline">Mobile Money</Badge>
                <Badge variant="outline">Cash on Delivery</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-muted-foreground">
              Your payment history will appear here after your first purchase.
            </p>
          </div>

          {/* Future: Transaction history */}
          {/*
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Payment for Order #{transaction.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">UGX {transaction.amount.toLocaleString()}</p>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
              </div>
            ))}
          </div>
          */}
        </CardContent>
      </Card>
    </div>
  )
}