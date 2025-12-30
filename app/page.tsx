import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  Quote,
  Monitor,
  Smartphone,
  Globe
} from "lucide-react"
import FAQSection from "@/components/faq-section"
import LandingPageClient from './LandingPageClient'

export const metadata = {
  title: "SMMS POS - Smart Point of Sale for Modern Retail",
  description: "Streamline your retail operations with SMMS POS. Manage inventory, track sales, handle customers, and grow your business with powerful analytics.",
  keywords: "POS system, retail POS, point of sale, inventory management, sales tracking, retail software",
  openGraph: {
    title: "SMMS POS - Smart Point of Sale for Modern Retail",
    description: "Comprehensive POS system for retail stores with inventory management, analytics, and customer handling.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "SMMS POS",
      "description": "Smart Point of Sale system for modern retail businesses",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web-based",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "UGX",
        "price": "100000",
        "priceValidUntil": "2025-12-31"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1250"
      }
    })
  }
}

export default function Page() {
  return <LandingPageClient />
}
