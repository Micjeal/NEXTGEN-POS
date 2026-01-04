"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  const handleDelete = async () => {
    if (!order) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchase-orders?id=${order.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        let errorMessage = `Failed to delete purchase order: ${response.status}`
        try {
          const errorText = await response.text()
          const errorData = JSON.parse(errorText)
          if (response.status === 404) {
            errorMessage = "This purchase order may have been deleted. Please refresh the page and try again."
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch (parseError) {
          // If response is not JSON, use the raw text
          errorMessage = `Failed to delete purchase order: ${response.status}`
        }

        setError(errorMessage)
        return
      }

      toast({
        title: "Purchase Order Deleted",
        description: `${order.order_number} has been removed`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      setError(error instanceof Error ? error.message : "Failed to delete purchase order")
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

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-sm text-destructive font-medium">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

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