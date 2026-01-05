"use client"

import type React from "react"

import { useState } from "react"
import type { Product } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AdjustInventoryDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdjustInventoryDialog({ product, open, onOpenChange }: AdjustInventoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<string>("add")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const currentStock = product?.inventory?.quantity || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      const qtyValue = Number.parseInt(quantity)
      let newQuantity: number
      let quantityChange: number

      switch (adjustmentType) {
        case "add":
        case "purchase":
        case "return":
          newQuantity = currentStock + qtyValue
          quantityChange = qtyValue
          break
        case "remove":
        case "sale":
          newQuantity = Math.max(0, currentStock - qtyValue)
          quantityChange = -Math.min(qtyValue, currentStock)
          break
        case "set":
        case "manual":
        case "adjustment":
          newQuantity = qtyValue
          quantityChange = qtyValue - currentStock
          break
        default:
          throw new Error("Invalid adjustment type")
      }

      // Call the inventory adjust API
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          adjustment_type: adjustmentType,
          quantity_change: qtyValue,
          reason: reason || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to adjust inventory: ${response.status}`)
      }

      toast({
        title: "Inventory Adjusted",
        description: `${product.name} stock updated to ${newQuantity} units`,
      })

      onOpenChange(false)
      setQuantity("")
      setReason("")
      setAdjustmentType("add")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to adjust inventory",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Adjust Inventory
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1">
                Update stock levels for {product?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 border border-emerald-200 dark:border-emerald-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Current Stock Level</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Live</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-emerald-900 dark:text-emerald-100">{currentStock}</span>
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">units</span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">Min:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-200">{product?.inventory?.min_stock_level || 10}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">Max:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-200">{product?.inventory?.max_stock_level || 1000}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Adjustment Type
                </Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(value: string) => setAdjustmentType(value)}
                >
                  <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-600 shadow-lg">
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Add Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="remove">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Remove Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Set Stock Level
                      </div>
                    </SelectItem>
                    <SelectItem value="sale">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        Sale
                      </div>
                    </SelectItem>
                    <SelectItem value="return">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        Return
                      </div>
                    </SelectItem>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500" />
                        Manual Adjustment
                      </div>
                    </SelectItem>
                    <SelectItem value="purchase">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        Purchase
                      </div>
                    </SelectItem>
                    <SelectItem value="adjustment">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        General Adjustment
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {["set", "manual", "adjustment"].includes(adjustmentType) ? "New Stock Level" : "Quantity"}
                </Label>
                <div className="relative">
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 pr-12"
                    placeholder={
                      ["set", "manual", "adjustment"].includes(adjustmentType) 
                        ? "Enter new stock level" 
                        : "Enter quantity"
                    }
                  />
                  {quantity && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className={`w-2 h-2 rounded-full ${
                        Number.parseInt(quantity) > 0 ? 'bg-green-500' : 'bg-slate-400'
                      }`} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reason <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Received shipment, Damaged goods, Inventory count, Customer return..."
                  className="border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-600">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !quantity}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Adjustment
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
