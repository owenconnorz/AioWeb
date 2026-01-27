"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [useAmoled, setUseAmoled] = useState(false)
  const [dynamicColors, setDynamicColors] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = () => {
    toast.success("Settings saved successfully")
  }

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Appearance</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base font-medium">
                  Dark Mode
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Switch to a darker color scheme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={mounted ? theme === "dark" : false}
                onCheckedChange={handleThemeToggle}
                disabled={!mounted}
              />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="amoled" className="text-base font-medium">
                  AMOLED Black
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Use pure black background for AMOLED displays
                </p>
              </div>
              <Switch
                id="amoled"
                checked={useAmoled}
                onCheckedChange={setUseAmoled}
                disabled={!mounted || theme !== "dark"}
              />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="dynamic-colors" className="text-base font-medium">
                  Dynamic Colors
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Use colors from album artwork
                </p>
              </div>
              <Switch id="dynamic-colors" checked={dynamicColors} onCheckedChange={setDynamicColors} />
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
