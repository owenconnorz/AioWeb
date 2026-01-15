"use client"
import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Play,
  Eye,
  ThumbsUp,
  ArrowRight,
  X,
  Bookmark,
  BookmarkCheck,
  Plus,
  List,
  Trash2,
  Grid,
  Menu,
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
}

interface Playlist {
  id: string
  name: string
  videoIds: string[]
  createdAt: string
}

type ViewMode = "browse" | "library"
type ApiSource = "eporner" | "xvidapi" | "cam4" | "redgifs" // Added redgifs to API sources

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
  const [viewMode, setViewMode] = useState<ViewMode>("browse")
  const [apiSource, setApiSource] = useState<ApiSource>("redgifs") // Set redgifs as default
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
  const observerTarget = useRef<HTMLDivElement>(null)
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([])
  const loadedIframes = useRef<Set<number>>(new Set([0])) // Track which iframes are loaded, start with first one
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const playingVideos = useRef<Set<number>>(new Set())

  const getVideoUrl = (url: string) => {
    if (apiSource === "redgifs" && url.includes("redgifs.com")) {
      return `/api/proxy-media?url=${encodeURIComponent(url)}`
    }
    return url
  }

  const getProxiedUrl = (url: string) => {
    if (apiSource === "redgifs" && url.includes("redgifs.com")) {
      return `/api/proxy-media?url=${encodeURIComponent(url)}`
    }
    return url
  }

  const preloadVideo = (video: HTMLVideoElement, priority: "high" | "medium" | "low") => {
    const url = video.src
    if (!url) return

    if (video.readyState >= 2) return

    if (priority === "high") {
      video.preload = "auto"
    } else if (priority === "medium") {
      video.preload = "metadata"
    } else {
      video.preload = "none"
      return
    }

    video.load()
  }

  useEffect(() => {
    setFeedView(apiSource === "cam4" || apiSource === "redgifs") // Show feed for both cam4 and redgifs
    loadVideos()
    loadLibraryData()
    setLoadedIframes(new Set([0])) // Reset loaded iframes when changing API
  }, [apiSource])

  useEffect(() => {
    if (!feedView || apiSource !== "redgifs") return

    const timeoutId = setTimeout(() => {
      videoRefs.current.forEach((video, idx) => {
        if (!video) return

        const distance = Math.abs(idx - currentVideoIndex)

        if (idx === currentVideoIndex) {
          preloadVideo(video, "high")
          if (!playingVideos.current.has(idx)) {
            playingVideos.current.add(idx)
            video.play().catch(() => {
              playingVideos.current.delete(idx)
            })
          }
        } else if (distance === 1) {
          preloadVideo(video, "medium")
          if (playingVideos.current.has(idx)) {
            video.pause()
            playingVideos.current.delete(idx)
          }
        } else {
          if (playingVideos.current.has(idx)) {
            video.pause()
            playingVideos.current.delete(idx)
          }
          video.preload = "none"
          if (distance > 3) {
            video.src = video.src
          }
        }
      })
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [currentVideoIndex, feedView, apiSource])

  useEffect(() => {
    if (!feedView) return

    const handleScroll = () => {
      const container = document.querySelector(".feed-container")
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      if (apiSource === "cam4") {
        iframeRefs.current.forEach((iframe, idx) => {
          if (!iframe) return

          const iframeRect = iframe.getBoundingClientRect()
          const iframeCenter = iframeRect.top + iframeRect.height / 2
          const isInView = iframeCenter >= 0 && iframeCenter <= containerHeight

          const distanceFromView = Math.abs(iframeCenter - containerHeight / 2)
          const shouldLoad = distanceFromView < containerHeight * 1.5

          if (shouldLoad && !loadedIframes.current.has(idx)) {
            setLoadedIframes((prev) => new Set(prev).add(idx))
          }

          if (isInView && idx !== currentVideoIndex) {
            setCurrentVideoIndex(idx)
          }
        })
      } else if (apiSource === "redgifs") {
        videoRefs.current.forEach((video, idx) => {
          if (!video) return

          const videoRect = video.getBoundingClientRect()
          const videoCenter = videoRect.top + videoRect.height / 2
          const isInView = videoCenter >= 0 && videoCenter <= containerHeight

          if (isInView && idx !== currentVideoIndex) {
            setCurrentVideoIndex(idx)
          }
        })
      }
    }

    const container = document.querySelector(".feed-container")
    container?.addEventListener("scroll", handleScroll, { passive: true })

    if (apiSource === "cam4") {
      handleScroll()
    }

    return () => {
      container?.removeEventListener("scroll", handleScroll)
    }
  }, [feedView, apiSource, currentVideoIndex, loadedIframes])

  useEffect(() => {
    const mainNav = document.querySelector("nav.fixed.bottom-4")
    const topNav = document.querySelector(".glass-nav-pill")

    if (feedView && (apiSource === "cam4" || apiSource === "redgifs")) {
      // Hide nav for both feed types
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

  const loadVideos = async (query = "", category = "") => {
    setLoading(true)
    setError("")
    setPage(1)
    setHasMore(true)

    try {
      const searchParam = category || query || "popular"
      const response = await fetch(
        `/api/search-videos?query=${encodeURIComponent(searchParam)}&source=${apiSource}&page=1&refresh=${refreshKey}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load videos")
      }

      setVideos(data.videos || [])
      setHasMore((data.videos || []).length >= 12)
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
      const response = await fetch(
        `/api/search-videos?query=${encodeURIComponent(searchParam)}&source=${apiSource}&page=${nextPage}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load more videos")
      }

      const newVideos = data.videos || []
      if (newVideos.length > 0) {
        setVideos((prev) => [...prev, ...newVideos])
        setPage(nextPage)
        setHasMore(newVideos.length >= 12)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("Load more error:", err)
      setHasMore(false)
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

  if (feedView && (apiSource === "cam4" || apiSource === "redgifs")) {
    // Updated feed view to support both cam4 and redgifs
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
          <ArrowRight className="h-6 w-6 rotate-90 text-white" />
        </button>

        <div className="feed-container h-screen w-full snap-y snap-mandatory overflow-y-scroll">
          {videos.map((video, index) => (
            <div key={video.id} className="relative h-screen w-full snap-start snap-always">
              {apiSource === "cam4" ? (
                // Cam4 iframe rendering
                <>
                  {loadedIframes.current.has(index) ? (
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
                    >
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                    </div>
                  )}
                </>
              ) : (
                // RedGifs video rendering
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el
                  }}
                  src={getVideoUrl(video.url || video.embed)}
                  poster={getVideoUrl(video.default_thumb?.src || "")}
                  loop
                  playsInline
                  muted
                  className="h-full w-full object-contain bg-black"
                />
              )}

              <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                <h3 className="mb-2 text-xl font-bold text-white">{video.title}</h3>
                {video.views > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Eye className="h-4 w-4" />
                    <span>
                      {apiSource === "cam4"
                        ? `${Math.floor(video.views / 1000)}K viewers`
                        : `${(video.views / 1000000).toFixed(1)}M views`}
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute bottom-32 right-4 flex flex-col gap-6 pointer-events-auto">
                <button className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                    {apiSource === "redgifs" ? (
                      <Play className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <span className="text-xs text-white">Like</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                    <Bookmark className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-white">Save</span>
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
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("browse")}
            variant={viewMode === "browse" ? "default" : "outline"}
            className={
              viewMode === "browse"
                ? "bg-violet-600 hover:bg-violet-700"
                : "border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
            }
          >
            <Grid className="mr-2 h-4 w-4" />
            Browse
          </Button>
          <Button
            onClick={() => setViewMode("library")}
            variant={viewMode === "library" ? "default" : "outline"}
            className={
              viewMode === "library"
                ? "bg-violet-600 hover:bg-violet-700"
                : "border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
            }
          >
            <List className="mr-2 h-4 w-4" />
            Library ({savedVideos.length})
          </Button>
        </div>

        {viewMode === "browse" && (
          <>
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

            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-1">
              <span className="px-2 text-xs text-slate-400">API:</span>
              <Button
                onClick={() => setApiSource("redgifs")}
                size="sm"
                variant="ghost"
                className={
                  apiSource === "redgifs"
                    ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }
              >
                RedGifs
              </Button>
              <Button
                onClick={() => setApiSource("eporner")}
                size="sm"
                variant="ghost"
                className={
                  apiSource === "eporner"
                    ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }
              >
                EPorner
              </Button>
              <Button
                onClick={() => setApiSource("xvidapi")}
                size="sm"
                variant="ghost"
                className={
                  apiSource === "xvidapi"
                    ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }
              >
                XvidAPI
              </Button>
              <Button
                onClick={() => setApiSource("cam4")}
                size="sm"
                variant="ghost"
                className={
                  apiSource === "cam4"
                    ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }
              >
                Cam4
              </Button>
            </div>
          </>
        )}
      </div>

      {viewMode === "browse" ? (
        <>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="search"
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-400"
              />
              <Button onClick={handleSearch} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">
                  {selectedCategory
                    ? `${selectedCategory} Videos`
                    : searchQuery
                      ? "Search Results"
                      : "Hottest New Videos"}
                </h2>
                <button className="flex items-center gap-2 text-lg font-medium text-violet-500 hover:text-violet-400">
                  View All
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {videos.map((video) => (
                  <div key={video.id} className="group relative">
                    <button onClick={() => openVideo(video)} className="block w-full text-left">
                      <div className="space-y-3">
                        {apiSource === "eporner" && video.default_thumb?.src && (
                          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                            <img
                              src={video.default_thumb.src || "/placeholder.svg"}
                              alt={video.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <Play className="h-8 w-8 text-white" fill="white" />
                              </div>
                            </div>
                            {video.length_min && (
                              <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                                {video.length_min}
                              </div>
                            )}
                          </div>
                        )}

                        {(apiSource === "xvidapi" || !video.default_thumb?.src) && (
                          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                            {video.default_thumb?.src ? (
                              <img
                                src={video.default_thumb.src || "/placeholder.svg"}
                                alt={video.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900 to-slate-900">
                                <Play className="h-16 w-16 text-white/60" />
                              </div>
                            )}
                            {video.length_min && (
                              <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                                {video.length_min}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3 className="line-clamp-2 text-base font-normal leading-snug text-white group-hover:text-violet-400">
                            {video.title}
                          </h3>
                          {apiSource === "eporner" && (video.views || video.rate) && (
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              {video.views !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <Eye className="h-4 w-4" />
                                  <span>{`${Math.floor((video.views || 0) / 1000)}K`} Views</span>
                                </div>
                              )}
                              {video.rate !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{`${Math.round((video.rate || 0) * 10)}%`} Up</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="absolute right-2 top-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveVideo(video)
                        }}
                        className="rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-black/80"
                      >
                        {isVideoSaved(video.id) ? (
                          <BookmarkCheck className="h-5 w-5 text-violet-400" />
                        ) : (
                          <Bookmark className="h-5 w-5 text-white" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAddToPlaylist(video.id)
                        }}
                        className="rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-black/80"
                      >
                        <Plus className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    {showAddToPlaylist === video.id && (
                      <div className="absolute right-2 top-16 z-10 w-64 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
                        <div className="mb-2 flex items-center justify-between px-2 py-1">
                          <span className="text-sm font-medium text-white">Add to Playlist</span>
                          <button
                            onClick={() => setShowAddToPlaylist(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="max-h-48 space-y-1 overflow-y-auto">
                          {playlists.length === 0 ? (
                            <p className="px-2 py-4 text-center text-sm text-slate-400">No playlists yet</p>
                          ) : (
                            playlists.map((playlist) => (
                              <button
                                key={playlist.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToPlaylist(playlist.id, video.id)
                                }}
                                className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm text-white hover:bg-slate-800"
                              >
                                <span>{playlist.name}</span>
                                {playlist.videoIds.includes(video.id) && (
                                  <BookmarkCheck className="h-4 w-4 text-violet-400" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div ref={observerTarget} className="py-4">
                {loadingMore && (
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                  </div>
                )}
                {!hasMore && videos.length > 0 && (
                  <p className="text-center text-sm text-slate-400">No more videos to load</p>
                )}
              </div>
            </div>
          )}

          {!loading && videos.length === 0 && !error && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
              <p className="text-slate-400">No videos found. Try a different search term.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">My Library</h2>
            <Button onClick={() => setShowCreatePlaylist(true)} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Playlists</h3>
            {playlists.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
                <p className="text-slate-400">No playlists yet. Create one to organize your videos!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="group relative cursor-pointer rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-violet-500"
                    onClick={() => setSelectedPlaylist(selectedPlaylist === playlist.id ? null : playlist.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white group-hover:text-violet-400">{playlist.name}</h4>
                        <p className="text-sm text-slate-400">{playlist.videoIds.length} videos</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlaylist(playlist.id)
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-red-950 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPlaylist && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                {playlists.find((p) => p.id === selectedPlaylist)?.name}
              </h3>
              {getPlaylistVideos().length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
                  <p className="text-slate-400">No videos in this playlist yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getPlaylistVideos().map((video) => (
                    <button key={video.id} onClick={() => openVideo(video)} className="group block w-full text-left">
                      <div className="space-y-3">
                        {video.default_thumb?.src ? (
                          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                            <img
                              src={video.default_thumb.src || "/placeholder.svg"}
                              alt={video.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <Play className="h-8 w-8 text-white" fill="white" />
                              </div>
                            </div>
                            {video.length_min && (
                              <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                                {video.length_min}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900 to-slate-900">
                              <Play className="h-16 w-16 text-white/60" />
                            </div>
                            {video.length_min && (
                              <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                                {video.length_min}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3 className="line-clamp-2 text-base font-normal leading-snug text-white group-hover:text-violet-400">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Saved Videos</h3>
            {savedVideos.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
                <p className="text-slate-400">No saved videos yet. Bookmark videos to save them here!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {savedVideos.map((video) => (
                  <div key={video.id} className="group relative">
                    <button onClick={() => openVideo(video)} className="block w-full text-left">
                      <div className="space-y-3">
                        {video.default_thumb?.src ? (
                          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                            <img
                              src={video.default_thumb.src || "/placeholder.svg"}
                              alt={video.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <Play className="h-8 w-8 text-white" fill="white" />
                              </div>
                            </div>
                            {video.length_min && (
                              <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                                {video.length_min}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900 to-slate-900">
                              <Play className="h-16 w-16 text-white/60" />
                            </div>
                            {video.length_min && (
                              <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                                {video.length_min}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3 className="line-clamp-2 text-base font-normal leading-snug text-white group-hover:text-violet-400">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        saveVideo(video)
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-black/80"
                    >
                      <BookmarkCheck className="h-5 w-5 text-violet-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              {apiSource === "xvidapi" && selectedVideo.embed && (
                <iframe
                  src={selectedVideo.embed}
                  className="h-full w-full"
                  frameBorder="0"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              )}
              {apiSource === "cam4" && selectedVideo.embed && (
                <iframe
                  src={selectedVideo.embed}
                  className="h-full w-full"
                  frameBorder="0"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              )}
              {/* Add RedGifs embed handling here if necessary */}
              {apiSource === "redgifs" && selectedVideo.embed && (
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
