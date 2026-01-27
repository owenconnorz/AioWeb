"use client"

import { useEffect } from "react"

const APP_VERSION = "2.4.0"
const VERSION_KEY = "app_version"
const LAST_CHECK_KEY = "last_version_check"

export function CacheClearer() {
  useEffect(() => {
    const checkAndClearCache = async () => {
      try {
        const storedVersion = localStorage.getItem(VERSION_KEY)
        const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
        const now = Date.now()

        const shouldCheck = !lastCheck || (now - parseInt(lastCheck, 10)) > 3600000

        if (shouldCheck) {
          localStorage.setItem(LAST_CHECK_KEY, now.toString())
        }

        if (storedVersion !== APP_VERSION) {
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
          }

          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const registration of registrations) {
              if (registration.active) {
                registration.active.postMessage({ type: 'CLEAR_CACHE' })
              }
              await registration.update()
            }
          }

          localStorage.setItem(VERSION_KEY, APP_VERSION)

          if (storedVersion && shouldCheck) {
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          }
        }
      } catch (error) {
        console.warn('Cache clear failed:', error)
      }
    }

    checkAndClearCache()
  }, [])

  return null
}
