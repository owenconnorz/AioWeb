"use client"

import { useState, useEffect, useCallback } from "react"

interface DownloadedTrack {
  id: string
  videoId: string
  title: string
  artist?: string
  album?: string
  duration?: string
  thumbnail: string
  downloadedAt: number
  audioBlob?: Blob
  blobUrl?: string
}

interface DownloadProgress {
  videoId: string
  progress: number
  status: "pending" | "downloading" | "complete" | "error"
  error?: string
}

const DB_NAME = "MusicOfflineDB"
const DB_VERSION = 1
const STORE_NAME = "tracks"

export function useOfflineMusic() {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrack[]>([])
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map())
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize IndexedDB
  useEffect(() => {
    if (typeof window === "undefined") return

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("Failed to open IndexedDB")
      setIsLoading(false)
    }

    request.onsuccess = () => {
      setDb(request.result)
      loadDownloadedTracks(request.result)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "videoId" })
        store.createIndex("downloadedAt", "downloadedAt", { unique: false })
        store.createIndex("title", "title", { unique: false })
      }
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load downloaded tracks from IndexedDB
  const loadDownloadedTracks = useCallback((database: IDBDatabase) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const tracks = request.result.map((track: DownloadedTrack) => {
        // Create blob URL for playback
        if (track.audioBlob) {
          track.blobUrl = URL.createObjectURL(track.audioBlob)
        }
        return track
      })
      setDownloadedTracks(tracks)
      setIsLoading(false)
    }

    request.onerror = () => {
      console.error("Failed to load downloaded tracks")
      setIsLoading(false)
    }
  }, [])

  // Refresh tracks list
  const refreshTracks = useCallback(() => {
    if (db) {
      loadDownloadedTracks(db)
    }
  }, [db, loadDownloadedTracks])

  // Download a track
  const downloadTrack = useCallback(async (track: {
    videoId: string
    title: string
    artist?: string
    album?: string
    duration?: string
    thumbnail: string
  }) => {
    if (!db) return false

    const { videoId } = track

    // Update progress
    setDownloadProgress(prev => new Map(prev).set(videoId, {
      videoId,
      progress: 0,
      status: "pending"
    }))

    try {
      // Step 1: Get audio stream URL
      setDownloadProgress(prev => new Map(prev).set(videoId, {
        videoId,
        progress: 10,
        status: "downloading"
      }))

      const streamResponse = await fetch(`/api/music-download?videoId=${videoId}`)
      const streamData = await streamResponse.json()

      if (!streamData.audioUrl) {
        throw new Error(streamData.error || "Failed to get audio stream")
      }

      setDownloadProgress(prev => new Map(prev).set(videoId, {
        videoId,
        progress: 30,
        status: "downloading"
      }))

      // Step 2: Download the audio via proxy
      const audioResponse = await fetch("/api/music-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: streamData.audioUrl }),
      })

      if (!audioResponse.ok) {
        throw new Error("Failed to download audio")
      }

      setDownloadProgress(prev => new Map(prev).set(videoId, {
        videoId,
        progress: 70,
        status: "downloading"
      }))

      const audioBlob = await audioResponse.blob()

      // Step 3: Save to IndexedDB
      const downloadedTrack: DownloadedTrack = {
        id: videoId,
        videoId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        thumbnail: track.thumbnail,
        downloadedAt: Date.now(),
        audioBlob,
      }

      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      return new Promise<boolean>((resolve) => {
        const request = store.put(downloadedTrack)

        request.onsuccess = () => {
          setDownloadProgress(prev => new Map(prev).set(videoId, {
            videoId,
            progress: 100,
            status: "complete"
          }))
          
          // Update tracks list
          downloadedTrack.blobUrl = URL.createObjectURL(audioBlob)
          setDownloadedTracks(prev => {
            const filtered = prev.filter(t => t.videoId !== videoId)
            return [...filtered, downloadedTrack]
          })

          // Clear progress after delay
          setTimeout(() => {
            setDownloadProgress(prev => {
              const newMap = new Map(prev)
              newMap.delete(videoId)
              return newMap
            })
          }, 2000)

          resolve(true)
        }

        request.onerror = () => {
          setDownloadProgress(prev => new Map(prev).set(videoId, {
            videoId,
            progress: 0,
            status: "error",
            error: "Failed to save to storage"
          }))
          resolve(false)
        }
      })
    } catch (error) {
      setDownloadProgress(prev => new Map(prev).set(videoId, {
        videoId,
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Download failed"
      }))
      return false
    }
  }, [db])

  // Delete a downloaded track
  const deleteTrack = useCallback(async (videoId: string) => {
    if (!db) return false

    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    return new Promise<boolean>((resolve) => {
      const request = store.delete(videoId)

      request.onsuccess = () => {
        // Revoke blob URL
        const track = downloadedTracks.find(t => t.videoId === videoId)
        if (track?.blobUrl) {
          URL.revokeObjectURL(track.blobUrl)
        }
        
        setDownloadedTracks(prev => prev.filter(t => t.videoId !== videoId))
        resolve(true)
      }

      request.onerror = () => {
        resolve(false)
      }
    })
  }, [db, downloadedTracks])

  // Check if a track is downloaded
  const isDownloaded = useCallback((videoId: string) => {
    return downloadedTracks.some(t => t.videoId === videoId)
  }, [downloadedTracks])

  // Get blob URL for a downloaded track
  const getOfflineUrl = useCallback((videoId: string) => {
    const track = downloadedTracks.find(t => t.videoId === videoId)
    return track?.blobUrl || null
  }, [downloadedTracks])

  // Get storage usage estimate
  const getStorageUsage = useCallback(async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
      }
    }
    return null
  }, [])

  return {
    downloadedTracks,
    downloadProgress,
    isOnline,
    isLoading,
    downloadTrack,
    deleteTrack,
    isDownloaded,
    getOfflineUrl,
    getStorageUsage,
    refreshTracks,
  }
}
