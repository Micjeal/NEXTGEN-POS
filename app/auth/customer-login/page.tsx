"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Star, ShoppingCart } from "lucide-react"

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get("message")
    if (message) {
      setSuccess(message)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/customer/dashboard")
      router.refresh()
    } catch (error: unknown) {
      // Log failed attempt
      try {
        await fetch('/api/auth/log-failed-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
      } catch (logError) {
        console.error('Error logging failed attempt:', logError);
      }
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center p-8">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Customer Portal</h1>
            <p className="text-xl text-purple-100 mb-8">Access your loyalty rewards and purchase history</p>
          </div>

          <div className="space-y-6 text-left">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Earn Points</h3>
                <p className="text-purple-100">Get rewarded for every purchase you make</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Exclusive Offers</h3>
                <p className="text-purple-100">Enjoy special discounts and member-only deals</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Track History</h3>
                <p className="text-purple-100">View your complete purchase history and points balance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Star className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
            <p className="text-gray-600">Access your loyalty rewards</p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign in to access your loyalty account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                </div>


                {success && (
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}
                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Links */}
              <div className="space-y-2 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 block"
                >
                  Forgot your password?
                </Link>
                <Link
                  href="/auth/customer-sign-up"
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 block"
                >
                  Don't have an account? Sign up
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-4 block"
                >
                  Staff login
                </Link>
              </div>
            </CardContent>
          </Card>


          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-4">
            © 2024 POS System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}