"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Trash2, Database } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function StoragePage() {
  const [storageUsed, setStorageUsed] = useState(0)
  const [calculating, setCalculating] = useState(true)

  useEffect(() => {
    const calculateStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          const usageInMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2)
          setStorageUsed(parseFloat(usageInMB))
        } catch (error) {
          console.error("Failed to estimate storage:", error)
        }
      }
      setCalculating(false)
    }

    calculateStorage()
  }, [])

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      }
      toast.success("Cache cleared successfully")
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error("Failed to clear cache")
    }
  }

  const handleRequestStorage = async () => {
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersisted = await navigator.storage.persist()
        if (isPersisted) {
          toast.success("Persistent storage enabled")
        } else {
          toast.warning("Storage permission denied")
        }
      } else {
        toast.warning("Storage API not supported")
      }
    } catch (error) {
      toast.error("Failed to request storage permission")
    }
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Storage</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Storage Usage</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {calculating ? "Calculating..." : `${storageUsed} MB used`}
                </p>
              </div>
              <Progress value={Math.min((storageUsed / 100) * 100, 100)} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Storage Management</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage app data and cache
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRequestStorage}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Enable Persistent Storage
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleClearCache}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Downloaded content</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">0 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Cached data</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{calculating ? "..." : `${storageUsed} MB`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">App data</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">2.5 MB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
