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

export default function PlayerAndAudioPage() {
  const [crossfade, setCrossfade] = useState(false)
  const [gaplessPlayback, setGaplessPlayback] = useState(true)
  const [normalizeVolume, setNormalizeVolume] = useState(true)
  const [audioQuality, setAudioQuality] = useState(true)

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Player and audio</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="crossfade" className="text-base font-medium">
                  Crossfade
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Smoothly transition between tracks
                </p>
              </div>
              <Switch id="crossfade" checked={crossfade} onCheckedChange={setCrossfade} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="gapless" className="text-base font-medium">
                  Gapless Playback
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Play songs without pauses between them
                </p>
              </div>
              <Switch id="gapless" checked={gaplessPlayback} onCheckedChange={setGaplessPlayback} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="normalize" className="text-base font-medium">
                  Normalize Volume
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Maintain consistent volume across all tracks
                </p>
              </div>
              <Switch id="normalize" checked={normalizeVolume} onCheckedChange={setNormalizeVolume} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="audio-quality" className="text-base font-medium">
                  High Audio Quality
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Stream and play audio at the highest quality
                </p>
              </div>
              <Switch id="audio-quality" checked={audioQuality} onCheckedChange={setAudioQuality} />
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
