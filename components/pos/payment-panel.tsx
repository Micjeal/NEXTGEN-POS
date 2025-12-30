"use client"

import React, { useState } from "react"
import type { PaymentMethod } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Banknote, Smartphone, Wallet, Star, Gift } from "lucide-react"
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
   currency: string
   selectedCustomer?: {
     id: string
     full_name: string
     phone: string | null
     membership_tier: string
   } | null
   loyaltyPoints?: number
   onPointsRedeemed?: (points: number, discount: number) => void
 }

const paymentIcons: Record<string, React.ReactNode> = {
  Cash: <Banknote className="h-5 w-5" />,
  Card: <CreditCard className="h-5 w-5" />,
  "Mobile Payment": <Smartphone className="h-5 w-5" />,
  "Store Credit": <Wallet className="h-5 w-5" />,
}

export function PaymentPanel({
  totals,
  paymentMethods,
  onProcessPayment,
  isProcessing,
  disabled,
  currency,
  selectedCustomer,
  loyaltyPoints = 0,
  onPointsRedeemed
}: PaymentPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [amountReceived, setAmountReceived] = useState("")
  const [pointsToRedeem, setPointsToRedeem] = useState("")
  const [redemptionValue, setRedemptionValue] = useState(0)

  const receivedValue = Number.parseFloat(amountReceived) || 0
  const change = receivedValue - totals.total
  const pointsValue = Number.parseInt(pointsToRedeem) || 0

  const quickAmounts = [10, 20, 50, 100]

  // Calculate redemption value (assuming 1 point = 0.01 currency unit)
  const calculateRedemptionValue = (points: number) => {
    return points * 0.01
  }

  // Update redemption value when points change
  React.useEffect(() => {
    const value = calculateRedemptionValue(pointsValue)
    setRedemptionValue(value)
  }, [pointsValue])

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

        {/* Loyalty Points Redemption */}
        {selectedCustomer && loyaltyPoints > 0 && selectedCustomer.phone && (
          <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <Label className="text-purple-700 dark:text-purple-300 font-semibold">
                Loyalty Points - {selectedCustomer.full_name}
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Available Points</p>
                <p className="text-2xl font-bold text-purple-600">{loyaltyPoints.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Membership Tier</p>
                <p className="text-lg font-semibold capitalize text-purple-600">{selectedCustomer.membership_tier}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Points to Redeem</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter points"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  className="text-lg"
                  min={0}
                  max={loyaltyPoints}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsToRedeem(loyaltyPoints.toString())}
                  disabled={loyaltyPoints === 0}
                >
                  Max
                </Button>
              </div>
              {redemptionValue > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Redemption value: {formatCurrency(redemptionValue, currency)}
                </p>
              )}
            </div>

            {pointsValue > 0 && (
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => {
                  if (onPointsRedeemed) {
                    onPointsRedeemed(pointsValue, redemptionValue)
                    setPointsToRedeem("")
                    setRedemptionValue(0)
                  }
                }}
                disabled={pointsValue > loyaltyPoints}
              >
                <Gift className="h-4 w-4" />
                Redeem {pointsValue} Points ({formatCurrency(redemptionValue, currency)})
              </Button>
            )}
          </div>
        )}

        {selectedMethod && (
          <>
            <div className="space-y-3">
              <Label>Amount Received</Label>
              <Input
                type="number"
                placeholder={formatCurrency(totals.total, currency)}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="text-lg"
                min={0}
                step="0.01"
              />
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button key={amount} variant="outline" size="sm" onClick={() => setAmountReceived(amount.toString())}>
                    {currency} {amount}
                  </Button>
                ))}
              </div>
            </div>

            {receivedValue >= totals.total && receivedValue > 0 && (
              <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(change, currency)}</p>
              </div>
            )}
          </>
        )}

        <div className="mt-auto space-y-3">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Due</span>
              <span className="text-primary">{formatCurrency(totals.total, currency)}</span>
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
