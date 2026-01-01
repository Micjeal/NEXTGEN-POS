'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category: string;
  quantity: number;
  subtotal: number;
  added_at: string;
  updated_at: string;
}

interface CartData {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData>({ items: [], total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/customer/cart');
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        toast.error('Failed to load cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdating(productId);
    try {
      const response = await fetch('/api/customer/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      if (response.ok) {
        await fetchCart();
        toast.success('Cart updated');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: string) => {
    await updateQuantity(productId, 0);
  };

  const clearCart = async () => {
    try {
      const response = await fetch('/api/customer/cart', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCart({ items: [], total: 0, itemCount: 0 });
        toast.success('Cart cleared');
      } else {
        toast.error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    router.push('/customer/checkout');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Add some products to your cart to get started with your shopping.
            </p>
            <Button onClick={() => router.push('/customer/products')}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {item.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            disabled={updating === item.product_id || item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {updating === item.product_id ? '...' : item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={updating === item.product_id || item.quantity >= item.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            ${(item.subtotal).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      {item.quantity >= item.stock_quantity && (
                        <p className="text-sm text-destructive mt-2">
                          Maximum available quantity reached
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={clearCart}>
                Clear Cart
              </Button>
              <Button variant="outline" onClick={() => router.push('/customer/products')}>
                Continue Shopping
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Items ({cart.itemCount})</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={proceedToCheckout}
                >
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Secure checkout powered by our payment system
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}