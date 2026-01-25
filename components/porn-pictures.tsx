"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Loader2, ArrowRight, X, Play, Heart, Share2, MessageCircle, Volume2, VolumeX } from "lucide-react"

interface Gallery {
  id: string
  title: string
  url: string
  thumbnail: string
  preview: string
  tags: string[]
  photos?: string[]
  isVideo?: boolean
  videoUrl?: string
  audioUrl?: string
  hasAudio?: boolean
  permalink?: string
}

const loadingCache = new Map<string, Promise<void>>()

export function PornPictures() {
  const [searchQuery, setSearchQuery] = useState("")
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [apiSource, setApiSource] = useState<"pornpics" | "redgifs" | "reddit">("redgifs")
  const [redditSubreddit, setRedditSubreddit] = useState("pics")
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [feedView, setFeedView] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
  const playingVideos = useRef<Set<number>>(new Set())
  const [isMuted, setIsMuted] = useState(true)

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

  const syncAudioWithVideo = (video: HTMLVideoElement, audio: HTMLAudioElement | null) => {
    if (!audio) return
    
    // Sync audio time with video
    const syncTime = () => {
      if (Math.abs(audio.currentTime - video.currentTime) > 0.3) {
        audio.currentTime = video.currentTime
      }
    }
    
    // Handle video events
    const handlePlay = () => {
      if (!isMuted) {
        audio.currentTime = video.currentTime
        audio.play().catch(() => {})
      }
    }
    
    const handlePause = () => {
      audio.pause()
    }
    
    const handleSeeked = () => {
      audio.currentTime = video.currentTime
    }
    
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("timeupdate", syncTime)
    
    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("timeupdate", syncTime)
    }
  }

  const preloadVideo = (video: HTMLVideoElement, priority: "high" | "medium" | "low") => {
    const url = video.src
    if (!url || loadingCache.has(url)) return

    const loadPromise = new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve()
        return
      }

      if (priority === "high") {
        video.preload = "auto"
      } else if (priority === "medium") {
        video.preload = "metadata"
      } else {
        video.preload = "none"
        resolve()
        return
      }

      const handleCanPlay = () => {
        video.removeEventListener("canplay", handleCanPlay)
        video.removeEventListener("error", handleError)
        loadingCache.delete(url)
        resolve()
      }

      const handleError = () => {
        video.removeEventListener("canplay", handleCanPlay)
        video.removeEventListener("error", handleError)
        loadingCache.delete(url)
        resolve()
      }

      video.addEventListener("canplay", handleCanPlay, { once: true })
      video.addEventListener("error", handleError, { once: true })

      video.load()
    })

    loadingCache.set(url, loadPromise)
    return loadPromise
  }

  useEffect(() => {
    setGalleries([])
    setError("")
    setSearchQuery("")
    setFeedView(apiSource === "redgifs")
    loadGalleries()
  }, [apiSource])

  useEffect(() => {
    if (!feedView || (apiSource !== "redgifs" && apiSource !== "reddit")) return

    const timeoutId = setTimeout(() => {
      videoRefs.current.forEach((video, idx) => {
        if (!video) return
        const audio = audioRefs.current[idx]

        const distance = Math.abs(idx - currentVideoIndex)

        if (idx === currentVideoIndex) {
          // Current video: high priority
          preloadVideo(video, "high")
          if (!playingVideos.current.has(idx)) {
            playingVideos.current.add(idx)
            video.play().catch(() => {
              playingVideos.current.delete(idx)
            })
            // Play audio if not muted and audio exists
            if (audio && !isMuted) {
              audio.currentTime = video.currentTime
              audio.play().catch(() => {})
            }
          }
        } else if (distance === 1) {
          // Adjacent videos: medium priority
          preloadVideo(video, "medium")
          if (playingVideos.current.has(idx)) {
            video.pause()
            if (audio) audio.pause()
            playingVideos.current.delete(idx)
          }
        } else {
          // Far videos: pause and unload
          if (playingVideos.current.has(idx)) {
            video.pause()
            if (audio) audio.pause()
            playingVideos.current.delete(idx)
          }
          video.preload = "none"
          if (distance > 3) {
            video.src = video.src // Reset to free memory
          }
        }
      })
    }, 150) // Debounce to prevent rapid changes

    return () => clearTimeout(timeoutId)
  }, [currentVideoIndex, feedView, apiSource, isMuted])

  useEffect(() => {
    if (!feedView || (apiSource !== "redgifs" && apiSource !== "reddit")) return

    const handleScroll = () => {
      const container = document.querySelector(".feed-container")
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

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

    const container = document.querySelector(".feed-container")
    container?.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      container?.removeEventListener("scroll", handleScroll)
    }
  }, [feedView, apiSource, currentVideoIndex])

  useEffect(() => {
    const mainNav = document.querySelector("nav.fixed.bottom-4")
    const topNav = document.querySelector(".glass-nav-pill")

  if (feedView && (apiSource === "redgifs" || apiSource === "reddit")) {
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

  const loadGalleries = async () => {
    try {
      setLoading(true)
      setError("")

      const subredditParam = apiSource === "reddit" ? `&subreddit=${encodeURIComponent(redditSubreddit)}` : ""
      const response = await fetch(`/api/search-pictures?page=1&api=${apiSource}&refresh=${refreshKey}${subredditParam}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load galleries")
      }

      setGalleries(data.galleries || [])
      setPage(1)
      setHasMore(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch galleries")
      setGalleries([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadGalleries()
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `/api/search-pictures?query=${encodeURIComponent(searchQuery)}&api=${apiSource}&refresh=${refreshKey}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search")
      }

      setGalleries(data.galleries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search")
      setGalleries([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (gallery: Gallery, index: number) => {
    if (apiSource === "redgifs" || (apiSource === "reddit" && gallery.isVideo)) {
      // For Reddit, we need to find the index in the filtered video galleries
      const videoGalleries = galleries.filter(g => g.isVideo)
      const videoIndex = videoGalleries.findIndex(g => g.id === gallery.id)
      setCurrentVideoIndex(videoIndex >= 0 ? videoIndex : index)
      setFeedView(true)
    } else {
      window.open(gallery.url || gallery.permalink, "_blank", "noopener,noreferrer")
    }
  }

  const closeModal = () => {
    setSelectedGallery(null)
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    loadGalleries()
  }

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuted = !prev
      const currentVideo = videoRefs.current[currentVideoIndex]
      const currentAudio = audioRefs.current[currentVideoIndex]
      
      if (currentAudio) {
        if (newMuted) {
          currentAudio.pause()
        } else if (currentVideo && !currentVideo.paused) {
          currentAudio.currentTime = currentVideo.currentTime
          currentAudio.play().catch(() => {})
        }
      }
      
      return newMuted
    })
  }

  if (feedView && (apiSource === "redgifs" || apiSource === "reddit")) {
    const videoGalleries = galleries.filter(g => g.isVideo)
    
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <button
          onClick={() => setFeedView(false)}
          className="absolute left-4 top-4 z-50 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Back"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        <div className="absolute right-4 top-4 z-50 flex gap-2">
          {/* Mute/Unmute button - only show if any video has audio */}
          {videoGalleries.some(g => g.hasAudio || g.audioUrl) && (
            <button
              onClick={toggleMute}
              className="rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-6 w-6 text-white" />
              ) : (
                <Volume2 className="h-6 w-6 text-white" />
              )}
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="Refresh"
          >
            <ArrowRight className="h-6 w-6 rotate-90 text-white" />
          </button>
        </div>

        <div className="feed-container h-screen w-full snap-y snap-mandatory overflow-y-scroll">
          {videoGalleries.map((gallery, index) => {
            const videoSrc = apiSource === "reddit" 
              ? (gallery.videoUrl || gallery.url) 
              : getVideoUrl(gallery.url)
            
            return (
              <div key={gallery.id} className="relative h-screen w-full snap-start snap-always">
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el
                  }}
                  src={videoSrc}
                  poster={apiSource === "reddit" ? gallery.thumbnail : getVideoUrl(gallery.thumbnail)}
                  loop
                  playsInline
                  muted
                  className="h-full w-full object-contain bg-black"
                  crossOrigin="anonymous"
                />
                
                {/* Hidden audio element for Reddit videos with audio */}
                {apiSource === "reddit" && gallery.audioUrl && (
                  <audio
                    ref={(el) => {
                      audioRefs.current[index] = el
                    }}
                    src={gallery.audioUrl}
                    loop
                    preload="metadata"
                  />
                )}

                <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <h3 className="mb-2 text-xl font-bold text-white">{gallery.title}</h3>
                  {gallery.tags && gallery.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {gallery.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Audio indicator */}
                  {gallery.hasAudio && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-white/70">
                      <Volume2 className="h-3 w-3" />
                      <span>Has audio</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-32 right-4 flex flex-col gap-6">
                  <button className="flex flex-col items-center gap-1">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-white">Like</span>
                  </button>

                  <button className="flex flex-col items-center gap-1">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-white">Comment</span>
                  </button>

                  <button className="flex flex-col items-center gap-1">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-white">Share</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 p-1 backdrop-blur-md">
        <button
          onClick={() => setApiSource("redgifs")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            apiSource === "redgifs"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          RedGifs
        </button>
        <button
          onClick={() => setApiSource("pornpics")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            apiSource === "pornpics"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
              : "text-slate-400 hover:text-white"
          }`}
  >
          PornPics
        </button>
        <button
          onClick={() => setApiSource("reddit")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            apiSource === "reddit"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Reddit
        </button>
      </div>
      
      {apiSource === "reddit" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">r/</span>
            <Input
              type="text"
              placeholder="Enter subreddit"
              value={redditSubreddit}
              onChange={(e) => setRedditSubreddit(e.target.value.replace(/^r\//, "").replace(/\s/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  loadGalleries()
                }
              }}
              className="pl-8 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <Button onClick={loadGalleries} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 dark:bg-slate-700 dark:text-white"
          />
        </div>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
          <Search className="h-5 w-5" />
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && galleries.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {galleries.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  {searchQuery
                    ? "Search Results"
                    : apiSource === "redgifs"
                      ? "Trending on RedGifs"
                      : "Popular Categories"}
                </h2>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 text-purple-500 hover:text-purple-400"
                >
                  <span className="text-sm font-medium sm:text-base">Refresh</span>
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </button>
              </div>

              <div className="space-y-4">
                {galleries.map((gallery, index) => (
                  <div
                    key={gallery.id}
                    onClick={() => handleCategoryClick(gallery, index)}
                    className="group cursor-pointer overflow-hidden rounded-2xl bg-slate-800/50 transition-all hover:bg-slate-800"
                  >
                    <div className="p-4 pb-3">
                      <h3 className="line-clamp-2 text-lg font-semibold text-white sm:text-xl">{gallery.title}</h3>
                      {gallery.tags && gallery.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {gallery.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="rounded-full bg-purple-600/30 px-2 py-1 text-xs text-purple-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      {gallery.isVideo && (apiSource === "redgifs" || apiSource === "reddit") ? (
                        <div className="relative h-full w-full">
                          <img
                            src={apiSource === "reddit" ? gallery.thumbnail : getVideoUrl(gallery.thumbnail) || "/placeholder.svg"}
                            alt={gallery.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className={`rounded-full p-4 backdrop-blur-sm transition-transform group-hover:scale-110 ${apiSource === "reddit" ? "bg-orange-500/90" : "bg-purple-600/90"}`}>
                              <Play className="h-8 w-8 text-white" fill="white" />
                            </div>
                          </div>
                          {/* Audio indicator */}
                          {gallery.hasAudio && (
                            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                              <Volume2 className="h-3 w-3" />
                              <span>Audio</span>
                            </div>
                          )}
                        </div>
                      ) : gallery.thumbnail ? (
                        <Image
                          src={getProxiedUrl(gallery.thumbnail) || "/placeholder.svg"}
                          alt={gallery.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                          <ExternalLink className="h-16 w-16 text-white/40" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {galleries.length === 0 && !loading && !error && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">No categories found</p>
          )}
        </>
      )}

      {selectedGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={closeModal}>
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="max-h-[90vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-center text-2xl font-bold text-white">{selectedGallery.title}</h3>
            {selectedGallery.isVideo && selectedGallery.url ? (
              <video
                key={selectedGallery.id}
                src={selectedGallery.url}
                poster={selectedGallery.thumbnail}
                controls
                autoPlay
                loop
                className="max-h-[80vh] w-full rounded-lg bg-black"
                playsInline
                preload="auto"
              />
            ) : (
              <img
                src={selectedGallery.url || "/placeholder.svg"}
                alt={selectedGallery.title}
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
