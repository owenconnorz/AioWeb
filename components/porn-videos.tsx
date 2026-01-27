"use client"
// Version: 2.4.0 - Optimized RedGifs loading speed (removed proxy, use SD quality, added preload)
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Play,
  Eye,
  ThumbsUp,
  X,
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  Menu,
  Share2,
  History,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  Settings,
  Check,
  Download,
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { toast } from "sonner"

interface VideoQuality {
  label: string
  url: string
}

interface Video {
  id: string
  title: string
  keywords: string
  views: number
  rate: number
  url: string
  added: string
  length_sec: number
  length_min: string
  embed: string
  default_thumb: {
    src: string
    size: string
    width: number
    height: number
  }
  thumbs: Array<{
    src: string
    size: string
    width: number
    height: number
  }>
  thumbnail?: string
  isGallery?: boolean
  isCategory?: boolean
  qualities?: VideoQuality[]
  isImage?: boolean
  directUrl?: string
  fullImage?: string
  sampleImage?: string
}

interface Playlist {
  id: string
  name: string
  videoIds: string[]
  videos: Video[] // Store full video data
  createdAt: string
  }

interface HistoryItem {
  video: Video
  watchedAt: string
  apiSource: string
}

// Cookie helper functions
const cookieStorage = {
  set: (name: string, value: string, days: number = 365): void => {
    if (typeof document === 'undefined') return
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    // For large data, we need to compress or split
    const encodedValue = encodeURIComponent(value)
    document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  },
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const nameEQ = `${name}=`
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length))
      }
    }
    return null
  },
  remove: (name: string): void => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  }
}

// IndexedDB helper for large data storage
const indexedDBStorage = {
  dbName: 'PornAppDB',
  storeName: 'appData',
  
  async openDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) return null
    
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1)
      request.onerror = () => resolve(null)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  },
  
  async getItem(key: string): Promise<string | null> {
    const db = await this.openDB()
    if (!db) return null
    
    return new Promise((resolve) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)
      request.onerror = () => resolve(null)
      request.onsuccess = () => resolve(request.result?.value || null)
    })
  },
  
  async setItem(key: string, value: string): Promise<boolean> {
    const db = await this.openDB()
    if (!db) return false
    
    return new Promise((resolve) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ key, value })
      request.onerror = () => resolve(false)
      request.onsuccess = () => resolve(true)
    })
  },
  
  async removeItem(key: string): Promise<void> {
    const db = await this.openDB()
    if (!db) return
    
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    store.delete(key)
  }
}

// Safe storage helper with multiple fallbacks: localStorage -> IndexedDB -> cookies
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      // Try localStorage first
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = localStorage.getItem(key)
        if (value) return value
      }
    } catch (e) {
      console.warn('localStorage not available:', e)
    }
    
    // Try cookies as fallback for small data
    try {
      const cookieValue = cookieStorage.get(key)
      if (cookieValue) return cookieValue
    } catch (e) {
      console.warn('Cookie storage not available:', e)
    }
    
    return null
  },
  
  setItem: (key: string, value: string): boolean => {
    let saved = false
    
    // Try localStorage first
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
        saved = true
      }
    } catch (e) {
      console.warn('localStorage not available:', e)
      // Try to clear some space if quota exceeded
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem('porn_watch_history')
          localStorage.setItem(key, value)
          saved = true
        } catch (e2) {
          console.error('Failed to save even after clearing history:', e2)
        }
      }
    }
    
    // Also save to IndexedDB as backup (async, fire and forget)
    indexedDBStorage.setItem(key, value).catch(() => {})
    
    // For critical small data (playlists metadata), also save to cookies
    if (key === 'porn_playlists' || key === 'porn_saved_videos') {
      try {
        // Only save if data is small enough for cookies (< 4KB)
        if (value.length < 4000) {
          cookieStorage.set(key, value)
        }
      } catch (e) {
        console.warn('Cookie storage failed:', e)
      }
    }
    
    return saved
  },
  
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    } catch (e) {
      console.warn('localStorage removeItem failed:', e)
    }
    
    // Also remove from other storage
    cookieStorage.remove(key)
    indexedDBStorage.removeItem(key).catch(() => {})
  },
  
  // Async method to get from IndexedDB (for recovery)
  async getItemAsync(key: string): Promise<string | null> {
    // Try sync storage first
    const syncValue = this.getItem(key)
    if (syncValue) return syncValue
    
    // Try IndexedDB
    try {
      const idbValue = await indexedDBStorage.getItem(key)
      if (idbValue) {
        // Restore to localStorage if possible
        try {
          localStorage.setItem(key, idbValue)
        } catch (e) {}
        return idbValue
      }
    } catch (e) {
      console.warn('IndexedDB retrieval failed:', e)
    }
    
    return null
  }
}

type ApiSource = "redgifs" | "eporner" | "xvidapi" | "cam4" | "pornpics" | "chaturbate" | "redtube" | "hentai" | "youporn" | "reddit"

const DEFAULT_API_ORDER: ApiSource[] = ["xvidapi", "eporner", "youporn", "redtube", "redgifs", "cam4", "pornpics", "chaturbate", "hentai", "reddit"]

const XVIDAPI_CATEGORIES = [
  "xvidapi",
  // Popular
  "Amateur",
  "Anal",
  "Asian",
  "BBW",
  "Big Ass",
  "Big Tits",
  "Blonde",
  "Blowjob",
  "Brunette",
  "Creampie",
  "Cumshot",
  "Ebony",
  "Hardcore",
  "Latina",
  "Lesbian",
  "MILF",
  "POV",
  "Teen",
  "Threesome",
  // Body Types
  "Petite",
  "Curvy",
  "Skinny",
  "Thick",
  "Fit",
  "Chubby",
  "Pregnant",
  // Ethnicity
  "Arab",
  "Indian",
  "Japanese",
  "Korean",
  "Chinese",
  "Thai",
  "Filipina",
  "Russian",
  "European",
  "British",
  "German",
  "French",
  "Italian",
  "Spanish",
  "Czech",
  "Brazilian",
  "Colombian",
  // Hair
  "Redhead",
  "Ginger",
  // Age
  "Mature",
  "Granny",
  "Cougar",
  "College",
  "Young",
  // Acts
  "Deepthroat",
  "Facial",
  "Gangbang",
  "Orgy",
  "Double Penetration",
  "Ass to Mouth",
  "Handjob",
  "Footjob",
  "Titjob",
  "Rimjob",
  "69",
  "Fisting",
  "Squirt",
  "Swallow",
  "Bukkake",
  // Positions
  "Doggy Style",
  "Cowgirl",
  "Reverse Cowgirl",
  "Missionary",
  // Categories
  "BDSM",
  "Bondage",
  "Domination",
  "Femdom",
  "Fetish",
  "Foot Fetish",
  "Latex",
  "Leather",
  "Lingerie",
  "Stockings",
  "Pantyhose",
  "High Heels",
  "Uniform",
  "Cosplay",
  "Role Play",
  // Settings
  "Public",
  "Outdoor",
  "Beach",
  "Pool",
  "Shower",
  "Bathroom",
  "Kitchen",
  "Office",
  "Car",
  "Hotel",
  "Gym",
  "Massage",
  "Casting",
  // Production
  "Homemade",
  "Webcam",
  "Selfie",
  "Hidden Camera",
  "Reality",
  "Parody",
  "Vintage",
  "Retro",
  // Content Type
  "Solo",
  "Masturbation",
  "Dildo",
  "Vibrator",
  "Toys",
  "Striptease",
  "Dance",
  "Twerk",
  "Compilation",
  "Music Video",
  "Behind The Scenes",
  // Animated
  "Hentai",
  "Cartoon",
  "3D",
  "AI",
  "Animation",
  // Special
  "ASMR",
  "JOI",
  "Dirty Talk",
  "Moaning",
  "Orgasm",
  "Multiple Orgasms",
  // Relationship
  "Stepmom",
  "Stepsister",
  "Stepbrother",
  "Stepdaughter",
  "Wife",
  "Girlfriend",
  "Cheating",
  "Cuckold",
  // Physical Features
  "Natural Tits",
  "Fake Tits",
  "Small Tits",
  "Huge Tits",
  "Pierced",
  "Tattooed",
  "Hairy",
  "Shaved",
  "Bush",
  // Misc
  "Interracial",
  "BBC",
  "Swinger",
  "Party",
  "Club",
  "First Time",
  "Virgin",
  "Innocent",
  "Nerd",
  "Goth",
  "Emo",
  "Punk",
  "Hippie",
  "Secretary",
  "Teacher",
  "Student",
  "Nurse",
  "Doctor",
  "Maid",
  "Babysitter",
  "Cheerleader",
  "Pornstar",
  "Celebrity",
  "Model",
]

