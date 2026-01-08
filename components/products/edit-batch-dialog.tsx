"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ProductBatch } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EditBatchDialogProps {
  batch: ProductBatch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBatchDialog({ batch, open, onOpenChange }: EditBatchDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    batch_number: "",
    current_quantity: "",
    unit_cost: "",
    storage_location: "",
    quality_status: "",
    quality_notes: "",
    is_active: true
  })

  useEffect(() => {
    if (batch) {
      setFormData({
        batch_number: batch.batch_number,
        current_quantity: batch.current_quantity.toString(),
        unit_cost: batch.unit_cost?.toString() || "",
        storage_location: batch.storage_location || "",
        quality_status: batch.quality_status,
        quality_notes: batch.quality_notes || "",
        is_active: batch.is_active
      })
    }
  }, [batch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batch) return

    setLoading(true)

    try {
      const response = await fetch(`/api/product-batches/${batch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_number: formData.batch_number,
          current_quantity: parseInt(formData.current_quantity),
          unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
          storage_location: formData.storage_location,
          quality_status: formData.quality_status,
          quality_notes: formData.quality_notes,
          is_active: formData.is_active
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update batch')
      }

      toast({
        title: "Success",
        description: "Product batch updated successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating batch:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update batch",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!batch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Product Batch
          </DialogTitle>
          <DialogDescription>
            Update batch {batch.batch_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch_number">Batch Number</Label>
            <Input
              id="batch_number"
              value={formData.batch_number}
              onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_quantity">Current Quantity</Label>
              <Input
                id="current_quantity"
                type="number"
                min="0"
                value={formData.current_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, current_quantity: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_location">Storage Location</Label>
            <Input
              id="storage_location"
              value={formData.storage_location}
              onChange={(e) => setFormData(prev => ({ ...prev, storage_location: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality_status">Quality Status</Label>
            <Select value={formData.quality_status} onValueChange={(value) => setFormData(prev => ({ ...prev, quality_status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="quarantined">Quarantined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality_notes">Quality Notes</Label>
            <Textarea
              id="quality_notes"
              value={formData.quality_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, quality_notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}