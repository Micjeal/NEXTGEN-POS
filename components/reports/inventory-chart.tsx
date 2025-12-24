"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Inventory, Product } from "@/lib/types/database"

// Extend Inventory type to include the product relationship
interface InventoryWithProduct extends Inventory {
  product?: Product;
}

interface InventoryChartProps {
  inventory: InventoryWithProduct[]
}

export function InventoryChart({ inventory }: InventoryChartProps) {
  // Process inventory data for the chart
  const chartData = inventory
    .filter(item => item.quantity < item.min_stock_level * 1.5) // Show items that are close to or below min stock
    .sort((a, b) => (b.max_stock_level - b.quantity) - (a.max_stock_level - a.quantity))
    .slice(0, 10) // Limit to top 10 items that need attention
    .map(item => ({
      name: item.product?.name || 'Unknown Product',
      current: item.quantity,
      min: item.min_stock_level,
      max: item.max_stock_level
    }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No inventory data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Levels</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'current') return [value, 'Current Stock'];
                if (name === 'min') return [value, 'Min Level'];
                if (name === 'max') return [value, 'Max Level'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="current" name="Current Stock" fill="#3b82f6" />
            <Bar dataKey="min" name="Min Level" fill="#ef4444" />
            <Bar dataKey="max" name="Max Level" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
