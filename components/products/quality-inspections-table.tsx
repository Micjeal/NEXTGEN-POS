"use client"

import { useState } from "react"
import type { QualityInspection } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Calendar, User, Thermometer } from "lucide-react"
import { EditInspectionDialog } from "./edit-inspection-dialog"
import { DeleteInspectionDialog } from "./delete-inspection-dialog"

interface QualityInspectionsTableProps {
  inspections: QualityInspection[]
  productId: string
}

export function QualityInspectionsTable({ inspections, productId }: QualityInspectionsTableProps) {
  const [editInspection, setEditInspection] = useState<QualityInspection | null>(null)
  const [deleteInspection, setDeleteInspection] = useState<QualityInspection | null>(null)

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'acceptable': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'poor': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
    }
  }

  const getInspectionTypeColor = (type: string) => {
    switch (type) {
      case 'incoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'in_process': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'final': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'recall_check': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Quality Inspections
            </span>
            <Badge variant="secondary" className="ml-2">
              {inspections.length} inspections
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Batch</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Inspector</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Temperature</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Humidity</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Rating</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Follow-up</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <CheckCircle className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">No inspections found</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              No quality inspections have been performed yet
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    inspections.map((inspection, index) => (
                      <tr
                        key={inspection.id}
                        className={`border-b border-slate-100 dark:border-slate-700 transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/30'
                        } hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {inspection.batch?.batch_number?.charAt(0).toUpperCase() || 'B'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {inspection.batch?.batch_number || "-"}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {inspection.product?.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={getInspectionTypeColor(inspection.inspection_type)}>
                            {inspection.inspection_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                              {formatDate(inspection.inspection_date)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {inspection.inspector?.full_name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Thermometer className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                              {inspection.temperature ? `${inspection.temperature}°C` : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                            {inspection.humidity ? `${inspection.humidity}%` : "-"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={getRatingColor(inspection.overall_rating)}>
                            {inspection.overall_rating || "Pending"}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {inspection.requires_followup ? (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-slate-200 dark:border-slate-600 shadow-lg">
                              <DropdownMenuItem
                                onClick={() => setEditInspection(inspection)}
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Inspection
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteInspection(inspection)}
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Inspection
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditInspectionDialog
        inspection={editInspection}
        open={!!editInspection}
        onOpenChange={(open) => !open && setEditInspection(null)}
      />

      <DeleteInspectionDialog
        inspection={deleteInspection}
        open={!!deleteInspection}
        onOpenChange={(open) => !open && setDeleteInspection(null)}
      />
    </>
  )
}