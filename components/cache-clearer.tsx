"use client"

import { useEffect } from "react"
import { APP_VERSION } from "@/lib/version"

const VERSION_KEY = "app_version"
const LAST_CHECK_KEY = "last_version_check"

export function CacheClearer() {
  useEffect(() => {
    const checkAndClearCache = async () => {
      try {
        const storedVersion = localStorage.getItem(VERSION_KEY)
        const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
        const now = Date.now()

        console.log(`[CacheClearer] Current version: ${APP_VERSION}, Stored version: ${storedVersion}`)

        const shouldCheck = !lastCheck || (now - parseInt(lastCheck, 10)) > 3600000

        if (shouldCheck) {
          localStorage.setItem(LAST_CHECK_KEY, now.toString())
          console.log('[CacheClearer] Performing periodic version check')
        }

        if (storedVersion !== APP_VERSION) {
          console.log(`[CacheClearer] Version mismatch detected! Clearing caches...`)

          if ('caches' in window) {
            const cacheNames = await caches.keys()
            console.log(`[CacheClearer] Deleting ${cacheNames.length} caches:`, cacheNames)
            await Promise.all(
              cacheNames.map(cacheName => {
                console.log(`[CacheClearer] Deleting cache: ${cacheName}`)
                return caches.delete(cacheName)
              })
            )
          }

          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            console.log(`[CacheClearer] Found ${registrations.length} service worker registrations`)
            for (const registration of registrations) {
              if (registration.active) {
                console.log('[CacheClearer] Sending CLEAR_CACHE message to service worker')
                registration.active.postMessage({ type: 'CLEAR_CACHE' })
              }
              console.log('[CacheClearer] Updating service worker registration')
              await registration.update()
            }
          }

          localStorage.setItem(VERSION_KEY, APP_VERSION)
          console.log(`[CacheClearer] Updated stored version to ${APP_VERSION}`)

          if (storedVersion && shouldCheck) {
            console.log('[CacheClearer] Reloading page in 1 second...')
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          }
        } else {
          console.log('[CacheClearer] Version matches, no cache clear needed')
        }
      } catch (error) {
        console.warn('[CacheClearer] Cache clear failed:', error)
      }
    }

    checkAndClearCache()
  }, [])

  return null
}
