"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function LibraryAndContentPage() {
  const [showExplicit, setShowExplicit] = useState(true)
  const [downloadQuality, setDownloadQuality] = useState(true)
  const [cacheContent, setCacheContent] = useState(true)
  const [autoDownload, setAutoDownload] = useState(false)

  const handleSave = () => {
    toast.success("Settings saved successfully")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Library and content</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="show-explicit" className="text-base font-medium">
                  Show Explicit Content
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Display content marked as explicit in your library
                </p>
              </div>
              <Switch id="show-explicit" checked={showExplicit} onCheckedChange={setShowExplicit} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="download-quality" className="text-base font-medium">
                  High Quality Downloads
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Download content in the highest quality available
                </p>
              </div>
              <Switch id="download-quality" checked={downloadQuality} onCheckedChange={setDownloadQuality} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="cache-content" className="text-base font-medium">
                  Cache Content
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Store recently played content for faster access
                </p>
              </div>
              <Switch id="cache-content" checked={cacheContent} onCheckedChange={setCacheContent} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="auto-download" className="text-base font-medium">
                  Auto-download Favorites
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Automatically download your favorite content for offline access
                </p>
              </div>
              <Switch id="auto-download" checked={autoDownload} onCheckedChange={setAutoDownload} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto">
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 sm:w-auto">
            Save Settings
          </Button>
        </div>
      </div>
    </main>
  )
}
