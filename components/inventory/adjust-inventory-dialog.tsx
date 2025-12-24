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
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove" | "set">("add")
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
          newQuantity = currentStock + qtyValue
          quantityChange = qtyValue
          break
        case "remove":
          newQuantity = Math.max(0, currentStock - qtyValue)
          quantityChange = -Math.min(qtyValue, currentStock)
          break
        case "set":
          newQuantity = qtyValue
          quantityChange = qtyValue - currentStock
          break
        default:
          throw new Error("Invalid adjustment type")
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: newQuantity })
        .eq("product_id", product.id)

      if (updateError) throw updateError

      // Log adjustment
      const { error: logError } = await supabase.from("inventory_adjustments").insert({
        product_id: product.id,
        user_id: user.id,
        adjustment_type: adjustmentType,
        quantity_change: quantityChange,
        quantity_before: currentStock,
        quantity_after: newQuantity,
        reason: reason || null,
      })

      if (logError) throw logError

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>Update stock levels for {product?.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-3xl font-bold">{currentStock}</p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Adjustment Type</Label>
              <Select
                value={adjustmentType}
                onValueChange={(value: "add" | "remove" | "set") => setAdjustmentType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">{adjustmentType === "set" ? "New Stock Level" : "Quantity"}</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Received shipment, Damaged goods, Inventory count..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !quantity}>
              {isLoading ? "Saving..." : "Save Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
