"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ExperimentalPage() {
  const [betaFeatures, setBetaFeatures] = useState(false)
  const [advancedAudio, setAdvancedAudio] = useState(false)
  const [experimentalUI, setExperimentalUI] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Experimental</h1>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-900 dark:text-amber-200">
            These features are experimental and may be unstable. Use at your own risk.
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="beta-features" className="text-base font-medium">
                  Beta Features
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enable early access to new features
                </p>
              </div>
              <Switch id="beta-features" checked={betaFeatures} onCheckedChange={setBetaFeatures} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="advanced-audio" className="text-base font-medium">
                  Advanced Audio Processing
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Experimental audio enhancement features
                </p>
              </div>
              <Switch id="advanced-audio" checked={advancedAudio} onCheckedChange={setAdvancedAudio} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="experimental-ui" className="text-base font-medium">
                  Experimental UI
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try new interface designs and layouts
                </p>
              </div>
              <Switch id="experimental-ui" checked={experimentalUI} onCheckedChange={setExperimentalUI} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="debug-mode" className="text-base font-medium">
                  Debug Mode
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Show additional debugging information
                </p>
              </div>
              <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
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
