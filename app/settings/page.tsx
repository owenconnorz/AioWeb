"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, Shield, Zap, ImageIcon } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [nsfwFilter, setNsfwFilter] = useState(true)
  const [autoSave, setAutoSave] = useState(false)
  const [highQuality, setHighQuality] = useState(true)
  const [showWatermark, setShowWatermark] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const handleSaveSettings = () => {
    // Save settings to localStorage or backend
    const settings = {
      nsfwFilter,
      autoSave,
      highQuality,
      showWatermark,
      darkMode,
    }
    localStorage.setItem("aiCreativeSuiteSettings", JSON.stringify(settings))
    alert("Settings saved successfully!")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 sm:px-4 sm:py-2 sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              Configuration
            </div>
            <h1 className="mb-2 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Settings</h1>
            <p className="text-pretty text-sm text-slate-600 sm:text-base">Customize your Naughty AI experience</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Content Safety Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                <CardTitle className="text-base sm:text-lg">Content Safety</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Control what type of content can be generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="nsfw-filter" className="text-sm font-medium sm:text-base">
                    NSFW Filter
                  </Label>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Block adult or inappropriate content from being generated
                  </p>
                </div>
                <Switch id="nsfw-filter" checked={nsfwFilter} onCheckedChange={setNsfwFilter} />
              </div>
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                <CardTitle className="text-base sm:text-lg">Generation Settings</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">Configure how content is generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="high-quality" className="text-sm font-medium sm:text-base">
                    High Quality Mode
                  </Label>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Generate higher quality images and text (may take longer)
                  </p>
                </div>
                <Switch id="high-quality" checked={highQuality} onCheckedChange={setHighQuality} />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="watermark" className="text-sm font-medium sm:text-base">
                    Add Watermark
                  </Label>
                  <p className="text-xs text-slate-500 sm:text-sm">Include a small watermark on generated images</p>
                </div>
                <Switch id="watermark" checked={showWatermark} onCheckedChange={setShowWatermark} />
              </div>
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                <CardTitle className="text-base sm:text-lg">Application Settings</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">Personalize your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="auto-save" className="text-sm font-medium sm:text-base">
                    Auto-save Results
                  </Label>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Automatically save generated content to your history
                  </p>
                </div>
                <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-sm font-medium sm:text-base">
                    Dark Mode
                  </Label>
                  <p className="text-xs text-slate-500 sm:text-sm">Switch to a darker color scheme</p>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto">
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
