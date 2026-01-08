"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { QualityInspection } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EditInspectionDialogProps {
  inspection: QualityInspection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditInspectionDialog({ inspection, open, onOpenChange }: EditInspectionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    inspection_type: "",
    inspection_date: "",
    temperature: "",
    humidity: "",
    visual_inspection: "",
    microbiological_test: "",
    chemical_test: "",
    overall_rating: "",
    comments: "",
    corrective_actions: "",
    requires_followup: false
  })

  useEffect(() => {
    if (inspection) {
      setFormData({
        inspection_type: inspection.inspection_type,
        inspection_date: inspection.inspection_date,
        temperature: inspection.temperature?.toString() || "",
        humidity: inspection.humidity?.toString() || "",
        visual_inspection: inspection.visual_inspection || "",
        microbiological_test: inspection.microbiological_test || "",
        chemical_test: inspection.chemical_test || "",
        overall_rating: inspection.overall_rating || "",
        comments: inspection.comments || "",
        corrective_actions: inspection.corrective_actions || "",
        requires_followup: inspection.requires_followup
      })
    }
  }, [inspection])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspection) return

    setLoading(true)

    try {
      const response = await fetch(`/api/quality-inspections/${inspection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspection_type: formData.inspection_type,
          inspection_date: formData.inspection_date,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          humidity: formData.humidity ? parseFloat(formData.humidity) : null,
          visual_inspection: formData.visual_inspection,
          microbiological_test: formData.microbiological_test,
          chemical_test: formData.chemical_test,
          overall_rating: formData.overall_rating || null,
          comments: formData.comments,
          corrective_actions: formData.corrective_actions,
          requires_followup: formData.requires_followup
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update inspection')
      }

      toast({
        title: "Success",
        description: "Quality inspection updated successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating inspection:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update inspection",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!inspection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Quality Inspection
          </DialogTitle>
          <DialogDescription>
            Update inspection details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Similar form fields as add dialog */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspection_type">Inspection Type</Label>
              <Select value={formData.inspection_type} onValueChange={(value) => setFormData(prev => ({ ...prev, inspection_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="in_process">In Process</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="recall_check">Recall Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection_date">Inspection Date</Label>
              <Input
                id="inspection_date"
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Add other fields similar to add dialog */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.humidity}
                onChange={(e) => setFormData(prev => ({ ...prev, humidity: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall_rating">Overall Rating</Label>
            <Select value={formData.overall_rating} onValueChange={(value) => setFormData(prev => ({ ...prev, overall_rating: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="acceptable">Acceptable</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex items-center space-x-2">
            <Checkbox
              id="requires_followup"
              checked={formData.requires_followup}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_followup: !!checked }))}
            />
            <Label htmlFor="requires_followup">Requires Follow-up</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Inspection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}