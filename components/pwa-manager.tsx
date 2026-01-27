"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, RefreshCw, Download } from "lucide-react"

const APP_VERSION = "2.4.0"

export function PWAManager() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [showPermission, setShowPermission] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isSamsungBrowser, setIsSamsungBrowser] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isSamsung = userAgent.includes('samsungbrowser')
    setIsSamsungBrowser(isSamsung)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setRegistration(reg)

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowUpdate(true)
                }
              })
            }
          })

          reg.update()
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err)
        })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }

    checkStoragePermission()
  }, [])

  const checkStoragePermission = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const percentUsed = (usage / quota) * 100

        if (isSamsungBrowser && percentUsed < 1) {
          setTimeout(() => {
            setShowPermission(true)
          }, 3000)
        }
      }
    } catch (err) {
      console.warn('Storage check failed:', err)
    }
  }

  const requestPersistentStorage = async () => {
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersisted = await navigator.storage.persist()
        if (isPersisted) {
          setShowPermission(false)
        }
      }
    } catch (err) {
      console.warn('Storage permission request failed:', err)
    }
    setShowPermission(false)
  }

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdate(false)
  }

  if (!showUpdate && !showPermission) {
    return null
  }

  return (
    <>
      {showUpdate && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <Card className="border-blue-500 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Update Available</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-2"
                  onClick={() => setShowUpdate(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">
                A new version (v{APP_VERSION}) is ready to install
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button onClick={handleUpdate} className="w-full" size="sm">
                Update Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showPermission && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <Card className="border-blue-500 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Enable Storage</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-2"
                  onClick={() => setShowPermission(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">
                Enable persistent storage to save your data and work offline
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button onClick={requestPersistentStorage} className="w-full" size="sm">
                Enable Storage
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
