"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FolderOpen } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function LocalMediaPage() {
  const [scanOnStartup, setScanOnStartup] = useState(true)
  const [includeSubfolders, setIncludeSubfolders] = useState(true)
  const [monitorChanges, setMonitorChanges] = useState(false)

  const handleSave = () => {
    toast.success("Settings saved successfully")
  }

  const handleSelectFolder = () => {
    toast.info("Folder selection not implemented in this demo")
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Local media</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Media Folders</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select folders to scan for local media files
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSelectFolder}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Add Folder
              </Button>
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="scan-startup" className="text-base font-medium">
                  Scan on Startup
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Automatically scan media folders when app starts
                </p>
              </div>
              <Switch id="scan-startup" checked={scanOnStartup} onCheckedChange={setScanOnStartup} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="include-subfolders" className="text-base font-medium">
                  Include Subfolders
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Scan subfolders within selected media folders
                </p>
              </div>
              <Switch id="include-subfolders" checked={includeSubfolders} onCheckedChange={setIncludeSubfolders} />
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="monitor-changes" className="text-base font-medium">
                  Monitor for Changes
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Automatically detect new or removed media files
                </p>
              </div>
              <Switch id="monitor-changes" checked={monitorChanges} onCheckedChange={setMonitorChanges} />
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
