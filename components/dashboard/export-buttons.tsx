"use client"

import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

export function ExportButtons() {
  const generatePDF = () => {
    // Basic PDF generation using browser print
    toast.info("Generating PDF report...")
    window.print()
  }

  const generateExcel = () => {
    // Create CSV data for Excel
    const csvData = [
      ["Dashboard Report", new Date().toLocaleDateString()],
      ["", ""],
      ["Metric", "Value"],
      ["Today's Sales", "Data from dashboard"],
      ["Transactions", "Data from dashboard"],
      ["Active Products", "Data from dashboard"],
      ["Low Stock Alerts", "Data from dashboard"],
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Excel report downloaded!")
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={generatePDF}>
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
      <Button variant="outline" size="sm" onClick={generateExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
    </div>
  )
}