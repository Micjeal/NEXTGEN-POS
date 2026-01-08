"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ProductBatch } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeleteBatchDialogProps {
  batch: ProductBatch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBatchDialog({ batch, open, onOpenChange }: DeleteBatchDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!batch) return

    setLoading(true)

    try {
      const response = await fetch(`/api/product-batches/${batch.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete batch')
      }

      toast({
        title: "Success",
        description: "Product batch deleted successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete batch",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!batch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Product Batch
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete batch "{batch.batch_number}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will permanently remove the batch and all associated data.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}