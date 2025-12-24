"use client"

import { useState } from "react"
import type { Supplier } from "@/lib/types/database"
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

interface DeleteSupplierDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSupplierDialog({ supplier, open, onOpenChange }: DeleteSupplierDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!supplier) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/suppliers?id=${supplier.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete supplier: ${response.status}`)
      }

      toast({
        title: "Supplier Deleted",
        description: `${supplier.name} and all associated records have been permanently removed`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete supplier",
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
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{supplier?.name}"? This action cannot be undone and will also
            permanently delete all associated purchase orders, order items, and supplier products.
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