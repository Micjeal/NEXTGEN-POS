"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Scan, Trash2, Plus, User, DollarSign, CreditCard, Smartphone } from "lucide-react"

interface POSPanelProps {
  cartValue?: number
  items?: number
  tax?: number
  total?: number
  customer?: string
  onScannerClick?: () => void
  onClearCartClick?: () => void
  onAddItemClick?: () => void
  onCustomerClick?: () => void
  onCompleteTransaction?: () => void
  isProcessing?: boolean
  disabled?: boolean
}

export function POSPanel({
  cartValue = 0,
  items = 0,
  tax = 0,
  total = 0,
  customer = "Walk-in",
  onScannerClick,
  onClearCartClick,
  onAddItemClick,
  onCustomerClick,
  onCompleteTransaction,
  isProcessing = false,
  disabled = false
}: POSPanelProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash")

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onScannerClick}
              className="h-10 gap-2"
            >
              <Scan className="h-4 w-4" />
              Scanner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCartClick}
              disabled={disabled}
              className="h-10 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddItemClick}
              className="h-10 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCustomerClick}
              className="h-10 gap-2"
            >
              <User className="h-4 w-4" />
              Customer
            </Button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Payment Methods</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={selectedPaymentMethod === "cash"}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="sr-only"
              />
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">Cash</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={selectedPaymentMethod === "card"}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="sr-only"
              />
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">Card</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
              <input
                type="radio"
                name="payment"
                value="mobile"
                checked={selectedPaymentMethod === "mobile"}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="sr-only"
              />
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">Mobile Payment</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
              <input
                type="radio"
                name="payment"
                value="credit"
                checked={selectedPaymentMethod === "credit"}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="sr-only"
              />
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift h-4 w-4 text-orange-600 dark:text-orange-400">
                  <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                  <path d="M12 8v13"></path>
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">Store Credit</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
              </div>
            </label>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Transaction Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Cart Value</span>
              <span className="font-medium">UGX {cartValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Items</span>
              <span className="font-medium">{items}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Customer</span>
              <span className="font-medium">{customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Tax</span>
              <span className="font-medium">UGX {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total</span>
              <span className="font-bold text-lg">UGX {total.toLocaleString()}</span>
            </div>
          </div>
          <Button
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            onClick={onCompleteTransaction}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? "Processing..." : "Complete Transaction"}
          </Button>
        </div>
      </div>
    </div>
  )
}