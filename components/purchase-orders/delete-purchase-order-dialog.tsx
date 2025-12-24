"use client"

import { useState } from "react"
import type { PurchaseOrder } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface DeletePurchaseOrderDialogProps {
  order: PurchaseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePurchaseOrderDialog({ order, open, onOpenChange }: DeletePurchaseOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!order) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/purchase-orders?id=${order.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete purchase order: ${response.status}`)
      }

      toast({
        title: "Purchase Order Deleted",
        description: `${order.order_number} has been removed`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete purchase order",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete purchase order "{order?.order_number}"? This action cannot be undone and will also
            remove all associated order items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}