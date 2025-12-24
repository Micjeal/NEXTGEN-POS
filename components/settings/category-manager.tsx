"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Database, Plus, Edit, Trash2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Category } from "@/lib/types/database"

interface CategoryManagerProps {
  categories: Category[]
}

export function CategoryManager({ categories: initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const { toast } = useToast()
  const supabase = createClient()

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setEditingCategory(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || "" })
    setEditingCategory(category)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          })
          .eq("id", editingCategory.id)

        if (error) throw error

        setCategories(prev => prev.map(cat =>
          cat.id === editingCategory.id
            ? { ...cat, name: formData.name.trim(), description: formData.description.trim() || null }
            : cat
        ))

        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      } else {
        // Add new category
        const { data, error } = await supabase
          .from("categories")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          })
          .select()
          .single()

        if (error) throw error

        setCategories(prev => [...prev, data])

        toast({
          title: "Success",
          description: "Category added successfully",
        })
      }

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Category operation failed:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to save category",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error

      setCategories(prev => prev.filter(cat => cat.id !== categoryId))

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (error: any) {
      console.error('Delete category failed:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Product Categories
            </CardTitle>
            <CardDescription>Manage product categories in the system</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{cat.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {cat.description || "No description"}
                  </p>
                </div>
                <div className="flex gap-2 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{cat.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cat.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update category information" : "Create a new product category"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? "Update" : "Create"} Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}