"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Store } from "lucide-react"

export function SettingsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Information
        </CardTitle>
        <CardDescription>Configure your store details</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" defaultValue="SMMS Supermarket" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="store-phone">Phone Number</Label>
              <Input id="store-phone" defaultValue="(555) 123-4567" />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="store-address">Address</Label>
              <Input id="store-address" defaultValue="123 Main Street, City, State 12345" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">POS Settings</h4>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-print Receipt</Label>
                <p className="text-sm text-muted-foreground">Automatically print receipt after each sale</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Show notifications for low stock items</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
