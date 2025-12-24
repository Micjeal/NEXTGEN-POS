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
import { FileText, Plus, Edit, Trash2, Save, X, Mail, Eye, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { EmailTemplate } from "@/lib/types/database"

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false)
  const [selectedTemplateForTest, setSelectedTemplateForTest] = useState<EmailTemplate | null>(null)
  const [testEmailData, setTestEmailData] = useState({
    recipientEmail: "",
    recipientName: "",
    variables: {} as Record<string, string>
  })
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    html_content: "",
    text_content: "",
    category: "",
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      // For demo purposes, show sample templates
      console.log('Loading sample email templates...')

      await new Promise(resolve => setTimeout(resolve, 1000))

      const sampleTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Low Stock Alert',
          subject: 'URGENT: Low Stock Alert - {{product_name}}',
          html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Low Stock Alert</title></head><body><h2>⚠️ Low Stock Alert</h2><p>Product: {{product_name}}</p><p>Current Stock: {{current_stock}}</p></body></html>',
          text_content: 'Low Stock Alert - {{product_name}}\nCurrent Stock: {{current_stock}}',
          category: 'alerts',
          variables: { product_name: 'Product Name', current_stock: 'Current Stock' },
          is_active: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Daily Sales Summary',
          subject: 'Daily Sales Summary - {{date}}',
          html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Daily Sales Summary</title></head><body><h2>📊 Daily Sales Summary - {{date}}</h2><p>Total Sales: UGX {{total_sales}}</p></body></html>',
          text_content: 'Daily Sales Summary - {{date}}\nTotal Sales: UGX {{total_sales}}',
          category: 'reports',
          variables: { date: 'Date', total_sales: 'Total Sales' },
          is_active: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Customer Welcome',
          subject: 'Welcome to {{store_name}} - {{customer_name}}!',
          html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title></head><body><h2>Welcome to {{store_name}}!</h2><p>Dear {{customer_name}},</p><p>Welcome to our store!</p></body></html>',
          text_content: 'Welcome to {{store_name}} - {{customer_name}}!',
          category: 'welcome',
          variables: { store_name: 'Store Name', customer_name: 'Customer Name' },
          is_active: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Birthday Greeting',
          subject: 'Happy Birthday from {{store_name}} - {{customer_name}}!',
          html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Happy Birthday!</title></head><body><h2>🎂 Happy Birthday, {{customer_name}}!</h2><p>Enjoy {{birthday_discount}}% off your next purchase!</p></body></html>',
          text_content: 'Happy Birthday, {{customer_name}}! Enjoy {{birthday_discount}}% off your next purchase!',
          category: 'marketing',
          variables: { store_name: 'Store Name', customer_name: 'Customer Name', birthday_discount: 'Discount Percentage' },
          is_active: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setTemplates(sampleTemplates)
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", subject: "", html_content: "", text_content: "", category: "" })
    setEditingTemplate(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || "",
      category: template.category,
    })
    setEditingTemplate(template)
    setIsCreateDialogOpen(true)
  }

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template)
  }

  const handleTestEmail = (template: EmailTemplate) => {
    setSelectedTemplateForTest(template)
    setTestEmailData({
      recipientEmail: "",
      recipientName: "",
      variables: {}
    })
    setTestEmailDialogOpen(true)
  }

  const handleSendTestEmail = async () => {
    if (!selectedTemplateForTest || !testEmailData.recipientEmail) return

    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplateForTest.id,
          recipientEmail: testEmailData.recipientEmail,
          recipientName: testEmailData.recipientName || undefined,
          variables: testEmailData.variables
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Test email sent successfully!",
        })
        setTestEmailDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const templateData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        html_content: formData.html_content.trim(),
        text_content: formData.text_content.trim() || undefined,
        category: formData.category as EmailTemplate['category'],
        variables: {}, // Would be extracted from template content
        created_by: 'current_user',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t =>
          t.id === editingTemplate.id ? { ...t, ...templateData } : t
        ))

        toast({
          title: "Success",
          description: "Email template updated successfully (demo mode)",
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
          description: "Email template created successfully (demo mode)",
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
      setTemplates(prev => prev.filter(t => t.id !== templateId))

      toast({
        title: "Success",
        description: "Email template deleted successfully (demo mode)",
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

  const categories = [...new Set(templates.map(t => t.category))]

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading email templates...</p>
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
              <Mail className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>Manage email templates for automated notifications</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email templates yet</p>
              <p className="text-sm">Create templates for automated emails</p>
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
                            {template.html_content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(template)}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTestEmail(template)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Test
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update the email template" : "Create a reusable email template"}
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
                  placeholder="e.g., Low Stock Alert"
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
                    <SelectItem value="alerts">Alerts</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject with {{variables}}"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="html_content">HTML Content</Label>
              <Textarea
                id="html_content"
                value={formData.html_content}
                onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                placeholder="HTML email content with {{variables}}..."
                rows={12}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_content">Text Content (Optional)</Label>
              <Textarea
                id="text_content"
                value={formData.text_content}
                onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                placeholder="Plain text version for email clients that don't support HTML"
                rows={6}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>HTML email preview</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewTemplate?.html_content || '' }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Test Email: {selectedTemplateForTest?.name}</DialogTitle>
            <DialogDescription>
              Send a test email using this template to verify the email system is working.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="testRecipientEmail">Recipient Email</Label>
                <Input
                  id="testRecipientEmail"
                  type="email"
                  value={testEmailData.recipientEmail}
                  onChange={(e) => setTestEmailData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="test@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testRecipientName">Recipient Name (Optional)</Label>
                <Input
                  id="testRecipientName"
                  value={testEmailData.recipientName}
                  onChange={(e) => setTestEmailData(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
            </div>

            {selectedTemplateForTest?.variables && Object.keys(selectedTemplateForTest.variables).length > 0 && (
              <div className="space-y-2">
                <Label>Template Variables</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(selectedTemplateForTest.variables).map(([key, defaultValue]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`var-${key}`} className="text-sm">{key}</Label>
                      <Input
                        id={`var-${key}`}
                        value={testEmailData.variables[key] || defaultValue || ''}
                        onChange={(e) => setTestEmailData(prev => ({
                          ...prev,
                          variables: { ...prev.variables, [key]: e.target.value }
                        }))}
                        placeholder={defaultValue || `Enter ${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestEmailDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={!testEmailData.recipientEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}