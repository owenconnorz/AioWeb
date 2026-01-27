"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AccountAndSyncPage() {
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [syncOnWifi, setSyncOnWifi] = useState(true)

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account and sync</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="sync-enabled" className="text-base font-medium">
                  Enable Sync
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Synchronize your data across devices
                </p>
              </div>
              <Switch id="sync-enabled" checked={syncEnabled} onCheckedChange={setSyncEnabled} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="auto-sync" className="text-base font-medium">
                  Automatic Sync
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sync automatically when changes are made
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
                disabled={!syncEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="sync-wifi" className="text-base font-medium">
                  Sync only on Wi-Fi
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Save mobile data by syncing only on Wi-Fi
                </p>
              </div>
              <Switch
                id="sync-wifi"
                checked={syncOnWifi}
                onCheckedChange={setSyncOnWifi}
                disabled={!syncEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Account Email</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email address associated with your account
                </p>
              </div>
              <Input
                type="email"
                placeholder="user@example.com"
                className="max-w-sm"
              />
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
