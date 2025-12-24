"use client"

import type { CartItem, Customer } from "@/lib/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, Download, X, Star } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  items: CartItem[]
  totals: {
    subtotal: number
    taxAmount: number
    discountAmount: number
    total: number
  }
  paymentMethod: string
  customer?: Customer
  pointsEarned?: number
}

export function InvoiceModal({ open, onOpenChange, invoiceNumber, items, totals, paymentMethod, customer, pointsEarned }: InvoiceModalProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 print:text-black" id="invoice-content">
          <div className="text-center">
            <h2 className="text-xl font-bold">SMMS Supermarket</h2>
            <p className="text-sm text-muted-foreground">123 Main Street, City</p>
            <p className="text-sm text-muted-foreground">Tel: (555) 123-4567</p>
          </div>

          <Separator />

          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice #:</span>
              <span className="font-mono">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span>{paymentMethod}</span>
            </div>
            {customer && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{customer.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{customer.phone}</span>
                </div>
              </>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            {items.map((item) => (
              <div key={item.product.id} className="grid grid-cols-12 text-sm">
                <span className="col-span-6 truncate">{item.product.name}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-2 text-right">{formatCurrency(item.product.price)}</span>
                <span className="col-span-2 text-right">{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <Separator />

          {pointsEarned && pointsEarned > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold">Loyalty Points Earned: {pointsEarned}</span>
              </div>
              <p className="text-xs text-center text-yellow-700 dark:text-yellow-300 mt-1">
                Thank you for being a valued customer!
              </p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for shopping with us!</p>
            <p>Please keep this receipt for your records.</p>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            <Download className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
