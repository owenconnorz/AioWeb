"use client"
import { useState, useEffect, useRef, useCallback } from "react"
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
} from "lucide-react"

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
}

interface Playlist {
  id: string
  name: string
  videoIds: string[]
  createdAt: string
}

interface HistoryItem {
  video: Video
  watchedAt: string
  apiSource: string
}

type ApiSource = "redgifs" | "eporner" | "xvidapi" | "cam4" | "pornpics" | "chaturbate" | "redtube"

const DEFAULT_API_ORDER: ApiSource[] = ["xvidapi", "eporner", "redgifs", "cam4", "pornpics", "chaturbate", "redtube"]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [apiSource, setApiSource] = useState<ApiSource>("xvidapi")
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [savedVideos, setSavedVideos] = useState<Video[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
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
      const searchParam = category || query || "popular"
      const apiEndpoint =
        apiSource === "redgifs" || apiSource === "pornpics"
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
      const searchParam = selectedCategory || searchQuery || "popular"
      const apiEndpoint =
        apiSource === "redgifs" || apiSource === "pornpics"
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

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("porn_api_order")
      if (savedOrder) {
        setApiOrder(JSON.parse(savedOrder))
      }
    } catch (err) {
      console.error("Error loading API order:", err)
    }

    setFeedView(apiSource === "cam4" || apiSource === "redgifs" || apiSource === "chaturbate")
    loadVideos()
    loadLibraryData()
    setLoadedIframes(new Set([0]))
  }, [apiSource])

  useEffect(() => {
    if (!feedView || (apiSource !== "cam4" && apiSource !== "redgifs" && apiSource === "chaturbate")) return

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

        if (apiSource === "redgifs") {
          iframeRefs.current.forEach((element, idx) => {
            if (element && element instanceof HTMLVideoElement) {
              if (idx === mostVisibleIndex) {
                element.play().catch(() => {})
              } else {
                element.pause()
              }
            }
          })
        }

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

    if (feedView && (apiSource === "cam4" || apiSource === "redgifs" || apiSource === "chaturbate")) {
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
      const savedPlaylistsData = localStorage.getItem("porn_playlists")
      const savedVideosData = localStorage.getItem("porn_saved_videos")
      const historyData = localStorage.getItem("porn_watch_history")

      if (savedPlaylistsData) {
        setPlaylists(JSON.parse(savedPlaylistsData))
      }
      if (savedVideosData) {
        setSavedVideos(JSON.parse(savedVideosData))
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
      localStorage.setItem("porn_saved_videos", JSON.stringify(updatedVideos))
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
      localStorage.setItem("porn_watch_history", JSON.stringify(updatedHistory))
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
        createdAt: new Date().toISOString(),
      }

      const updatedPlaylists = [...playlists, newPlaylist]
      setPlaylists(updatedPlaylists)
      localStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
      setNewPlaylistName("")
      setShowCreatePlaylist(false)
    } catch (err) {
      console.error("Error creating playlist:", err)
    }
  }

  const addToPlaylist = (playlistId: string, videoId: string) => {
    try {
      const videoToAdd = videos.find((v) => v.id === videoId)

      const playlist = playlists.find((p) => p.id === playlistId)
      if (videoToAdd && playlist && !playlist.videoIds.includes(videoId)) {
        if (!savedVideos.some((v) => v.id === videoId)) {
          const updatedSavedVideos = [videoToAdd, ...savedVideos]
          setSavedVideos(updatedSavedVideos)
          localStorage.setItem("porn_saved_videos", JSON.stringify(updatedSavedVideos))
        }
      }

      const updatedPlaylists = playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          const isAlreadyAdded = playlist.videoIds.includes(videoId)
          return {
            ...playlist,
            videoIds: isAlreadyAdded
              ? playlist.videoIds.filter((id) => id !== videoId)
              : [...playlist.videoIds, videoId],
          }
        }
        return playlist
      })

      setPlaylists(updatedPlaylists)
      localStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
      setShowAddToPlaylist(null)
    } catch (err) {
      console.error("Error adding to playlist:", err)
    }
  }

  const deletePlaylist = (playlistId: string) => {
    try {
      const updatedPlaylists = playlists.filter((p) => p.id !== playlistId)
      setPlaylists(updatedPlaylists)
      localStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
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
      console.error("[v0] Error loading gallery images:", err)
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
  }

  const closeVideo = () => {
    setSelectedVideo(null)
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
      console.error("Error sharing:", err)
    }
  }

  const getVideoUrl = (url: string) => {
    if (apiSource === "redgifs" && url.includes("redgifs.com")) {
      return `/api/proxy-media?url=${encodeURIComponent(url)}`
    }
    return url
  }

  const getEmbedUrl = (video: Video) => {
    return video.embed
  }

  // Feed View for live cams
  if (feedView && (apiSource === "cam4" || apiSource === "redgifs" || apiSource === "chaturbate")) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <button
          onClick={() => setFeedView(false)}
          className="absolute left-4 top-4 z-50 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Back"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        <div className="feed-container h-screen w-full snap-y snap-mandatory overflow-y-scroll">
          {videos.map((video, index) => (
            <div key={`${video.id}-${index}`} className="relative h-screen w-full snap-start snap-always">
              {apiSource === "redgifs" ? (
                <video
                  ref={(el) => {
                    iframeRefs.current[index] = el as any
                  }}
                  src={getVideoUrl(video.url || video.embed)}
                  poster={getVideoUrl(video.default_thumb?.src || video.thumbnail || "")}
                  loop
                  playsInline
                  muted
                  autoPlay={index === activeVideoIndex}
                  className="h-full w-full object-contain bg-black"
                />
              ) : loadedIframes.has(index) ? (
                <iframe
                  ref={(el) => {
                    iframeRefs.current[index] = el
                  }}
                  src={getEmbedUrl(video)}
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
              )}

              <div className="absolute bottom-20 left-4 right-16 text-white">
                <h3 className="text-lg font-semibold drop-shadow-lg">{video.title}</h3>
                {video.views > 0 && <p className="text-sm opacity-80">{video.views.toLocaleString()} viewers</p>}
              </div>

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
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex h-20 w-full items-center justify-center">
              {loadingMore && (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              )}
            </div>
          )}
        </div>
      </div>
    )
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
                              : api}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
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

      {/* Video Grid */}
      {loading ? (
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
                      className="absolute top-2 right-2 rounded-full bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
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
                        setShowAddToPlaylist(video.id)
                      }}
                      className="absolute top-2 right-12 rounded-full bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
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
        </>
      )}

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add to Playlist</h3>
              <button onClick={() => setShowAddToPlaylist(null)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addToPlaylist(playlist.id, showAddToPlaylist)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-left transition-colors hover:bg-slate-700"
                >
                  <span className="text-white">{playlist.name}</span>
                  <span className="ml-2 text-sm text-slate-400">({playlist.videoIds.length} videos)</span>
                </button>
              ))}
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

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <div className="w-full max-w-4xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white line-clamp-1">{selectedVideo.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(selectedVideo)}
                  className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                >
                  <Share2 className="h-5 w-5 text-white" />
                </button>
                <button onClick={closeVideo} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={getEmbedUrl(selectedVideo)}
                className="h-full w-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={selectedVideo.title}
              />
            </div>
          </div>
        </div>
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

  useEffect(() => {
    loadLibraryData()
  }, [])

  const loadLibraryData = () => {
    try {
      const savedVideosData = localStorage.getItem("porn_saved_videos")
      const savedPlaylistsData = localStorage.getItem("porn_playlists")
      const historyData = localStorage.getItem("porn_watch_history")

      if (savedVideosData) setSavedVideos(JSON.parse(savedVideosData))
      if (savedPlaylistsData) setPlaylists(JSON.parse(savedPlaylistsData))
      if (historyData) setWatchHistory(JSON.parse(historyData))
    } catch (err) {
      console.error("Error loading library data:", err)
    }
  }

  const removeVideo = (videoId: string) => {
    const updatedVideos = savedVideos.filter((v) => v.id !== videoId)
    setSavedVideos(updatedVideos)
    localStorage.setItem("porn_saved_videos", JSON.stringify(updatedVideos))
  }

  const deletePlaylist = (playlistId: string) => {
    const updatedPlaylists = playlists.filter((p) => p.id !== playlistId)
    setPlaylists(updatedPlaylists)
    localStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
    if (selectedPlaylist === playlistId) setSelectedPlaylist(null)
  }

  const clearHistory = () => {
    setWatchHistory([])
    localStorage.removeItem("porn_watch_history")
  }

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      videoIds: [],
      createdAt: new Date().toISOString(),
    }

    const updatedPlaylists = [...playlists, newPlaylist]
    setPlaylists(updatedPlaylists)
    localStorage.setItem("porn_playlists", JSON.stringify(updatedPlaylists))
    setNewPlaylistName("")
    setShowCreatePlaylist(false)
  }

  const getPlaylistVideos = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return []
    return savedVideos.filter((v) => playlist.videoIds.includes(v.id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
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

      {/* Video Grid */}
      {(activeTab === "saved" || selectedPlaylist || activeTab === "history") &&
        (displayVideos.length === 0 ? (
          <div className="rounded-lg bg-slate-800/50 p-8 text-center text-slate-400">
            {activeTab === "history" ? "No watch history yet" : "No saved videos yet"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayVideos.map((video, index) => (
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
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  {(video.length_min && video.length_min !== "Unknown" || video.length_sec > 0) && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
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
                      className="absolute top-2 right-2 rounded-full bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium text-white">{video.title}</h3>
                  {activeTab === "history" && watchHistory[index] && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(watchHistory[index].watchedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <div className="w-full max-w-4xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white line-clamp-1">{selectedVideo.title}</h2>
              <button onClick={() => setSelectedVideo(null)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={selectedVideo.embed}
                className="h-full w-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={selectedVideo.title}
              />
            </div>
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
