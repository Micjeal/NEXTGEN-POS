"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Edit, Trash2, Save, X, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { MessageTemplate } from "@/lib/types/database"

export function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    category: "",
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      // TEMPORARY WORKAROUND: Show sample templates
      console.log('TEMPORARY WORKAROUND: Loading sample message templates...')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sample message templates
      const sampleTemplates = [
        {
          id: '1',
          name: 'Shift Handover',
          subject: 'Shift Handover Notes - [Date]',
          content: 'Dear team member,\n\nI am handing over my shift. Here are the key points:\n\n- Current stock levels: [Add details]\n- Any issues encountered: [Add details]\n- Special notes: [Add details]\n\nPlease review and continue with the operations.\n\nBest regards,\n[Your Name]',
          category: 'operations',
          created_by: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Low Stock Alert',
          subject: 'URGENT: Low Stock Alert - [Product Name]',
          content: 'Attention Team,\n\nThe following items are running low on stock:\n\n[Item Name] - Current stock: [Quantity]\n\nPlease restock immediately to avoid stockouts.\n\nThis is an automated alert from the inventory system.',
          category: 'inventory',
          created_by: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'New User Welcome',
          subject: 'Welcome to SMMS POS - [User Name]',
          content: 'Welcome to the Supermarket Management System!\n\nYour account has been created with the following details:\n- Username: [Username]\n- Role: [Role]\n- Access Level: [Access Level]\n\nPlease change your password upon first login and familiarize yourself with the system.\n\nIf you have any questions, please contact your administrator.\n\nBest regards,\nSMMS POS Team',
          category: 'announcements',
          created_by: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Weekly Sales Update',
          subject: 'Weekly Sales Performance Update',
          content: 'Hello Team,\n\nHere is your weekly sales performance update:\n\nCurrent Sales: $[Current Amount]\nTarget: $[Target Amount]\nProgress: [Percentage]%\n\n[Motivational message or additional notes]\n\nKeep up the great work!\n\nBest regards,\nManagement',
          category: 'operations',
          created_by: 'manager',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'System Maintenance',
          subject: 'Scheduled System Maintenance Notice',
          content: 'Dear Team,\n\nWe will be performing scheduled maintenance on the SMMS POS system.\n\nMaintenance Window: [Date/Time]\nExpected Duration: [Duration]\nImpact: System will be unavailable during this period\n\nPlease complete all transactions before the maintenance window.\n\nThank you for your understanding.\n\nBest regards,\nIT Team',
          category: 'announcements',
          created_by: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Inventory Count',
          subject: 'Monthly Inventory Count Required',
          content: 'Dear Team,\n\nIt is time for our monthly inventory count.\n\nCount Schedule:\n- Date: [Date]\n- Time: [Time]\n- Areas to count: [List areas]\n\nPlease ensure all counting is accurate and complete.\n\nInstructions:\n1. Count all items in your assigned area\n2. Record counts in the system\n3. Report any discrepancies immediately\n\nThank you for your attention to detail.\n\nBest regards,\nInventory Manager',
          category: 'inventory',
          created_by: 'manager',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]

      setTemplates(sampleTemplates)
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to load message templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", subject: "", content: "", category: "" })
    setEditingTemplate(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (template: MessageTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
    })
    setEditingTemplate(template)
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // TEMPORARY WORKAROUND: Simulate template creation/update
      console.log('TEMPORARY WORKAROUND: Simulating template save...')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const templateData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        category: formData.category,
        created_by: 'current_user',
        is_active: true,
        created_at: new Date().toISOString()
      }

      if (editingTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t =>
          t.id === editingTemplate.id ? { ...t, ...templateData } : t
        ))

        toast({
          title: "Success",
          description: "Template updated successfully (demo mode)",
        })
      } else {
        // Create new template
        const newTemplate = {
          ...templateData,
          id: Date.now().toString()
        }

        setTemplates(prev => [...prev, newTemplate])

        toast({
          title: "Success",
          description: "Template created successfully (demo mode)",
        })
      }

      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Template operation failed:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to save template",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (templateId: string) => {
    try {
      // TEMPORARY WORKAROUND: Simulate template deletion
      console.log('TEMPORARY WORKAROUND: Simulating template deletion...')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setTemplates(prev => prev.filter(t => t.id !== templateId))

      toast({
        title: "Success",
        description: "Template deleted successfully (demo mode)",
      })
    } catch (error: any) {
      console.error('Delete template failed:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const useTemplate = (template: MessageTemplate) => {
    // This would open the composer with the template data
    toast({
      title: "Template Selected",
      description: `Using template: ${template.name}`,
    })
  }

  const categories = [...new Set(templates.map(t => t.category))]

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Message Templates
            </CardTitle>
            <CardDescription>Pre-defined message templates for common communications</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet</p>
              <p className="text-sm">Create templates for common messages</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-semibold capitalize">{category}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates
                      .filter(t => t.category === category)
                      .map((template) => (
                        <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {template.subject}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {template.content}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => useTemplate(template)}
                              className="flex-1"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Use
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(template.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Message Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update the message template" : "Create a reusable message template"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Shift Handover"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="announcements">Announcements</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Message subject"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Template message content..."
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}