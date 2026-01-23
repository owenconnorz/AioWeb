"use client"

import { useEffect } from "react"

const APP_VERSION = "2.4.0"
const VERSION_KEY = "app_version"

export function CacheClearer() {
  useEffect(() => {
    const checkAndClearCache = async () => {
      try {
        const storedVersion = localStorage.getItem(VERSION_KEY)
        
        // If version changed, clear caches
        if (storedVersion !== APP_VERSION) {
          // Clear service worker caches
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
          }
          
          // Unregister old service workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const registration of registrations) {
              await registration.unregister()
            }
          }
          
          // Store new version
          localStorage.setItem(VERSION_KEY, APP_VERSION)
          
          // Force reload to get fresh content (only if version was previously set)
          if (storedVersion) {
            window.location.reload()
          }
        }
      } catch (error) {
        // Silently fail
      }
    }
    
    checkAndClearCache()
  }, [])
  
  return null
}
