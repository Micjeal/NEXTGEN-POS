"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Palette, Sun, Moon, Monitor, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ThemeSettings() {
  const [themeSettings, setThemeSettings] = useState({
    theme: "system",
    primaryColor: "blue",
    accentColor: "purple",
    enableAnimations: true,
    compactMode: false,
    highContrast: false,
  })

  const { theme, setTheme } = useTheme()

  useEffect(() => {
    console.log("Current theme from useTheme:", theme)
    setThemeSettings(prev => ({ ...prev, theme: theme || "system" }))
  }, [theme])

  const { toast } = useToast()

  const handleSave = () => {
    setTheme(themeSettings.theme)
    console.log("Applying theme:", themeSettings.theme)
    toast({
      title: "Theme Updated",
      description: "Appearance settings have been saved.",
    })
  }

  const colorOptions = [
    { value: "blue", label: "Blue", color: "bg-blue-500" },
    { value: "green", label: "Green", color: "bg-green-500" },
    { value: "purple", label: "Purple", color: "bg-purple-500" },
    { value: "red", label: "Red", color: "bg-red-500" },
    { value: "orange", label: "Orange", color: "bg-orange-500" },
    { value: "pink", label: "Pink", color: "bg-pink-500" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme Mode</Label>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={themeSettings.theme === "light" ? "default" : "outline"}
                  onClick={() => { setTheme("light"); setThemeSettings(prev => ({ ...prev, theme: "light" })); console.log("Setting theme to light"); }}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                >
                  <Sun className="h-6 w-6" />
                  <span>Light</span>
                </Button>
                <Button
                  variant={themeSettings.theme === "dark" ? "default" : "outline"}
                  onClick={() => { setTheme("dark"); setThemeSettings(prev => ({ ...prev, theme: "dark" })); console.log("Setting theme to dark"); }}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                >
                  <Moon className="h-6 w-6" />
                  <span>Dark</span>
                </Button>
                <Button
                  variant={themeSettings.theme === "system" ? "default" : "outline"}
                  onClick={() => { setTheme("system"); setThemeSettings(prev => ({ ...prev, theme: "system" })); console.log("Setting theme to system"); }}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                >
                  <Monitor className="h-6 w-6" />
                  <span>System</span>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <Select
                  value={themeSettings.primaryColor}
                  onValueChange={(value) => setThemeSettings(prev => ({ ...prev, primaryColor: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${color.color}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <Select
                  value={themeSettings.accentColor}
                  onValueChange={(value) => setThemeSettings(prev => ({ ...prev, accentColor: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${color.color}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Animations</Label>
                  <p className="text-sm text-muted-foreground">Smooth transitions and animations</p>
                </div>
                <Switch
                  checked={themeSettings.enableAnimations}
                  onCheckedChange={(checked) => setThemeSettings(prev => ({ ...prev, enableAnimations: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Switch
                  checked={themeSettings.compactMode}
                  onCheckedChange={(checked) => setThemeSettings(prev => ({ ...prev, compactMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch
                  checked={themeSettings.highContrast}
                  onCheckedChange={(checked) => setThemeSettings(prev => ({ ...prev, highContrast: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your theme changes will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Sample Content</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This is how your content will appear with the selected theme settings.
              </p>
              <div className="flex gap-2">
                <Button size="sm">Primary Button</Button>
                <Button variant="outline" size="sm">Secondary Button</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Apply Theme
        </Button>
      </div>
    </div>
  )
}