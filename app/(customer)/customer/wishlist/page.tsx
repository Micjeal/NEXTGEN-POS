"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Heart, ShoppingBag, Star, Trash2, Plus, Loader2, AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface WishlistItem {
  id: string
  added_at: string
  products: {
    id: string
    name: string
    description: string
    price: number
    image_url?: string
    stock_quantity: number
    is_active: boolean
  }
}

export default function CustomerWishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      const response = await fetch('/api/customer/wishlist')
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/customer-login")
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load wishlist')
      }

      const data = await response.json()
      setWishlistItems(data.wishlist || [])
    } catch (error) {
      console.error('Error loading wishlist:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load wishlist",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    setIsRemoving(productId)
    try {
      const response = await fetch(`/api/customer/wishlist/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist')
      }

      // Update local state
      setWishlistItems(prev => prev.filter(item => item.products.id !== productId))

      toast({
        title: "Success",
        description: "Item removed from wishlist",
      })
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive"
      })
    } finally {
      setIsRemoving(null)
    }
  }

  const addToCart = (product: WishlistItem['products']) => {
    // TODO: Implement add to cart functionality when cart system is available
    toast({
      title: "Coming Soon",
      description: "Cart functionality will be available soon",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wishlist</h1>
          <p className="text-muted-foreground">Save items for later and never miss a great deal</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {wishlistItems.length} items
          </Badge>
          <Button onClick={() => router.push('/')}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start browsing our products and add items you love to your wishlist.
            </p>
            <Button onClick={() => router.push('/')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 relative overflow-hidden">
                  {item.products.image_url ? (
                    <Image
                      src={item.products.image_url}
                      alt={item.products.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFromWishlist(item.products.id)}
                      disabled={isRemoving === item.products.id}
                    >
                      {isRemoving === item.products.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{item.products.name}</h3>
                  {item.products.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.products.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      UGX {item.products.price.toLocaleString()}
                    </span>
                    <Badge variant={item.products.stock_quantity > 0 ? "secondary" : "destructive"}>
                      {item.products.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Added {new Date(item.added_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => addToCart(item.products)}
                    disabled={item.products.stock_quantity === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFromWishlist(item.products.id)}
                    disabled={isRemoving === item.products.id}
                  >
                    {isRemoving === item.products.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wishlist Stats */}
      {wishlistItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Wishlist Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{wishlistItems.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {wishlistItems.filter(item => item.products.stock_quantity > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">In Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  UGX {wishlistItems.reduce((sum, item) => sum + item.products.price, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}