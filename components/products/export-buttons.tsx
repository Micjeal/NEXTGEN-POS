"use client"

import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, Download } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/types/database"

interface ProductExportButtonsProps {
  products: Product[]
}

export function ProductExportButtons({ products }: ProductExportButtonsProps) {
  const generateCSV = () => {
    const csvData = [
      ["Product Name", "Barcode", "Category", "Supplier", "Price", "Cost Price", "Tax Rate", "Expiry Date", "Stock Quantity", "Status"],
      ...products.map(product => [
        product.name,
        product.barcode || "",
        product.category?.name || "",
        product.supplier_products?.[0]?.supplier?.name || "",
        product.price.toString(),
        product.cost_price.toString(),
        product.tax_rate.toString(),
        product.expiry_date || "",
        product.inventory?.quantity?.toString() || "0",
        product.is_active ? "Active" : "Inactive"
      ])
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `products-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Products exported to CSV!")
    }
  }

  const generatePDF = () => {
    toast.info("Generating PDF report...")
    window.print()
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={generateCSV}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={generatePDF}>
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  )
}