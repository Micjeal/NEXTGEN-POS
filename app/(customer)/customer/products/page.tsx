"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Search, Heart, ShoppingCart, Filter, Grid, List,
  Loader2, AlertCircle, Plus, Minus
} from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  sku?: string
  stock_quantity: number
  categories?: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
}

interface ApiError {
  error?: string;
  message?: string;
  statusCode?: number;
}

interface ProductsResponse {
  products: Product[]
  categories: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    category: string | null
    search: string | null
    sortBy: string
    sortOrder: string
  }
}

export default function CustomerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set())
  const [isAddingToWishlist, setIsAddingToWishlist] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
    loadWishlist()
  }, [currentPage, selectedCategory, sortBy, sortOrder])

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (searchTerm !== getCurrentSearchParam()) {
        setCurrentPage(1)
        loadProducts()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const getCurrentSearchParam = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('search') || ''
  }

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder
      });

      if (selectedCategory) params.set('category', selectedCategory);
      if (searchTerm) params.set('search', searchTerm);

      const apiUrl = `/api/customer/products?${params}`;
      console.log('Fetching products from:', apiUrl);
      
      const response = await fetch(apiUrl);
      const responseText = await response.text();
      
      // Log raw response for debugging
      console.log('Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      });

      if (!response.ok) {
        let errorData: ApiError = {};
        try {
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error('Failed to parse error response:', e, 'Response text:', responseText);
        }
        
        const errorMessage = errorData.error || errorData.message || `Failed to load products (${response.status} ${response.statusText})`;
        
        // Handle specific error cases
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in to continue",
            variant: "destructive"
          });
          return;
        }
        
        if (response.status === 404) {
          setProducts([]);
          setCategories([]);
          setTotalPages(1);
          return;
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data: ProductsResponse;
      try {
        data = JSON.parse(responseText) as ProductsResponse;
      } catch (e) {
        console.error('Failed to parse successful response:', e, 'Response text:', responseText);
        throw new Error('Invalid response format from server');
      }

      // Update state with fallbacks
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadWishlist = async () => {
    try {
      const response = await fetch('/api/customer/wishlist')
      if (response.ok) {
        const data = await response.json()
        const ids = data.wishlist.map((item: any) => {
          if (!item.products) {
            console.error('Item has no products:', item)
            return null
          }
          return item.products.id as string
        }).filter((id: string | null): id is string => id !== null)
        const wishlistIds = new Set<string>(ids)
        setWishlistItems(wishlistIds)
      }
    } catch (error) {
      // Wishlist might not be available yet, that's okay
      console.log('Wishlist not available yet')
    }
  }

  const toggleWishlist = async (productId: string) => {
    const isInWishlist = wishlistItems.has(productId)

    setIsAddingToWishlist(productId)
    try {
      const method = isInWishlist ? 'DELETE' : 'POST'
      const response = await fetch(`/api/customer/wishlist${isInWishlist ? `/${productId}` : ''}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: isInWishlist ? undefined : JSON.stringify({ productId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update wishlist')
      }

      // Update local state
      const newWishlist = new Set(wishlistItems)
      if (isInWishlist) {
        newWishlist.delete(productId)
      } else {
        newWishlist.add(productId)
      }
      setWishlistItems(newWishlist)

      toast({
        title: "Success",
        description: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
      })
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wishlist",
        variant: "destructive"
      })
    } finally {
      setIsAddingToWishlist(null)
    }
  }

  const addToCart = async (product: Product) => {
    if (product.stock_quantity === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock",
        variant: "destructive"
      })
      return
    }

    setIsAddingToCart(product.id)
    try {
      const response = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1
        })
      })

      if (!response.ok) {
        console.error('Cart API error:', response.status, response.statusText)
        let errorData: ApiError = {}
        try {
          errorData = await response.json()
        } catch (e) {
          console.error('Failed to parse error response:', e)
        }
        console.error('Error data:', errorData)
        const errorMessage = (errorData as ApiError).error || (errorData as ApiError).message || `Failed to add item to cart (${response.status})`
        throw new Error(errorMessage)
      }

      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart",
        variant: "destructive"
      })
    } finally {
      setIsAddingToCart(null)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Browse our collection of products</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {products.length} products
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory || "all"} onValueChange={(value) => handleCategoryChange(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="created_at">Newest</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={handleSortOrderChange}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'No products are currently available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 relative overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`absolute top-2 right-2 h-8 w-8 p-0 ${
                        wishlistItems.has(product.id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-white/80 hover:bg-white'
                      }`}
                      onClick={() => toggleWishlist(product.id)}
                      disabled={isAddingToWishlist === product.id}
                    >
                      {isAddingToWishlist === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 ${wishlistItems.has(product.id) ? 'fill-current' : ''}`} />
                      )}
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        UGX {product.price.toLocaleString()}
                      </span>
                      <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                      </Badge>
                    </div>

                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}

                    {product.categories && (
                      <Badge variant="outline" className="text-xs">
                        {product.categories.name}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1"
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}