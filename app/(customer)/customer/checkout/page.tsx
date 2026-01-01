'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react';
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

interface CustomerProfile {
  id: string;
  phone: string;
  email: string;
  full_name: string;
  address: string;
  city: string;
  country: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartData>({ items: [], total: 0, itemCount: 0 });
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCart();
    fetchCustomerProfile();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/customer/cart');
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        toast.error('Failed to load cart');
        router.push('/customer/cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
      router.push('/customer/cart');
    }
  };

  const fetchCustomerProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const profile = await response.json();
        setCustomer(profile.customer);
        // Pre-fill shipping address with customer data
        if (profile.customer) {
          setShippingAddress({
            full_name: profile.customer.full_name || '',
            phone: profile.customer.phone || '',
            email: profile.customer.email || '',
            address: profile.customer.address || '',
            city: profile.customer.city || '',
            country: profile.customer.country || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingAddressChange = (field: string, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!shippingAddress.full_name.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!shippingAddress.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (!shippingAddress.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!shippingAddress.address.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!shippingAddress.country.trim()) {
      toast.error('Country is required');
      return false;
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      const orderData = {
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        notes: notes.trim(),
        order_type: 'online'
      };

      const response = await fetch('/api/customer/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Order placed successfully! Waiting for admin approval.');
        router.push(`/customer/orders/${result.orderId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setProcessing(false);
    }
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

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-4">Add some products to your cart before checkout.</p>
            <Button onClick={() => router.push('/customer/products')}>
              Browse Products
            </Button>
          </div>
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
          onClick={() => router.push('/customer/cart')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your online order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={shippingAddress.full_name}
                    onChange={(e) => handleShippingAddressChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => handleShippingAddressChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) => handleShippingAddressChange('country', e.target.value)}
                    placeholder="Enter your country"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={shippingAddress.address}
                  onChange={(e) => handleShippingAddressChange('address', e.target.value)}
                  placeholder="Enter your street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                  placeholder="Enter your city"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-sm">${item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your order will be reviewed and approved by our admin team before processing.
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Place Online Order
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}