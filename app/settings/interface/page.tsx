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

export default function InterfacePage() {
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [compactView, setCompactView] = useState(false)
  const [showArtist, setShowArtist] = useState(true)
  const [gestureControls, setGestureControls] = useState(true)

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Interface</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="show-thumbnails" className="text-base font-medium">
                  Show Thumbnails
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Display album artwork and thumbnails in lists
                </p>
              </div>
              <Switch id="show-thumbnails" checked={showThumbnails} onCheckedChange={setShowThumbnails} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="compact-view" className="text-base font-medium">
                  Compact View
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Show more items per screen with smaller spacing
                </p>
              </div>
              <Switch id="compact-view" checked={compactView} onCheckedChange={setCompactView} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="show-artist" className="text-base font-medium">
                  Show Artist Names
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Display artist information in track listings
                </p>
              </div>
              <Switch id="show-artist" checked={showArtist} onCheckedChange={setShowArtist} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="gesture-controls" className="text-base font-medium">
                  Gesture Controls
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enable swipe gestures for quick actions
                </p>
              </div>
              <Switch id="gesture-controls" checked={gestureControls} onCheckedChange={setGestureControls} />
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
