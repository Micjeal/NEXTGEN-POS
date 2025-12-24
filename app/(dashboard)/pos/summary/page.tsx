"use client"

import { Button } from "@/components/ui/button"
import { Printer, HelpCircle, Save, Receipt } from "lucide-react"
import Link from "next/link"

export default function SalesSummaryPage() {
  const handlePrint = () => {
    window.print()
  }

  const handleHelpInQueue = () => {
    // TODO: Implement help in queue functionality
    console.log("Help in queue clicked")
  }

  const handlePrintAndSave = () => {
    // Print first
    window.print()
    // TODO: Implement save functionality
    console.log("Print and save clicked")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Sales Summary</h1>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Transaction Details</h2>

          {/* Placeholder for transaction summary content */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Invoice Number</label>
                <p className="text-lg font-semibold">INV-001</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Date</label>
                <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</label>
                <p className="text-lg font-semibold text-green-600">UGX 0</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Items Sold</label>
                <p className="text-lg font-semibold">0</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              onClick={handleHelpInQueue}
              className="flex items-center gap-2"
              variant="outline"
            >
              <HelpCircle className="h-4 w-4" />
              Help in Queue
            </Button>

            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              onClick={handlePrintAndSave}
              className="flex items-center gap-2"
              variant="default"
            >
              <Save className="h-4 w-4" />
              Print and Save
            </Button>

            <Button
              asChild
              className="flex items-center gap-2"
              variant="outline"
            >
              <Link href="/reports">
                <Receipt className="h-4 w-4" />
                View All Transactions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}