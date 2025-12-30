import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart, ShoppingBag, Star, Trash2, Plus
} from "lucide-react"
import { redirect } from "next/navigation"

export default async function CustomerWishlistPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/customer-login")
  }

  // For now, show empty state since we don't have wishlist functionality implemented
  // In a real implementation, you'd fetch wishlist items from a wishlist table

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Wishlist</h1>
        <p className="text-muted-foreground">Save items for later and never miss a great deal</p>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-6">
            Start browsing our products and add items you love to your wishlist.
          </p>
          <Button>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
        </CardContent>
      </Card>

      {/* Future: Wishlist items grid */}
      {/*
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4"></div>
              <h3 className="font-semibold mb-2">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">UGX {item.price}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      */}
    </div>
  )
}