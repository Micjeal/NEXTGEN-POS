"use client"

import type { CartItem } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"

interface CartDisplayProps {
  items: CartItem[]
  totals: {
    subtotal: number
    taxAmount: number
    discountAmount: number
    total: number
  }
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
}

export function CartDisplay({ items, totals, onUpdateQuantity, onRemoveItem, onClearCart }: CartDisplayProps) {
  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Cart ({items.length} items)
        </CardTitle>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearCart}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <p>Cart is empty. Scan or select products.</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.product.price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.product.id, Number.parseInt(e.target.value) || 0)}
                        className="h-8 w-14 text-center"
                        min={1}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="w-20 text-right font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onRemoveItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(totals.taxAmount)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
