"use client"

import { useEffect } from "react"

const APP_VERSION = "2.1.0"
const VERSION_KEY = "app_version"

export function CacheClearer() {
  useEffect(() => {
    const checkAndClearCache = async () => {
      try {
        const storedVersion = localStorage.getItem(VERSION_KEY)
        
        // If version changed, clear caches
        if (storedVersion !== APP_VERSION) {
          console.log(`[v0] Version changed from ${storedVersion} to ${APP_VERSION}, clearing caches...`)
          
          // Clear service worker caches
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
            console.log('[v0] Cleared service worker caches')
          }
          
          // Unregister old service workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const registration of registrations) {
              await registration.unregister()
            }
            console.log('[v0] Unregistered service workers')
          }
          
          // Store new version
          localStorage.setItem(VERSION_KEY, APP_VERSION)
          
          // Force reload to get fresh content (only if version was previously set)
          if (storedVersion) {
            console.log('[v0] Reloading page for fresh content...')
            window.location.reload()
          }
        }
      } catch (error) {
        console.error('[v0] Error clearing cache:', error)
      }
    }
    
    checkAndClearCache()
  }, [])
  
  return null
}
