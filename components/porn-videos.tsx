"use client"
import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Play, Eye, ThumbsUp, X, Bookmark, BookmarkCheck, Plus, Trash2, Menu, RefreshCw } from "lucide-react"

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
  thumbnail?: string // For RedGifs
}

interface Playlist {
  id: string
  name: string
  videoIds: string[]
  createdAt: string
}

type ViewMode = "browse" | "library"
type ApiSource = "redgifs" | "eporner" | "xvidapi" | "cam4" | "pornpics" | "chaturbate" // Replaced stripchat with chaturbate

const DEFAULT_API_ORDER: ApiSource[] = ["xvidapi", "eporner", "redgifs", "cam4", "pornpics", "chaturbate"] // Replaced stripchat with chaturbate

const XVIDAPI_CATEGORIES = [
  "xvidapi",
  "AI",
  "Amateur",
  "Anal",
  "Arab",
  "Asian Woman",
  "ASMR",
  "Ass",
  "Ass to Mouth",
  "BBW",
  "BDSM",
  "Big Ass",
  "Big Tits",
  "Blonde",
  "Blowjob",
  "Brunette",
  "Compilation",
  "Creampie",
  "Cumshot",
  "Ebony",
  "Fetish",
  "Hardcore",
  "Hentai",
  "Latina",
  "Lesbian",
  "MILF",
  "POV",
  "Public",
  "Teen",
  "Threesome",
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
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const iframeRefs = useRef<(HTMLIFrameElement | HTMLVideoElement | null)[]>([])
  const [loadedIframes, setLoadedIframes] = useState<Set<number>>(new Set([0]))
  const [apiOrder, setApiOrder] = useState<ApiSource[]>(DEFAULT_API_ORDER)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("porn_api_order")
      if (savedOrder) {
        setApiOrder(JSON.parse(savedOrder))
      }
    } catch (err) {
      console.error("Error loading API order:", err)
    }

    // Replaced stripchat with chaturbate in feedView condition
    setFeedView(apiSource === "cam4" || apiSource === "redgifs" || apiSource === "chaturbate")
    loadVideos()
    loadLibraryData()
    setLoadedIframes(new Set([0])) // Reset loaded iframes when changing API
  }, [apiSource])

  useEffect(() => {
    // Added chaturbate to feedView scroll handler condition
    if (!feedView || (apiSource !== "cam4" && apiSource !== "redgifs" && apiSource !== "chaturbate")) return

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

        // Calculate how much of the element is visible
        const visibleTop = Math.max(0, elementRect.top)
        const visibleBottom = Math.min(containerHeight, elementRect.bottom)
        const visibleHeight = Math.max(0, visibleBottom - visibleTop)
        const visibility = visibleHeight / elementRect.height

        if (visibility > maxVisibility) {
          maxVisibility = visibility
          mostVisibleIndex = idx
        }

        // Load iframe if it's within viewport or one video away
        const distanceFromView = Math.abs(elementCenter - containerHeight / 2)
        const shouldLoad = distanceFromView < containerHeight * 1.5

        if (shouldLoad && !loadedIframes.has(idx)) {
          setLoadedIframes((prev) => new Set(prev).add(idx))
        }
      })

      if (mostVisibleIndex !== activeVideoIndex) {
        setActiveVideoIndex(mostVisibleIndex)
        setCurrentVideoIndex(mostVisibleIndex)

        // Handle RedGifs video play/pause
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

        // Added chaturbate to iframe loading logic alongside cam4
        if (apiSource === "cam4" || apiSource === "chaturbate") {
          setLoadedIframes((prev) => {
            const newLoaded = new Set<number>()
            // Only keep current and adjacent iframes loaded
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

    // Trigger initial check
    handleScroll()

    return () => {
      container?.removeEventListener("scroll", handleScroll)
    }
  }, [feedView, apiSource, activeVideoIndex, loadedIframes, videos.length])

  useEffect(() => {
    const mainNav = document.querySelector("nav.fixed.bottom-4")
    const topNav = document.querySelector(".glass-nav-pill")

    // Added chaturbate to nav hide condition
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

      // Load more when near the bottom
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

      if (savedPlaylistsData) {
        setPlaylists(JSON.parse(savedPlaylistsData))
      }
      if (savedVideosData) {
        setSavedVideos(JSON.parse(savedVideosData))
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
          localStorage.setItem("porn_saved_videos", JSON.JSON.stringify(updatedSavedVideos))
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }

    await loadVideos(searchQuery)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const openVideo = (video: Video) => {
    setSelectedVideo(video)
  }

  const closeVideo = () => {
    setSelectedVideo(null)
  }

  const isVideoSaved = (videoId: string) => {
    return savedVideos.some((v) => v.id === videoId)
  }

  const getPlaylistVideos = () => {
    if (!selectedPlaylist) return []
    const playlist = playlists.find((p) => p.id === selectedPlaylist)
    if (!playlist) return []
    return savedVideos.filter((v) => playlist.videoIds.includes(v.id))
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

  const getVideoUrl = (url: string) => {
    if (apiSource === "redgifs" && url.includes("redgifs.com")) {
      return `/api/proxy-media?url=${encodeURIComponent(url)}`
    }
    return url
  }

  // Added chaturbate to feedView render condition
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

        <button
          onClick={handleRefresh}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Refresh"
        >
          <RefreshCw className="h-6 w-6 text-white" />
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
                  poster={getVideoUrl(video.default_thumb?.src || video.thumbnail)}
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
                  src={video.embed}
                  className="h-full w-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay"
                  title={video.title}
                />
              ) : (
                <div
                  ref={(el) => {
                    iframeRefs.current[index] = el as any
                  }}
                  className="flex h-full w-full items-center justify-center bg-slate-900"
                  style={{
                    backgroundImage: video.default_thumb?.src ? `url(${video.default_thumb.src})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                </div>
              )}

              <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                <h3 className="mb-2 text-xl font-bold text-white">{video.title}</h3>
                {video.views > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Eye className="h-4 w-4" />
                    <span>{video.views.toLocaleString()} viewers</span>
                  </div>
                )}
              </div>

              <div className="absolute bottom-32 right-4 flex flex-col gap-6 pointer-events-auto">
                <button className="flex flex-col items-center gap-1" onClick={() => saveVideo(video)}>
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                    {isVideoSaved(video.id) ? (
                      <BookmarkCheck className="h-6 w-6 text-violet-400" />
                    ) : (
                      <Bookmark className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <span className="text-xs text-white">Save</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                    <ThumbsUp className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-white">Like</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-white">Share</span>
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex h-20 w-full items-center justify-center">
              {loadingMore ? (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              ) : (
                <div className="h-1 w-1" />
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        {apiSource === "xvidapi" && (
          <Button
            onClick={() => setShowCategories(true)}
            variant="outline"
            className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
          >
            <Menu className="mr-2 h-4 w-4" />
            Categories
          </Button>
        )}
      </div>

      {/* API Source Selector - scrollable */}
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
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-400"
        />
        <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700">
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* ... existing code for categories modal, error display, etc ... */}

      {/* Video Grid with infinite scroll */}
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
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              {selectedCategory || searchQuery || "Hottest New Videos"}
            </h2>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => {
              const isLast = index === videos.length - 1

              // PornPics display
              if (apiSource === "pornpics") {
                return (
                  <div
                    key={`${video.id}-${index}`}
                    ref={isLast ? lastVideoElementRef : null}
                    className="group cursor-pointer overflow-hidden rounded-xl bg-slate-800/50"
                    onClick={() => window.open(video.url, "_blank")}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={video.default_thumb?.src || video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        {video.length_min || "Gallery"}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-sm font-medium text-white">{video.title}</h3>
                    </div>
                  </div>
                )
              }

              // Chaturbate grid display
              if (apiSource === "chaturbate") {
                return (
                  <div
                    key={`${video.id}-${index}`}
                    ref={isLast ? lastVideoElementRef : null}
                    className="group cursor-pointer overflow-hidden rounded-xl bg-slate-800/50"
                    onClick={() => window.open(video.url, "_blank")}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={video.default_thumb?.src || "/placeholder.svg"}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        LIVE
                      </div>
                      {video.views > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                          <Eye className="h-3 w-3" />
                          {video.views.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-medium text-white">{video.title}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{video.keywords}</p>
                    </div>
                  </div>
                )
              }

              // Default video card
              return (
                <div
                  key={`${video.id}-${index}`}
                  ref={isLast ? lastVideoElementRef : null}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-slate-800/50"
                  onClick={() => openVideo(video)}
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
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {video.length_min || "Unknown"}
                    </div>
                    {/* Save button */}
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
                    {/* Add to playlist button */}
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

          {!hasMore && videos.length > 0 && (
            <div className="py-8 text-center text-slate-500">No more videos to load</div>
          )}
        </>
      )}

      {/* ... existing code for video modal, add to playlist modal, categories modal ... */}

      {showCategories && (
        <div className="fixed inset-0 z-50 bg-black/95 p-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-4xl font-bold text-violet-400">Menu</h2>
              <button
                onClick={() => setShowCategories(false)}
                className="rounded-full p-2 text-white hover:bg-white/10"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="mb-4 text-2xl font-semibold text-cyan-400">VIDEO CATEGORIES</h3>
              <div className="space-y-1">
                {XVIDAPI_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="block w-full rounded-lg px-4 py-3 text-left text-xl text-white transition-colors hover:bg-slate-800"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreatePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Create New Playlist</h3>
            <Input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && createPlaylist()}
              className="mb-4 border-slate-700 bg-slate-800/50 text-white"
            />
            <div className="flex gap-2">
              <Button onClick={createPlaylist} className="flex-1 bg-violet-600 hover:bg-violet-700">
                Create
              </Button>
              <Button
                onClick={() => setShowCreatePlaylist(false)}
                variant="outline"
                className="flex-1 border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-6xl">
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            <div className="aspect-video w-full overflow-hidden rounded-lg">
              {apiSource === "eporner" && (
                <iframe
                  src={`https://www.eporner.com/embed/${selectedVideo.id}`}
                  className="h-full w-full"
                  frameBorder="0"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              )}
              {(apiSource === "xvidapi" || apiSource === "cam4") && selectedVideo.embed && (
                <iframe
                  src={selectedVideo.embed}
                  className="h-full w-full"
                  frameBorder="0"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              )}
              {apiSource === "redgifs" && (
                <video
                  src={getVideoUrl(selectedVideo.url || selectedVideo.embed)}
                  poster={getVideoUrl(selectedVideo.default_thumb?.src || selectedVideo.thumbnail)}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="h-full w-full object-contain bg-black"
                />
              )}
              {apiSource === "pornpics" && selectedVideo.embed && (
                <iframe
                  src={selectedVideo.embed}
                  className="h-full w-full"
                  frameBorder="0"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              )}
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-semibold text-white">{selectedVideo.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                {selectedVideo.views && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>
                      {selectedVideo.views ? `${Math.floor((selectedVideo.views || 0) / 1000)}K` : "0K"} Views
                    </span>
                  </div>
                )}
                {selectedVideo.rate && (
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{selectedVideo.rate ? `${Math.round((selectedVideo.rate || 0) * 10)}%` : "0%"} Up</span>
                  </div>
                )}
                {selectedVideo.length_min && <span>{selectedVideo.length_min}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PornLibrary() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [savedVideos, setSavedVideos] = useState<Video[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    loadLibraryData()
  }, [])

  const loadLibraryData = () => {
    try {
      const savedPlaylistsData = localStorage.getItem("porn_playlists")
      const savedVideosData = localStorage.getItem("porn_saved_videos")

      if (savedPlaylistsData) {
        setPlaylists(JSON.parse(savedPlaylistsData))
      }
      if (savedVideosData) {
        setSavedVideos(JSON.parse(savedVideosData))
      }
    } catch (err) {
      console.error("Error loading library data:", err)
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

  const removeFromSaved = (videoId: string) => {
    try {
      const updatedVideos = savedVideos.filter((v) => v.id !== videoId)
      setSavedVideos(updatedVideos)
      localStorage.setItem("porn_saved_videos", JSON.stringify(updatedVideos))
    } catch (err) {
      console.error("Error removing video:", err)
    }
  }

  const getPlaylistVideos = () => {
    if (!selectedPlaylist) return []
    const playlist = playlists.find((p) => p.id === selectedPlaylist)
    if (!playlist) return []
    return savedVideos.filter((v) => playlist.videoIds.includes(v.id))
  }

  const displayVideos = selectedPlaylist ? getPlaylistVideos() : savedVideos

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Library</h2>
        <Button onClick={() => setShowCreatePlaylist(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="mr-2 h-4 w-4" />
          New Playlist
        </Button>
      </div>

      {/* Playlists */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setSelectedPlaylist(null)}
          variant={!selectedPlaylist ? "default" : "outline"}
          className={!selectedPlaylist ? "bg-violet-600" : "border-slate-700 bg-slate-800/50 text-white"}
        >
          All Saved ({savedVideos.length})
        </Button>
        {playlists.map((playlist) => (
          <div key={playlist.id} className="flex items-center gap-1">
            <Button
              onClick={() => setSelectedPlaylist(playlist.id)}
              variant={selectedPlaylist === playlist.id ? "default" : "outline"}
              className={
                selectedPlaylist === playlist.id ? "bg-violet-600" : "border-slate-700 bg-slate-800/50 text-white"
              }
            >
              {playlist.name} ({playlist.videoIds.length})
            </Button>
            <button
              onClick={() => deletePlaylist(playlist.id)}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Videos Grid */}
      {displayVideos.length === 0 ? (
        <div className="rounded-lg bg-slate-800/50 p-8 text-center text-slate-400">
          {selectedPlaylist ? "No videos in this playlist yet." : "No saved videos yet. Save videos to see them here."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayVideos.map((video) => (
            <div
              key={video.id}
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
                <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  {video.length_min || "Unknown"}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromSaved(video.id)
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-white">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-bold text-white">Create New Playlist</h3>
            <Input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="mb-4 border-slate-700 bg-slate-900 text-white"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePlaylist(false)}>
                Cancel
              </Button>
              <Button onClick={createPlaylist} className="bg-violet-600 hover:bg-violet-700">
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={selectedVideo.embed}
                className="h-full w-full"
                allowFullScreen
                allow="autoplay"
                title={selectedVideo.title}
              />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">{selectedVideo.title}</h3>
          </div>
        </div>
      )}
    </div>
  )
}