export function PornVideos() {
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [selectedQuality, setSelectedQuality] = useState<string>("auto")
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [apiSource, setApiSource] = useState<ApiSource>("xvidapi")
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [savedVideos, setSavedVideos] = useState<Video[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<Video | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalPages, setTotalPages] = useState(100) // Estimated total pages
  const [showPageJump, setShowPageJump] = useState(false)
  const [jumpToPage, setJumpToPage] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [feedView, setFeedView] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const iframeRefs = useRef<(HTMLIFrameElement | HTMLVideoElement | null)[]>([])
  const [loadedIframes, setLoadedIframes] = useState<Set<number>>(new Set([0]))
  const [apiOrder, setApiOrder] = useState<ApiSource[]>(DEFAULT_API_ORDER)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([])

  const [selectedGallery, setSelectedGallery] = useState<Video | null>(null)
  const [galleryImages, setGalleryImages] = useState<
    { id: string; url: string; thumbnail: string; title?: string; isGallery?: boolean; isCategory?: boolean }[]
  >([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [hoverThumbs, setHoverThumbs] = useState<{ [key: string]: number }>({})
  const hoverIntervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const touchStartRef = useRef<{ [key: string]: number }>({})
  const activeTouchRef = useRef<string | null>(null)
  
  // Custom subreddits state
  const [customSubreddits, setCustomSubreddits] = useState<{ label: string; sub: string }[]>([])
  const [showAddSubreddit, setShowAddSubreddit] = useState(false)
  const [newSubredditName, setNewSubredditName] = useState("")

  const startThumbnailPreview = (videoId: string, thumbs: Array<{ src: string }>) => {
    if (!thumbs || thumbs.length <= 1) return
    
    // Clear any existing interval for this video
    if (hoverIntervalsRef.current[videoId]) {
      clearInterval(hoverIntervalsRef.current[videoId])
    }
    
    let currentIndex = 0
    hoverIntervalsRef.current[videoId] = setInterval(() => {
      currentIndex = (currentIndex + 1) % thumbs.length
      setHoverThumbs(prev => ({ ...prev, [videoId]: currentIndex }))
    }, 500)
  }

  const stopThumbnailPreview = (videoId: string) => {
    if (hoverIntervalsRef.current[videoId]) {
      clearInterval(hoverIntervalsRef.current[videoId])
      delete hoverIntervalsRef.current[videoId]
    }
    setHoverThumbs(prev => {
      const newThumbs = { ...prev }
      delete newThumbs[videoId]
      return newThumbs
    })
  }

  const handleMouseEnter = (videoId: string, thumbs: Array<{ src: string }>) => {
    startThumbnailPreview(videoId, thumbs)
  }

  const handleMouseLeave = (videoId: string) => {
    stopThumbnailPreview(videoId)
  }

  const handleTouchStart = (videoId: string, thumbs: Array<{ src: string }>) => {
    touchStartRef.current[videoId] = Date.now()
    
    // Stop any previous touch preview
    if (activeTouchRef.current && activeTouchRef.current !== videoId) {
      stopThumbnailPreview(activeTouchRef.current)
    }
    
    // Start preview after 200ms hold
    setTimeout(() => {
      if (touchStartRef.current[videoId] && Date.now() - touchStartRef.current[videoId] >= 200) {
        activeTouchRef.current = videoId
        startThumbnailPreview(videoId, thumbs)
      }
    }, 200)
  }

  const handleTouchEnd = (videoId: string) => {
    delete touchStartRef.current[videoId]
    // Keep preview running for a moment so user can see it
    setTimeout(() => {
      if (activeTouchRef.current === videoId) {
        stopThumbnailPreview(videoId)
        activeTouchRef.current = null
      }
    }, 1500)
  }

  const loadVideos = async (query = "", category = "") => {
    setLoading(true)
    setError("")
    setPage(1)
    setHasMore(true)

    try {
      const searchParam = category || query || (apiSource === "reddit" ? "nsfw" : "popular")
      const apiEndpoint =
        apiSource === "redgifs" || apiSource === "pornpics" || apiSource === "rule34" || apiSource === "reddit"
          ? `/api/search-pictures?query=${encodeURIComponent(searchParam)}&api=${apiSource}&page=1&refresh=${refreshKey}`
          : `/api/search-videos?query=${encodeURIComponent(searchParam)}&source=${apiSource}&page=1&refresh=${refreshKey}`

      const response = await fetch(apiEndpoint)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load videos")
      }

      setVideos(data.videos || data.galleries || [])
      setHasMore((data.videos || data.galleries || []).length >= 12)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos")
      console.error("Video load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreVideos = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    const nextPage = page + 1

    try {
    const searchParam = selectedCategory || searchQuery || (apiSource === "reddit" ? "nsfw" : "popular")
    const apiEndpoint =
      apiSource === "redgifs" || apiSource === "pornpics" || apiSource === "rule34" || apiSource === "reddit"
        ? `/api/search-pictures?query=${encodeURIComponent(searchParam)}&api=${apiSource}&page=${nextPage}`
        : `/api/search-videos?query=${encodeURIComponent(searchParam)}&source=${apiSource}&page=${nextPage}`

      const response = await fetch(apiEndpoint)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load more videos")
      }

      const newVideos = data.videos || data.galleries || []
      if (newVideos.length > 0) {
        setVideos((prev) => [...prev, ...newVideos])
        setPage(nextPage)
        setHasMore(newVideos.length >= 10)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("Load more error:", err)
      setHasMore(true)
    } finally {
      setLoadingMore(false)
    }
  }

  // Go to a specific page
  const goToPage = async (targetPage: number) => {
    if (targetPage < 1 || targetPage === page || loading) return
    
    setLoading(true)
    setPage(targetPage)
    
    try {
    const searchParam = selectedCategory || searchQuery || (apiSource === "reddit" ? "nsfw" : "popular")
    const apiEndpoint =
      apiSource === "redgifs" || apiSource === "pornpics" || apiSource === "rule34" || apiSource === "reddit"
        ? `/api/search-pictures?query=${encodeURIComponent(searchParam)}&api=${apiSource}&page=${targetPage}`
        : `/api/search-videos?query=${encodeURIComponent(searchParam)}&source=${apiSource}&page=${targetPage}`

      const response = await fetch(apiEndpoint)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load page")
      }

      const newVideos = data.videos || data.galleries || []
      setVideos(newVideos)
      setHasMore(newVideos.length >= 10)
      
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error("Go to page error:", err)
      setError("Failed to load page. Please try again.")
    } finally {
      setLoading(false)
      setShowPageJump(false)
      setJumpToPage("")
    }
  }

  useEffect(() => {
    try {
      const savedOrder = safeStorage.getItem("porn_api_order")
      if (savedOrder) {
        let parsed = JSON.parse(savedOrder) as ApiSource[]
        // Remove deprecated APIs
        parsed = parsed.filter(api => api !== "jsonporn" && api !== "rule34" && api !== "pornhub") as ApiSource[]
        // Merge any new APIs that aren't in the saved order
        const missingApis = DEFAULT_API_ORDER.filter(api => !parsed.includes(api))
        if (missingApis.length > 0) {
          const mergedOrder = [...parsed, ...missingApis]
          setApiOrder(mergedOrder)
          safeStorage.setItem("porn_api_order", JSON.stringify(mergedOrder))
        } else {
          setApiOrder(parsed)
          safeStorage.setItem("porn_api_order", JSON.stringify(parsed))
        }
      }
    } catch (err) {
      console.error("Error loading API order:", err)
    }

    // Feed view is now always inline, no popup needed
    setFeedView(false)
    loadVideos()
    loadLibraryData()
    setLoadedIframes(new Set([0]))
  }, [apiSource])

// Set mounted state for portal rendering
  useEffect(() => {
  setIsMounted(true)
  }, [])
  
  // Load custom subreddits from cookies
  useEffect(() => {
    const savedSubs = cookieStorage.get("customSubreddits")
    if (savedSubs) {
      try {
        setCustomSubreddits(JSON.parse(savedSubs))
      } catch (e) {
        console.error("Failed to parse custom subreddits")
      }
    }
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAddToPlaylist || showCreatePlaylist || selectedVideo) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showAddToPlaylist, showCreatePlaylist, selectedVideo])

  useEffect(() => {
    // Popup feed view no longer used - scroll handling is inline
    return

    const handleScroll = () => {
      const container = document.querySelector(".feed-container")
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      let mostVisibleIndex = 0
      let maxVisibility = 0

      iframeRefs.current.forEach((element, idx) => {
        if (!element) return

        const elementRect = element.getBoundingClientRect()
        const elementCenter = elementRect.top + elementRect.height / 2

        const visibleTop = Math.max(0, elementRect.top)
        const visibleBottom = Math.min(containerHeight, elementRect.bottom)
        const visibleHeight = Math.max(0, visibleBottom - visibleTop)
        const visibility = visibleHeight / elementRect.height

        if (visibility > maxVisibility) {
          maxVisibility = visibility
          mostVisibleIndex = idx
        }

        const distanceFromView = Math.abs(elementCenter - containerHeight / 2)
        const shouldLoad = distanceFromView < containerHeight * 1.5

        if (shouldLoad && !loadedIframes.has(idx)) {
          setLoadedIframes((prev) => new Set(prev).add(idx))
        }
      })

      if (mostVisibleIndex !== activeVideoIndex) {
        setActiveVideoIndex(mostVisibleIndex)
        setCurrentVideoIndex(mostVisibleIndex)

// Video play/pause now handled in inline feed scroll handler

        if (apiSource === "cam4" || apiSource === "chaturbate") {
          setLoadedIframes((prev) => {
            const newLoaded = new Set<number>()
            for (let i = mostVisibleIndex - 1; i <= mostVisibleIndex + 1; i++) {
              if (i >= 0 && i < videos.length) {
                newLoaded.add(i)
              }
            }
            return newLoaded
          })
        }
      }
    }

    const container = document.querySelector(".feed-container")
    container?.addEventListener("scroll", handleScroll, { passive: true })

    handleScroll()

    return () => {
      container?.removeEventListener("scroll", handleScroll)
    }
  }, [feedView, apiSource, activeVideoIndex, loadedIframes, videos.length])

  useEffect(() => {
    const mainNav = document.querySelector("nav.fixed.bottom-4")
    const topNav = document.querySelector(".glass-nav-pill")

if (false) { // Popup feed view no longer used
      if (mainNav) (mainNav as HTMLElement).style.display = "none"
      if (topNav && topNav.parentElement?.parentElement?.classList.contains("mb-6")) {
        ;(topNav.parentElement as HTMLElement).style.display = "none"
      }
    } else {
      if (mainNav) (mainNav as HTMLElement).style.display = ""
      if (topNav && topNav.parentElement) {
        ;(topNav.parentElement as HTMLElement).style.display = ""
      }
    }

    return () => {
      if (mainNav) (mainNav as HTMLElement).style.display = ""
      if (topNav && topNav.parentElement) {
        ;(topNav.parentElement as HTMLElement).style.display = ""
      }
    }
  }, [feedView, apiSource])

  const lastVideoElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            loadMoreVideos()
          }
        },
        { threshold: 0.1 },
      )

      if (node) observerRef.current.observe(node)
    },
    [loadingMore, hasMore],
  )

  useEffect(() => {
    if (!feedView) return

    const handleFeedScroll = () => {
      const container = document.querySelector(".feed-container")
      if (!container) return

      const scrollHeight = container.scrollHeight
      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight

      if (scrollHeight - scrollTop - clientHeight < 500 && hasMore && !loadingMore) {
        loadMoreVideos()
      }
    }

    const container = document.querySelector(".feed-container")
    container?.addEventListener("scroll", handleFeedScroll, { passive: true })

    return () => {
      container?.removeEventListener("scroll", handleFeedScroll)
    }
  }, [feedView, hasMore, loadingMore])

  const loadLibraryData = () => {
    try {
      const savedPlaylistsData = safeStorage.getItem("porn_playlists")
      const savedVideosData = safeStorage.getItem("porn_saved_videos")
      const historyData = safeStorage.getItem("porn_watch_history")

      const loadedSavedVideos = savedVideosData ? JSON.parse(savedVideosData) : []
      setSavedVideos(loadedSavedVideos)
      
      if (savedPlaylistsData) {
        const loadedPlaylists = JSON.parse(savedPlaylistsData)
        // Ensure playlists have videos array (for backwards compatibility)
        const migratedPlaylists = loadedPlaylists.map((playlist: Playlist) => {
          if (playlist.videos && playlist.videos.length > 0) {
            return playlist
          }
          // Try to populate from savedVideos
          const playlistVideos = playlist.videoIds
            .map((id: string) => loadedSavedVideos.find((v: Video) => v.id === id))
            .filter(Boolean) as Video[]
          return { ...playlist, videos: playlistVideos }
        })
        setPlaylists(migratedPlaylists)
      }
      
      if (historyData) {
        setWatchHistory(JSON.parse(historyData))
      }
    } catch (err) {
      console.error("Error loading library data:", err)
    }
  }

  const saveVideo = (video: Video) => {
    try {
      const isAlreadySaved = savedVideos.some((v) => v.id === video.id)
      let updatedVideos

      if (isAlreadySaved) {
        updatedVideos = savedVideos.filter((v) => v.id !== video.id)
      } else {
        updatedVideos = [video, ...savedVideos]
      }

      setSavedVideos(updatedVideos)
      safeStorage.setItem("porn_saved_videos", JSON.stringify(updatedVideos))
    } catch (err) {
      console.error("Error saving video:", err)
    }
  }

  const addToHistory = (video: Video) => {
    try {
      const historyItem: HistoryItem = {
        video,
        watchedAt: new Date().toISOString(),
        apiSource,
      }
      const filteredHistory = watchHistory.filter((h) => h.video.id !== video.id)
      const updatedHistory = [historyItem, ...filteredHistory].slice(0, 100)
      setWatchHistory(updatedHistory)
      safeStorage.setItem("porn_watch_history", JSON.stringify(updatedHistory))
    } catch (err) {
      console.error("Error adding to history:", err)
    }
  }

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return

    try {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name: newPlaylistName,
        videoIds: [],
        videos: [],
        createdAt: new Date().toISOString(),
      }

      const updatedPlaylists = [...playlists, newPlaylist]
      setPlaylists(updatedPlaylists)
      safeStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
      setNewPlaylistName("")
      setShowCreatePlaylist(false)
    } catch (err) {
      console.error("Error creating playlist:", err)
    }
  }

  const addToPlaylist = (playlistId: string, videoToAdd: Video) => {
    try {
      const videoId = videoToAdd.id
      const playlist = playlists.find(p => p.id === playlistId)

      if (playlist && playlist.videoIds.includes(videoId)) {
        toast.error("Already in playlist", {
          description: `"${videoToAdd.title}" is already in "${playlist.name}"`,
          duration: 3000
        })
        setShowAddToPlaylist(null)
        return
      }

      // Always save the video to savedVideos so it persists across sessions
      const isAlreadySaved = savedVideos.some((v) => v.id === videoId)
      if (!isAlreadySaved) {
        const updatedSavedVideos = [...savedVideos, videoToAdd]
        setSavedVideos(updatedSavedVideos)
        safeStorage.setItem("porn_saved_videos", JSON.stringify(updatedSavedVideos))
      }

      const updatedPlaylists = playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          const currentVideos = playlist.videos || []

          return {
            ...playlist,
            videoIds: [...playlist.videoIds, videoId],
            videos: [...currentVideos, videoToAdd],
          }
        }
        return playlist
      })

      setPlaylists(updatedPlaylists)
      safeStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))

      if (playlist) {
        toast.success("Added to playlist", {
          description: `"${videoToAdd.title}" added to "${playlist.name}"`,
          duration: 2000
        })
      }

      setShowAddToPlaylist(null)
    } catch (err) {
      console.error("Error adding to playlist:", err)
      toast.error("Failed to add to playlist", {
        description: "Please try again",
        duration: 3000
      })
    }
  }

  const deletePlaylist = (playlistId: string) => {
    try {
      const updatedPlaylists = playlists.filter((p) => p.id !== playlistId)
      setPlaylists(updatedPlaylists)
      safeStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
      if (selectedPlaylist === playlistId) {
        setSelectedPlaylist(null)
      }
    } catch (err) {
      console.error("Error deleting playlist:", err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }
    await loadVideos(searchQuery)
  }

  const loadGalleryImages = async (gallery: Video) => {
    setSelectedGallery(gallery)
    setGalleryLoading(true)
    setCurrentImageIndex(0)

    try {
      const galleryId = gallery.id || ""
      const cleanId = galleryId.replace(/^\/+|\/+$/g, "")

      // Check if this is a category (from home) or a gallery (from category page)
      const isCategory = (gallery as any).isCategory
      const isGallery = (gallery as any).isGallery

      let endpointType = ""
      if (isGallery) {
        // This is a gallery within a category - fetch actual images
        endpointType = "images"
      }
      // If isCategory, we fetch sub-galleries (default behavior)

      const response = await fetch(
        `/api/search-pictures?gallery=${encodeURIComponent(cleanId)}&api=pornpics&endpointType=${endpointType}`,
      )
      const data = await response.json()

      if (data.photos && data.photos.length > 0) {
        // We have actual images
        setGalleryImages(data.photos)
      } else if (data.galleries && data.galleries.length > 0) {
        // We have sub-galleries - show them as clickable items
        setGalleryImages(
          data.galleries.map((g: any) => ({
            id: g.id || g.url,
            url: g.thumbnail || g.preview,
            thumbnail: g.thumbnail || g.preview,
            title: g.title,
            isGallery: g.isGallery,
            isCategory: g.isCategory,
          })),
        )
      } else {
        setGalleryImages([])
      }
    } catch (err) {
      setGalleryImages([])
    } finally {
      setGalleryLoading(false)
    }
  }

  const closeGallery = () => {
    setSelectedGallery(null)
    setGalleryImages([])
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const openVideo = (video: Video) => {
    addToHistory(video)

    if (apiSource === "pornpics") {
      // Open on pornpics.com - the id contains the href path like "/milf/"
      const href = video.id || video.url || ""
      window.open(`https://www.pornpics.com${href}`, "_blank")
      return
    }

    setSelectedVideo(video)
    
    // Request fullscreen and landscape orientation for better video viewing
    setTimeout(() => {
      const modalElement = document.getElementById('video-modal')
      if (modalElement) {
        try {
          if (modalElement.requestFullscreen) {
            modalElement.requestFullscreen()
          } else if ((modalElement as any).webkitRequestFullscreen) {
            (modalElement as any).webkitRequestFullscreen()
          }
          // Try to lock to landscape orientation
          if (screen.orientation && (screen.orientation as any).lock) {
            (screen.orientation as any).lock('landscape').catch(() => {})
          }
        } catch (e) {
          // Fullscreen not supported or blocked
        }
      }
    }, 100)
  }

  const closeVideo = () => {
    setSelectedVideo(null)
    // Exit fullscreen when closing video
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen()
      }
      // Unlock orientation
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock()
      }
    } catch (e) {
      // Fullscreen exit not supported
    }
  }

  const isVideoSaved = (videoId: string) => {
    return savedVideos.some((v) => v.id === videoId)
  }

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category)
    setShowCategories(false)
    await loadVideos("", category)
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    loadVideos()
  }

  const handleShare = async (video: Video) => {
    const shareData = {
      title: video.title,
      url: video.url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(video.url)
        alert("Link copied to clipboard!")
      }
    } catch (err) {
      // Share failed silently
    }
  }

  const handleDownload = async (video: Video) => {
    try {
      // Get the actual video URL - Reddit stores it in videoUrl property
      const mediaUrl = (video as any).videoUrl || video.url || video.embed
      if (!mediaUrl) return

      // Check if it's a downloadable video (not an iframe embed like redgifs.com/watch)
      const isDirectVideo = mediaUrl.includes(".mp4") || 
                           mediaUrl.includes(".webm") || 
                           mediaUrl.includes("v.redd.it") ||
                           mediaUrl.includes(".m3u8")
      
      // For Reddit and RedGifs direct videos, use the proxy to download
      const needsProxy = mediaUrl.includes("redd.it") || 
                        mediaUrl.includes("redgifs.com") ||
                        mediaUrl.includes("imgur.com")
      
      if (!isDirectVideo) {
        // Can't download iframe embeds, open in new tab instead
        window.open(mediaUrl, "_blank")
        return
      }

      const downloadUrl = needsProxy
        ? `/api/proxy-media?url=${encodeURIComponent(mediaUrl)}&download=true`
        : mediaUrl

      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        throw new Error("Download failed")
      }
      
      const blob = await response.blob()
      
      // Determine file extension
      const contentType = response.headers.get("content-type") || ""
      let extension = ".mp4"
      if (contentType.includes("webm")) extension = ".webm"
      else if (contentType.includes("gif")) extension = ".gif"
      else if (mediaUrl.includes(".webm")) extension = ".webm"
      else if (mediaUrl.includes(".gif")) extension = ".gif"
      
      // Sanitize filename
      const filename = (video.title || video.id || "video")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 50)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      // Fallback: open in new tab
      const fallbackUrl = (video as any).videoUrl || video.url || video.embed
      if (fallbackUrl) {
        window.open(fallbackUrl, "_blank")
      }
    }
  }

