"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { QualityInspection } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeleteInspectionDialogProps {
  inspection: QualityInspection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteInspectionDialog({ inspection, open, onOpenChange }: DeleteInspectionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!inspection) return

    setLoading(true)

    try {
      const response = await fetch(`/api/quality-inspections/${inspection.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete inspection')
      }

      toast({
        title: "Success",
        description: "Quality inspection deleted successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting inspection:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete inspection",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!inspection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Quality Inspection
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this quality inspection? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will permanently remove the inspection record.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}