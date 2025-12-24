"use client"

import type React from "react"

import { useState } from "react"
import type { PaymentMethod } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Banknote, Smartphone, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { cn } from "@/lib/utils"

interface PaymentPanelProps {
  totals: {
    subtotal: number
    taxAmount: number
    discountAmount: number
    total: number
  }
  paymentMethods: PaymentMethod[]
  onProcessPayment: (paymentMethodId: string, amount: number) => void
  isProcessing: boolean
  disabled: boolean
}

const paymentIcons: Record<string, React.ReactNode> = {
  Cash: <Banknote className="h-5 w-5" />,
  Card: <CreditCard className="h-5 w-5" />,
  "Mobile Payment": <Smartphone className="h-5 w-5" />,
  "Store Credit": <Wallet className="h-5 w-5" />,
}

export function PaymentPanel({ totals, paymentMethods, onProcessPayment, isProcessing, disabled }: PaymentPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [amountReceived, setAmountReceived] = useState("")

  const receivedValue = Number.parseFloat(amountReceived) || 0
  const change = receivedValue - totals.total

  const quickAmounts = [10, 20, 50, 100]

  const handlePayment = () => {
    if (!selectedMethod) return
    onProcessPayment(selectedMethod, receivedValue || totals.total)
    setSelectedMethod(null)
    setAmountReceived("")
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                variant={selectedMethod === method.id ? "default" : "outline"}
                className={cn("h-auto flex-col gap-2 py-4", selectedMethod === method.id && "ring-2 ring-primary")}
                onClick={() => setSelectedMethod(method.id)}
                disabled={disabled}
              >
                {paymentIcons[method.name] || <Wallet className="h-5 w-5" />}
                <span className="text-sm">{method.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {selectedMethod && (
          <>
            <div className="space-y-3">
              <Label>Amount Received</Label>
              <Input
                type="number"
                placeholder={formatCurrency(totals.total)}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="text-lg"
                min={0}
                step="0.01"
              />
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button key={amount} variant="outline" size="sm" onClick={() => setAmountReceived(amount.toString())}>
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {receivedValue >= totals.total && receivedValue > 0 && (
              <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(change)}</p>
              </div>
            )}
          </>
        )}

        <div className="mt-auto space-y-3">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Due</span>
              <span className="text-primary">{formatCurrency(totals.total)}</span>
            </div>
          </div>
          <Button
            className="w-full h-12 text-lg"
            onClick={handlePayment}
            disabled={
              disabled || !selectedMethod || isProcessing || (receivedValue > 0 && receivedValue < totals.total)
            }
          >
            {isProcessing ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