const getVideoUrl = (url: string) => {
  if (!url) return ""
  // Proxy RedGifs URLs to handle CORS
  if (apiSource === "redgifs" && url.includes("redgifs.com")) {
    return `/api/proxy-media?url=${encodeURIComponent(url)}`
  }
  // Rule34 and other URLs are direct
  return url
}

const getEmbedUrl = (video: Video, quality?: string) => {
  let embedUrl = video.embed
  const isRedTube = embedUrl?.includes("redtube.com")
  
  // Add quality parameter based on API source
  if (quality && quality !== "auto") {
    const qualityNum = quality.replace('p', '')
    
    // EPorner embed format
    if (embedUrl.includes("eporner.com")) {
      embedUrl = embedUrl.includes('?') 
        ? `${embedUrl}&quality=${qualityNum}` 
        : `${embedUrl}?quality=${qualityNum}`
    }
    // XVideos/XvidAPI embed format
    else if (embedUrl.includes("xvideos.com") || embedUrl.includes("flashservice")) {
      embedUrl = embedUrl.includes('?') 
        ? `${embedUrl}&q=${qualityNum}p` 
        : `${embedUrl}?q=${qualityNum}p`
    }
    // Pornhub embed format
    else if (embedUrl.includes("pornhub.com")) {
      embedUrl = embedUrl.includes('?') 
        ? `${embedUrl}&quality=${qualityNum}` 
        : `${embedUrl}?quality=${qualityNum}`
    }
    // RedTube embed format
    else if (isRedTube) {
      embedUrl = embedUrl.includes('?')
        ? `${embedUrl}&quality=${qualityNum}`
        : `${embedUrl}?quality=${qualityNum}`
    }
    // YouPorn embed format
    else if (embedUrl.includes("youporn.com")) {
      embedUrl = embedUrl.includes('?') 
        ? `${embedUrl}&quality=${qualityNum}` 
        : `${embedUrl}?quality=${qualityNum}`
    }
  }
  
  // RedTube embed.redtube.com blocks embedding from external origins
  // Route through our proxy which fetches the embed code via API and serves it properly
  if (isRedTube) {
    const idMatch = embedUrl.match(/[?&]id=(\d+)/) || embedUrl.match(/redtube\.com\/(\d+)/)
    const videoId = idMatch?.[1]
    if (videoId) {
      embedUrl = `/api/redtube-player?id=${videoId}&autoplay=1`
    }
  }
  
  // Add autoplay parameter to all embed URLs
  if (embedUrl && !embedUrl.includes('/api/')) {
    const separator = embedUrl.includes('?') ? '&' : '?'
    embedUrl = `${embedUrl}${separator}autoplay=1&muted=0`
  }
  
  return embedUrl
}

  return (
    <div className="space-y-6 pb-24">
      {/* API Source Selector */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="glass-nav-pill inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/80 p-1.5 shadow-lg backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/80">
          {apiOrder.map((api) => (
            <button
              key={api}
              onClick={() => setApiSource(api)}
              className={`nav-item whitespace-nowrap ${apiSource === api ? "active" : ""}`}
            >
              <span className="nav-label">
                {api === "redgifs"
                  ? "RedGifs"
                  : api === "eporner"
                    ? "EPorner"
                    : api === "xvidapi"
                      ? "XvidAPI"
                      : api === "cam4"
                        ? "Cam4"
                        : api === "pornpics"
                          ? "PornPics"
                          : api === "chaturbate"
                            ? "Chaturbate"
                            : api === "redtube"
                              ? "Redtube"
                              : api === "hentai"
                                ? "Anime"
                                : api === "rule34"
                                  ? "Rule34"
                                  : api === "youporn"
                                    ? "YouPorn"
                                    : api === "reddit"
                                      ? "Reddit"
                                      : api}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reddit Quick Navigation */}
      {apiSource === "reddit" && (
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="inline-flex items-center gap-2 py-1">
            {/* Add custom subreddit button */}
            <button
              onClick={() => setShowAddSubreddit(true)}
              className="flex items-center justify-center whitespace-nowrap rounded-full bg-orange-500/20 px-3 py-1.5 text-sm font-medium text-orange-400 transition-all hover:bg-orange-500/30 border border-orange-500/30"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            {/* Custom subreddits */}
            {customSubreddits.map((item) => (
              <div key={`custom-${item.sub}`} className="group relative">
                <button
                  onClick={() => {
                    setSearchQuery(item.sub)
                    loadVideos(item.sub)
                  }}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    searchQuery === item.sub
                      ? "bg-orange-500 text-white"
                      : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 hover:text-white border border-orange-500/30"
                  }`}
                >
                  {item.label}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const updated = customSubreddits.filter(s => s.sub !== item.sub)
                    setCustomSubreddits(updated)
                    cookieStorage.set("customSubreddits", JSON.stringify(updated))
                  }}
                  className="absolute -right-1 -top-1 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {/* Preset subreddits */}
            {[
              { label: "r/nsfw", sub: "nsfw" },
              { label: "r/gonewild", sub: "gonewild" },
              { label: "r/RealGirls", sub: "RealGirls" },
              { label: "r/Amateur", sub: "amateur" },
              { label: "r/NSFW_GIF", sub: "nsfw_gif" },
              { label: "r/porn", sub: "porn" },
              { label: "r/LegalTeens", sub: "LegalTeens" },
              { label: "r/collegesluts", sub: "collegesluts" },
              { label: "r/Boobies", sub: "Boobies" },
              { label: "r/ass", sub: "ass" },
              { label: "r/pawg", sub: "pawg" },
              { label: "r/thick", sub: "thick" },
              { label: "r/milf", sub: "milf" },
              { label: "r/Asian_Hotties", sub: "Asian_Hotties" },
              { label: "r/latinas", sub: "latinas" },
              { label: "r/ebony", sub: "ebony" },
              { label: "r/cumsluts", sub: "cumsluts" },
              { label: "r/nsfw_videos", sub: "nsfw_videos" },
            ].map((item) => (
              <button
                key={item.sub}
                onClick={() => {
                  setSearchQuery(item.sub)
                  loadVideos(item.sub)
                }}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  searchQuery === item.sub
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Add Custom Subreddit Modal */}
      {showAddSubreddit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowAddSubreddit(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-white">Add Custom Subreddit</h3>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-slate-600 bg-slate-700/50 px-3">
                <span className="text-slate-400">r/</span>
                <input
                  type="text"
                  placeholder="subreddit name"
                  value={newSubredditName}
                  onChange={(e) => setNewSubredditName(e.target.value.replace(/\s/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubredditName.trim()) {
                      const sub = newSubredditName.trim()
                      const newSub = { label: `r/${sub}`, sub }
                      const updated = [...customSubreddits, newSub]
                      setCustomSubreddits(updated)
                      cookieStorage.set("customSubreddits", JSON.stringify(updated))
                      setNewSubredditName("")
                      setShowAddSubreddit(false)
                      setSearchQuery(sub)
                      loadVideos(sub)
                    }
                  }}
                  className="flex-1 bg-transparent py-2 text-white outline-none placeholder:text-slate-500"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => {
                  if (newSubredditName.trim()) {
                    const sub = newSubredditName.trim()
                    const newSub = { label: `r/${sub}`, sub }
                    const updated = [...customSubreddits, newSub]
                    setCustomSubreddits(updated)
                    cookieStorage.set("customSubreddits", JSON.stringify(updated))
                    setNewSubredditName("")
                    setShowAddSubreddit(false)
                    setSearchQuery(sub)
                    loadVideos(sub)
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Add
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Enter the subreddit name without the r/ prefix. It will be saved for quick access.
            </p>
          </div>
        </div>
      )}

      {/* Search Bar - hidden for Reddit since we use quick nav */}
      {apiSource !== "reddit" && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-400"
          />
          <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700">
            <Search className="h-5 w-5" />
          </Button>
          {apiSource === "xvidapi" && (
            <Button
              onClick={() => setShowCategories(true)}
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* Inline Feed View for Reddit, RedGifs, Cam4, Chaturbate */}
      {(apiSource === "reddit" || apiSource === "redgifs" || apiSource === "cam4" || apiSource === "chaturbate") && videos.length > 0 && !loading ? (
        <div className="relative -mx-4 sm:-mx-6">
          <div 
            className="feed-container h-[calc(100vh-200px)] w-full snap-y snap-mandatory overflow-y-scroll"
            ref={(el) => {
              if (el) {
                el.addEventListener('scroll', () => {
                  const scrollTop = el.scrollTop
                  const itemHeight = el.clientHeight
                  const newIndex = Math.round(scrollTop / itemHeight)
                  if (newIndex !== currentVideoIndex) {
                    setCurrentVideoIndex(newIndex)
                    setActiveVideoIndex(newIndex)
                    // Handle video play/pause
                    iframeRefs.current.forEach((element, idx) => {
                      if (element && element instanceof HTMLVideoElement) {
                        if (idx === newIndex) {
                          element.play().catch(() => {})
                        } else {
                          element.pause()
                        }
                      }
                    })
                  }
                  // Preload next items
                  for (let i = Math.max(0, newIndex - 1); i <= Math.min(videos.length - 1, newIndex + 2); i++) {
                    setLoadedIframes(prev => new Set(prev).add(i))
                  }
                  // Load more when near end
                  if (newIndex >= videos.length - 3 && !loadingMore && hasMore) {
                    loadMoreVideos()
                  }
                })
              }
            }}
          >
            {videos.map((video, index) => (
              <div key={`${video.id}-${index}`} className="relative h-[calc(100vh-200px)] w-full snap-start snap-always bg-black">
                {(() => {
                  // Handle different API sources
                  if (apiSource === "redgifs") {
                    return (
                      <video
                        ref={(el) => {
                          iframeRefs.current[index] = el as any
                        }}
                        src={getVideoUrl(video.url || video.embed)}
                        poster={video.thumbnail || ""}
                        preload={Math.abs(index - currentVideoIndex) <= 1 ? "auto" : "none"}
                        loop
                        playsInline
                        controls
                        muted={index !== activeVideoIndex}
                        autoPlay={index === activeVideoIndex}
                        className="h-full w-full object-contain bg-black"
                      />
                    )
                  } else if (apiSource === "cam4" || apiSource === "chaturbate") {
                    // Live cam iframe embed
                    return loadedIframes.has(index) ? (
                      <iframe
                        ref={(el) => {
                          iframeRefs.current[index] = el
                        }}
                        src={getEmbedUrl(video, selectedQuality)}
                        className="h-full w-full"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay"
                        title={video.title}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                      </div>
                    )
                  } else {
                    // Reddit content
                    const videoUrl = (video as any).videoUrl
                    const isEmbeddedVideo = videoUrl && (videoUrl.includes("redgifs.com") || videoUrl.includes("gfycat.com"))
                    const isDirectVideo = videoUrl && (videoUrl.includes(".mp4") || videoUrl.includes(".webm") || videoUrl.includes("v.redd.it"))
                    const isHlsVideo = videoUrl && videoUrl.includes(".m3u8")
                    
                    if (isEmbeddedVideo) {
                      return (
                        <iframe
                          ref={(el) => {
                            iframeRefs.current[index] = el
                          }}
                          src={videoUrl}
                          className="h-full w-full"
                          frameBorder="0"
                          allowFullScreen
                          allow="autoplay"
                          title={video.title}
                        />
                      )
                    } else if (isDirectVideo || isHlsVideo) {
                      return (
                        <video
                          ref={(el) => {
                            iframeRefs.current[index] = el as any
                          }}
                          src={videoUrl}
                          poster={video.thumbnail || (video as any).preview || ""}
                          preload={Math.abs(index - currentVideoIndex) <= 1 ? "auto" : "none"}
                          loop
                          playsInline
                          controls
                          muted={index !== activeVideoIndex}
                          autoPlay={index === activeVideoIndex}
                          className="h-full w-full object-contain bg-black"
                          crossOrigin="anonymous"
                        />
                      )
                    } else {
                      return (
                        <div className="relative h-full w-full flex items-center justify-center bg-black">
                          <img
                            src={video.url || (video as any).preview || video.thumbnail || ""}
                            alt={video.title}
                            className="max-h-full max-w-full object-contain"
                            loading={Math.abs(index - currentVideoIndex) <= 2 ? "eager" : "lazy"}
                          />
                        </div>
                      )
                    }
                  }
                })()}
                
                {/* Post info overlay */}
                <div className="absolute bottom-20 left-4 right-16 text-white pointer-events-none">
                  <h3 className="text-lg font-semibold drop-shadow-lg line-clamp-2">{video.title}</h3>
                  {apiSource === "reddit" && (video as any).subreddit && (
                    <p className="text-sm opacity-80 mt-1">
                      r/{(video as any).subreddit}
                      {(video as any).score > 0 && ` • ${(video as any).score.toLocaleString()} upvotes`}
                    </p>
                  )}
                  {(apiSource === "cam4" || apiSource === "chaturbate") && video.views > 0 && (
                    <p className="text-sm opacity-80 mt-1">{video.views.toLocaleString()} viewers</p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="absolute bottom-20 right-4 flex flex-col gap-4">
                  <button onClick={() => saveVideo(video)} className="flex flex-col items-center gap-1">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                      {isVideoSaved(video.id) ? (
                        <BookmarkCheck className="h-6 w-6 text-violet-400" />
                      ) : (
                        <Bookmark className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-white">Save</span>
                  </button>
                  
                  <button onClick={() => handleShare(video)} className="flex flex-col items-center gap-1">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-white">Share</span>
                  </button>
                  
                  <button onClick={() => handleDownload(video)} className="flex flex-col items-center gap-1">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-white">Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {loadingMore && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 p-4 text-center text-red-500">{error}</div>
      ) : videos.length === 0 ? (
        <div className="rounded-lg bg-slate-800/50 p-8 text-center text-slate-400">
          No videos found. Try a different search term.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white sm:text-3xl m3-page-enter">
              {selectedCategory || searchQuery || "Hottest New Videos"}
            </h2>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white m3-button"
              disabled={loading}
            >
              <svg
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 m3-stagger">
            {videos.map((video, index) => {
              const isLast = index === videos.length - 1

              return (
                <div
                  key={`${video.id}-${index}`}
                  ref={isLast ? lastVideoElementRef : null}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-slate-800/50 m3-card"
                  onClick={() => openVideo(video)}
                  onMouseEnter={() => handleMouseEnter(video.id, video.thumbs || [])}
                  onMouseLeave={() => handleMouseLeave(video.id)}
                  onTouchStart={() => handleTouchStart(video.id, video.thumbs || [])}
                  onTouchEnd={() => handleTouchEnd(video.id)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={
                        hoverThumbs[video.id] !== undefined && video.thumbs?.length > 0
                          ? video.thumbs[hoverThumbs[video.id]]?.src
                          : video.default_thumb?.src || video.thumbnail || "/placeholder.svg"
                      }
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    {(video.length_min && video.length_min !== "Unknown" || video.length_sec > 0) && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        {video.length_min && video.length_min !== "Unknown" 
                          ? video.length_min 
                          : `${Math.floor(video.length_sec / 60)}:${String(video.length_sec % 60).padStart(2, '0')}`}
                      </div>
                    )}
                    {(apiSource === "cam4" || apiSource === "chaturbate") && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        LIVE
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        saveVideo(video)
                      }}
                      className="absolute top-2 right-2 rounded-full bg-black/50 p-2 opacity-100"
                    >
                      {isVideoSaved(video.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-violet-400" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setShowAddToPlaylist(video)
                      }}
                      className="absolute top-2 right-12 rounded-full bg-black/50 p-2 opacity-100"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-medium text-white">{video.title}</h3>
                    {video.views > 0 && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views.toLocaleString()}
                        </span>
                        {video.rate > 0 && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {video.rate}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          )}

          {/* Pagination Controls */}
          {videos.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <Pagination>
                <PaginationContent className="flex-wrap justify-center gap-1">
                  {/* First Page */}
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToPage(1)}
                      disabled={page === 1 || loading}
                      className="h-9 w-9 text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => goToPage(page - 1)}
                      className={`${page === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"} text-slate-400 hover:text-white`}
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {page > 2 && (
                    <PaginationItem className="hidden sm:block">
                      <PaginationEllipsis className="text-slate-400" />
                    </PaginationItem>
                  )}
                  
                  {[page - 1, page, page + 1].filter(p => p >= 1).map(p => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => goToPage(p)}
                        isActive={p === page}
                        className={`cursor-pointer ${p === page ? "bg-violet-600 text-white hover:bg-violet-700" : "text-slate-400 hover:text-white"}`}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {hasMore && (
                    <PaginationItem className="hidden sm:block">
                      <PaginationEllipsis className="text-slate-400" />
                    </PaginationItem>
                  )}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => goToPage(page + 1)}
                      className={`${!hasMore || loading ? "pointer-events-none opacity-50" : "cursor-pointer"} text-slate-400 hover:text-white`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              {/* Jump to Page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPageJump(!showPageJump)}
                  className="text-xs border-slate-700 bg-transparent text-slate-400 hover:text-white"
                >
                  Go to page
                </Button>
              </div>

              {showPageJump && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Page #"
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const targetPage = parseInt(jumpToPage)
                        if (targetPage >= 1) goToPage(targetPage)
                      }
                    }}
                    className="w-24 border-slate-700 bg-slate-800 text-white text-center"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const targetPage = parseInt(jumpToPage)
                      if (targetPage >= 1) goToPage(targetPage)
                    }}
                    disabled={!jumpToPage || parseInt(jumpToPage) < 1}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Go
                  </Button>
                </div>
              )}

              {/* Load More Button as alternative */}
              {hasMore && (
                <Button
                  onClick={loadMoreVideos}
                  disabled={loadingMore}
                  variant="outline"
                  className="border-slate-700 bg-transparent text-slate-400 hover:text-white"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Add to Playlist Modal - Using Portal */}
      {isMounted && showAddToPlaylist && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAddToPlaylist(null)}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add to Playlist</h3>
              <button onClick={() => setShowAddToPlaylist(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playlists.length === 0 ? (
                <p className="text-center text-slate-400 py-4">No playlists yet. Create one below!</p>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => showAddToPlaylist && addToPlaylist(playlist.id, showAddToPlaylist)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-left transition-colors hover:bg-slate-700"
                  >
                    <span className="text-white">{playlist.name}</span>
                    <span className="ml-2 text-sm text-slate-400">({playlist.videoIds.length} videos)</span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setShowAddToPlaylist(null)
                setShowCreatePlaylist(true)
              }}
              className="mt-4 w-full rounded-lg bg-violet-600 p-3 text-white transition-colors hover:bg-violet-700"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Create New Playlist
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Create Playlist Modal - Using Portal */}
      {isMounted && showCreatePlaylist && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreatePlaylist(false)}
        >
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Create New Playlist</h3>
            <Input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="mb-4 border-slate-700 bg-slate-800 text-white"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowCreatePlaylist(false)} variant="outline" className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={createPlaylist} className="flex-1 bg-violet-600 hover:bg-violet-700">
                Create
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PornPics Gallery Viewer */}
      {selectedGallery && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Close button */}
          <button
            onClick={closeGallery}
            className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Gallery title */}
          <div className="absolute left-4 top-4 z-50 max-w-[60%]">
            <h3 className="truncate text-lg font-bold text-white">{selectedGallery.title}</h3>
            {galleryImages.length > 0 && !galleryImages[0]?.isGallery && !galleryImages[0]?.isCategory && (
              <p className="text-sm text-white/70">
                {currentImageIndex + 1} / {galleryImages.length}
              </p>
            )}
          </div>

          {galleryLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
              <p className="text-white">Loading...</p>
            </div>
          ) : galleryImages.length > 0 ? (
            galleryImages[0]?.isGallery || galleryImages[0]?.isCategory ? (
              // Grid view for sub-galleries
              <div className="flex-1 overflow-y-auto p-4 pt-16">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {galleryImages.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => {
                        // Load this sub-gallery's images
                        loadGalleryImages({
                          id: item.id,
                          title: item.title || "Gallery",
                          url: item.url || "",
                          isGallery: true,
                        } as Video)
                      }}
                      className="group relative aspect-[3/4] overflow-hidden rounded-lg"
                    >
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.title || `Gallery ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="truncate text-sm font-medium text-white">{item.title || `Gallery ${idx + 1}`}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Full-screen image viewer for actual images
              <>
                <div className="relative flex-1 flex items-center justify-center p-4 pt-16">
                  <img
                    src={galleryImages[currentImageIndex]?.url || galleryImages[currentImageIndex]?.thumbnail}
                    alt={`Image ${currentImageIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                    onClick={nextImage}
                  />
                </div>

                {/* Navigation buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                  </>
                )}

                {/* Thumbnail strip at bottom */}
                <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3 bg-black/50">
                  {galleryImages.slice(0, 10).map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        idx === currentImageIndex
                          ? "border-purple-500 scale-110"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img.thumbnail || img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  {galleryImages.length > 10 && (
                    <span className="flex items-center text-sm text-white/70">+{galleryImages.length - 10}</span>
                  )}
                </div>
              </>
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-white">
              <p>No images found in this gallery</p>
              <button
                onClick={() => window.open(selectedGallery.url, "_blank")}
                className="rounded-lg bg-purple-600 px-4 py-2 hover:bg-purple-700"
              >
                Open on PornPics
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video Modal - using portal to render above nav */}
      {selectedVideo && isMounted && createPortal(
        <div 
          id="video-modal"
          className="fixed inset-0 z-[9999] flex flex-col bg-black"
        >
          {/* Header - compact for more video space */}
          <div className="flex items-center justify-between p-2 bg-black/80">
            <h2 className="text-sm font-medium text-white line-clamp-1 flex-1 mr-2">{selectedVideo.title}</h2>
            <div className="flex items-center gap-1">
              {/* Quality Selector */}
              {!selectedVideo.isImage && !selectedVideo.url?.endsWith('.gif') && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="rounded-full bg-white/10 p-1.5 hover:bg-white/20 flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4 text-white" />
                    <span className="text-xs text-white">{selectedQuality}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50 overflow-hidden">
                      <div className="p-1">
                        <p className="px-2 py-1 text-xs text-slate-400">Quality</p>
                        {["auto", "1080p", "720p", "480p", "360p", "240p"].map((quality) => (
                          <button
                            key={quality}
                            onClick={() => {
                              setSelectedQuality(quality)
                              setShowQualityMenu(false)
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-slate-800 ${
                              selectedQuality === quality ? "text-violet-400" : "text-white"
                            }`}
                          >
                            <span>{quality === "auto" ? "Auto" : quality}</span>
                            {selectedQuality === quality && <Check className="h-3 w-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => handleShare(selectedVideo)}
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                title="Share"
              >
                <Share2 className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => handleDownload(selectedVideo)}
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                title="Download"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
              <button onClick={() => { closeVideo(); setShowQualityMenu(false); }} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          {/* Video container - fills remaining space */}
          <div className="flex-1 w-full overflow-hidden bg-black flex items-center justify-center relative" onClick={() => setShowQualityMenu(false)}>
            {selectedVideo.isImage ? (
              <img
                src={selectedVideo.fullImage || selectedVideo.sampleImage || selectedVideo.url}
                alt={selectedVideo.title}
                className="max-h-full max-w-full object-contain"
              />
            ) : selectedVideo.url?.endsWith('.gif') ? (
              <img
                src={selectedVideo.url || "/placeholder.svg"}
                alt={selectedVideo.title}
                className="max-h-full max-w-full object-contain"
              />
            ) : apiSource === "redgifs" || apiSource === "rule34" || selectedVideo.url?.includes("redgifs") || selectedVideo.url?.endsWith(".mp4") || selectedVideo.url?.endsWith(".webm") ? (
              <video
                src={selectedVideo.url || selectedVideo.embed}
                poster={selectedVideo.thumbnail || ""}
                preload="auto"
                controls
                autoPlay
                loop
                playsInline
                className="h-full w-full object-contain"
              />
              ) : apiSource === "xvidapi" ? (
                // xvidapi - always use embed (upload18.net player)
                selectedVideo.embed ? (
                  <iframe
                    src={selectedVideo.embed}
                    className="h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                    title={selectedVideo.title}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900">
                    <p className="text-white">Video not available</p>
                  </div>
                )
              ) : (
                <iframe
                  src={getEmbedUrl(selectedVideo, selectedQuality)}
                  className="h-full w-full border-0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                  title={selectedVideo.title}
                />
              )}
          </div>
        </div>,
        document.body
      )}

      {/* Categories Modal */}
      {showCategories && (
        <div className="fixed inset-0 z-50 bg-black/95 p-4 overflow-y-auto">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-4xl font-bold text-violet-400">Categories</h2>
              <button
                onClick={() => setShowCategories(false)}
                className="rounded-full p-2 text-white hover:bg-white/10"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {XVIDAPI_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="rounded-lg px-4 py-3 text-left text-lg text-white transition-colors hover:bg-slate-800"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PornLibrary() {
  const [savedVideos, setSavedVideos] = useState<Video[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"saved" | "playlists" | "history">("playlists")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  useEffect(() => {
    loadLibraryData()
  }, [])

  const loadLibraryData = () => {
    try {
      const savedVideosData = safeStorage.getItem("porn_saved_videos")
      const savedPlaylistsData = safeStorage.getItem("porn_playlists")
      const historyData = safeStorage.getItem("porn_watch_history")

      const loadedSavedVideos = savedVideosData ? JSON.parse(savedVideosData) : []
      setSavedVideos(loadedSavedVideos)
      
      if (savedPlaylistsData) {
        const loadedPlaylists = JSON.parse(savedPlaylistsData)
        
        // Ensure all playlists have videos array populated
        const migratedPlaylists = loadedPlaylists.map((playlist: Playlist) => {
          // If playlist already has videos array with content, use it
          if (playlist.videos && playlist.videos.length > 0) {
            return playlist
          }
          // Otherwise, try to populate videos from savedVideos using videoIds
          const playlistVideos = (playlist.videoIds || [])
            .map((id: string) => loadedSavedVideos.find((v: Video) => v.id === id))
            .filter(Boolean) as Video[]
          return {
            ...playlist,
            videos: playlistVideos
          }
        })
        setPlaylists(migratedPlaylists)
      }
      
      if (historyData) setWatchHistory(JSON.parse(historyData))
    } catch (err) {
      console.error("Error loading library data:", err)
    }
  }

  const removeVideo = (videoId: string) => {
    const updatedVideos = savedVideos.filter((v) => v.id !== videoId)
    setSavedVideos(updatedVideos)
    safeStorage.setItem("porn_saved_videos", JSON.stringify(updatedVideos))
  }

  const deletePlaylist = (playlistId: string) => {
    const updatedPlaylists = playlists.filter((p) => p.id !== playlistId)
    setPlaylists(updatedPlaylists)
    safeStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
    if (selectedPlaylist === playlistId) setSelectedPlaylist(null)
  }

  const clearHistory = () => {
    setWatchHistory([])
    safeStorage.removeItem("porn_watch_history")
  }

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      videoIds: [],
      videos: [],
      createdAt: new Date().toISOString(),
    }

    const updatedPlaylists = [...playlists, newPlaylist]
    setPlaylists(updatedPlaylists)
    safeStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
    setNewPlaylistName("")
    setShowCreatePlaylist(false)
  }

  const getPlaylistVideos = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return []
    // Return videos stored directly in the playlist, or fallback to filtering savedVideos
    if (playlist.videos && playlist.videos.length > 0) {
      return playlist.videos
    }
    return savedVideos.filter((v) => playlist.videoIds.includes(v.id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }

  const closeVideo = () => {
    setSelectedVideo(null)
  }

  const displayVideos = selectedPlaylist
    ? getPlaylistVideos(selectedPlaylist)
    : activeTab === "history"
      ? watchHistory.map((h) => h.video)
      : savedVideos

  return (
    <div className="space-y-6 pb-24 m3-page-enter">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Library</h2>
        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-2 transition-colors ${
              viewMode === "list" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-2 transition-colors ${
              viewMode === "grid" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => {
            setActiveTab("playlists")
            setSelectedPlaylist(null)
          }}
          className={`rounded-full p-3 transition-colors m3-button m3-ripple ${
            activeTab === "playlists" && !selectedPlaylist
              ? "bg-violet-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          title="Playlists"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setActiveTab("saved")
            setSelectedPlaylist(null)
          }}
          className={`rounded-full p-3 transition-colors m3-button m3-ripple ${
            activeTab === "saved" && !selectedPlaylist
              ? "bg-violet-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          title="Saved"
        >
          <Bookmark className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setActiveTab("history")
            setSelectedPlaylist(null)
          }}
          className={`rounded-full p-3 transition-colors m3-button m3-ripple ${
            activeTab === "history" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          title="History"
        >
          <History className="h-5 w-5" />
        </button>
      </div>

      {/* Playlist List */}
      {activeTab === "playlists" && !selectedPlaylist && (
        <div className="space-y-3 m3-stagger">
          <button
            onClick={() => setShowCreatePlaylist(true)}
            className="w-full rounded-lg border-2 border-dashed border-slate-700 p-6 text-center text-slate-400 transition-colors hover:border-violet-500 hover:text-violet-400 m3-card"
          >
            <Plus className="mx-auto mb-2 h-8 w-8" />
            Create New Playlist
          </button>
          {playlists.map((playlist) => (
            <div key={playlist.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-4 m3-card">
              <button onClick={() => setSelectedPlaylist(playlist.id)} className="flex-1 text-left">
                <h3 className="font-medium text-white">{playlist.name}</h3>
                <p className="text-sm text-slate-400">{playlist.videoIds.length} videos</p>
              </button>
              <button
                onClick={() => deletePlaylist(playlist.id)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-700 hover:text-red-400"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History Header with Clear Button */}
      {activeTab === "history" && watchHistory.length > 0 && (
        <div className="flex justify-end">
          <button onClick={clearHistory} className="text-sm text-red-400 hover:text-red-300">
            Clear History
          </button>
        </div>
      )}

      {/* Selected Playlist Header */}
      {selectedPlaylist && (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedPlaylist(null)} className="text-violet-400 hover:text-violet-300">
            ← Back
          </button>
          <h3 className="text-lg font-medium text-white">{playlists.find((p) => p.id === selectedPlaylist)?.name}</h3>
        </div>
      )}

      {/* Video Count */}
      {(activeTab === "saved" || selectedPlaylist || activeTab === "history") && displayVideos.length > 0 && (
        <p className="text-sm text-slate-400">{displayVideos.length} video{displayVideos.length !== 1 ? 's' : ''}</p>
      )}

      {/* Video Grid/List */}
      {(activeTab === "saved" || selectedPlaylist || activeTab === "history") &&
        (displayVideos.length === 0 ? (
          <div className="rounded-lg bg-slate-800/50 p-8 text-center text-slate-400">
            {activeTab === "history" ? "No watch history yet" : "No saved videos yet"}
          </div>
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-2 gap-3" 
              : "flex flex-col gap-4"
          }>
            {displayVideos.map((video, index) => (
              viewMode === "grid" ? (
                /* Grid View - 2 columns side by side */
                <div
                  key={`${video.id}-${index}`}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-slate-800/50"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={video.default_thumb?.src || video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    {(video.length_min && video.length_min !== "Unknown" || video.length_sec > 0) && (
                      <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        {video.length_min && video.length_min !== "Unknown" 
                          ? video.length_min 
                          : `${Math.floor(video.length_sec / 60)}:${String(video.length_sec % 60).padStart(2, '0')}`}
                      </div>
                    )}
                    {activeTab !== "history" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeVideo(video.id)
                        }}
                        className="absolute top-1 right-1 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    <h3 className="line-clamp-2 text-xs font-medium text-white">{video.title}</h3>
                    {activeTab === "history" && watchHistory[index] && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(watchHistory[index].watchedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* List View - Full width cards */
                <div
                  key={`${video.id}-${index}`}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-slate-800/50 flex gap-3"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative w-40 shrink-0 aspect-video overflow-hidden rounded-l-xl">
                    <img
                      src={video.default_thumb?.src || video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    {(video.length_min && video.length_min !== "Unknown" || video.length_sec > 0) && (
                      <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        {video.length_min && video.length_min !== "Unknown" 
                          ? video.length_min 
                          : `${Math.floor(video.length_sec / 60)}:${String(video.length_sec % 60).padStart(2, '0')}`}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 py-2 pr-2 flex flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-medium text-white">{video.title}</h3>
                      {activeTab === "history" && watchHistory[index] && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDate(watchHistory[index].watchedAt)}
                        </p>
                      )}
                    </div>
                    {activeTab !== "history" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeVideo(video.id)
                        }}
                        className="self-end rounded-full bg-slate-700/50 p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        ))}
      {/* Video Modal */}
      {selectedVideo && (
        <div 
          id="video-modal-library"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between p-2 bg-black/80">
            <h2 className="text-sm font-medium text-white line-clamp-1 flex-1 mr-2">{selectedVideo.title}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const videoUrl = selectedVideo.url || selectedVideo.embed
                    if (!videoUrl) return
                    const downloadUrl = videoUrl.includes("redgifs.com")
                      ? `/api/proxy-media?url=${encodeURIComponent(videoUrl)}&download=true`
                      : videoUrl
                    const response = await fetch(downloadUrl)
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${selectedVideo.title || selectedVideo.id || "video"}.mp4`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                  } catch (err) {
                    window.open(selectedVideo.url || selectedVideo.embed, "_blank")
                  }
                }}
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                title="Download"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
              <button onClick={closeVideo} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full overflow-hidden bg-black flex items-center justify-center">
            <iframe
              src={selectedVideo.embed}
              className="h-full w-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen"
              title={selectedVideo.title}
            />
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Create New Playlist</h3>
            <Input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="mb-4 border-slate-700 bg-slate-800 text-white"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowCreatePlaylist(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={createPlaylist} className="flex-1 bg-violet-600 hover:bg-violet-700">
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
