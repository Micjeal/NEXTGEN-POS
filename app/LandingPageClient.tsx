'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Star } from "lucide-react"

export default function LandingPageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-6">
          <Star className="w-4 h-4 mr-1" />
          Trusted by 1250+ Retail Stores
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Smart Point of Sale for
          <span className="text-blue-600 block">Modern Retail</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Streamline your retail operations with SMMS POS. Manage inventory, track sales,
          and grow your business with powerful analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8 py-3">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  )
}
