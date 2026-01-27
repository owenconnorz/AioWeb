"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function BackupAndRestorePage() {
  const [autoBackup, setAutoBackup] = useState(true)
  const [backupOnWifi, setBackupOnWifi] = useState(true)
  const [includeSettings, setIncludeSettings] = useState(true)

  const handleBackup = () => {
    toast.success("Backup created successfully")
  }

  const handleRestore = () => {
    toast.info("Restore feature not implemented in this demo")
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Backup and restore</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Manual Backup</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Create a backup of your data and settings
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleBackup}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Create Backup
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRestore}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Restore from Backup
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="auto-backup" className="text-base font-medium">
                  Automatic Backup
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Automatically backup your data daily
                </p>
              </div>
              <Switch id="auto-backup" checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="backup-wifi" className="text-base font-medium">
                  Backup only on Wi-Fi
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Save mobile data by backing up only on Wi-Fi
                </p>
              </div>
              <Switch
                id="backup-wifi"
                checked={backupOnWifi}
                onCheckedChange={setBackupOnWifi}
                disabled={!autoBackup}
              />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="include-settings" className="text-base font-medium">
                  Include Settings
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Backup app settings and preferences
                </p>
              </div>
              <Switch id="include-settings" checked={includeSettings} onCheckedChange={setIncludeSettings} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto">
            Reset to Defaults
          </Button>
          <Button onClick={() => toast.success("Settings saved successfully")} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 sm:w-auto">
            Save Settings
          </Button>
        </div>
      </div>
    </main>
  )
}
