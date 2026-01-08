"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Product, ProductBatch } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddInspectionDialogProps {
  product: Product
  batches: ProductBatch[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddInspectionDialog({ product, batches, open, onOpenChange }: AddInspectionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    batch_id: "",
    inspection_type: "incoming",
    inspector_id: "",
    inspection_date: new Date().toISOString().split('T')[0],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/quality-inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          product_id: product.id,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          humidity: formData.humidity ? parseFloat(formData.humidity) : null,
          batch_id: formData.batch_id || null,
          inspector_id: formData.inspector_id || null,
          overall_rating: formData.overall_rating || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create inspection')
      }

      toast({
        title: "Success",
        description: "Quality inspection created successfully",
      })

      onOpenChange(false)
      setFormData({
        batch_id: "",
        inspection_type: "incoming",
        inspector_id: "",
        inspection_date: new Date().toISOString().split('T')[0],
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

      router.refresh()
    } catch (error) {
      console.error('Error creating inspection:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create inspection",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
          <CheckCircle className="mr-2 h-4 w-4" />
          Add Inspection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Add Quality Inspection
          </DialogTitle>
          <DialogDescription>
            Perform a quality inspection for {product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_id">Batch</Label>
              <Select value={formData.batch_id} onValueChange={(value) => setFormData(prev => ({ ...prev, batch_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection_type">Inspection Type *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspection_date">Inspection Date *</Label>
              <Input
                id="inspection_date"
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector_id">Inspector</Label>
              <Input
                id="inspector_id"
                value={formData.inspector_id}
                onChange={(e) => setFormData(prev => ({ ...prev, inspector_id: e.target.value }))}
                placeholder="Inspector ID or name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="e.g., 25.5"
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
                placeholder="e.g., 65.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visual_inspection">Visual Inspection</Label>
            <Textarea
              id="visual_inspection"
              value={formData.visual_inspection}
              onChange={(e) => setFormData(prev => ({ ...prev, visual_inspection: e.target.value }))}
              placeholder="Describe visual appearance, packaging condition, etc."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="microbiological_test">Microbiological Test</Label>
              <Textarea
                id="microbiological_test"
                value={formData.microbiological_test}
                onChange={(e) => setFormData(prev => ({ ...prev, microbiological_test: e.target.value }))}
                placeholder="Test results and observations"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chemical_test">Chemical Test</Label>
              <Textarea
                id="chemical_test"
                value={formData.chemical_test}
                onChange={(e) => setFormData(prev => ({ ...prev, chemical_test: e.target.value }))}
                placeholder="Test results and observations"
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2 flex items-center space-x-2 pt-8">
              <Checkbox
                id="requires_followup"
                checked={formData.requires_followup}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_followup: !!checked }))}
              />
              <Label htmlFor="requires_followup">Requires Follow-up</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Additional comments or observations"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corrective_actions">Corrective Actions</Label>
            <Textarea
              id="corrective_actions"
              value={formData.corrective_actions}
              onChange={(e) => setFormData(prev => ({ ...prev, corrective_actions: e.target.value }))}
              placeholder="Any corrective actions taken or recommended"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Inspection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}