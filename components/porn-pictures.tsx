"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Loader2, ArrowRight, X, Play, Heart, Share2, MessageCircle } from "lucide-react"

interface Gallery {
  id: string
  title: string
  url: string
  thumbnail: string
  preview: string
  tags: string[]
  photos?: string[]
  isVideo?: boolean
}

export function PornPictures() {
  const [searchQuery, setSearchQuery] = useState("")
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [apiSource, setApiSource] = useState<"pornpics" | "redgifs">("pornpics")
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [feedView, setFeedView] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const getProxiedUrl = (url: string) => {
    if (apiSource === "redgifs" && url && url.includes("redgifs.com")) {
      return `/api/proxy-media?url=${encodeURIComponent(url)}`
    }
    return url
  }

  useEffect(() => {
    setGalleries([])
    setError("")
    setSearchQuery("")
    // Start in feed view immediately for RedGifs
    setFeedView(apiSource === "redgifs")
    loadGalleries()
  }, [apiSource])

  useEffect(() => {
    if (feedView && videoRefs.current[currentVideoIndex]) {
      videoRefs.current.forEach((video, idx) => {
        if (video) {
          if (idx === currentVideoIndex) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      })
    }
  }, [currentVideoIndex, feedView])

  const loadGalleries = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/search-pictures?page=1&api=${apiSource}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load galleries")
      }

      setGalleries(data.galleries || [])
      setPage(1)
      setHasMore(false)
    } catch (err) {
      console.error("[v0] Error loading galleries:", err)
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

      const response = await fetch(`/api/search-pictures?query=${encodeURIComponent(searchQuery)}&api=${apiSource}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search")
      }

      setGalleries(data.galleries || [])
    } catch (err) {
      console.error("[v0] Error searching:", err)
      setError(err instanceof Error ? err.message : "Failed to search")
      setGalleries([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (gallery: Gallery, index: number) => {
    if (apiSource === "redgifs") {
      setCurrentVideoIndex(index)
      setFeedView(true)
    } else {
      window.open(gallery.url, "_blank", "noopener,noreferrer")
    }
  }

  const closeModal = () => {
    setSelectedGallery(null)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollPosition = container.scrollTop
    const windowHeight = window.innerHeight
    const newIndex = Math.round(scrollPosition / windowHeight)

    if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < galleries.length) {
      setCurrentVideoIndex(newIndex)
    }
  }

  if (feedView && apiSource === "redgifs") {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <button
          onClick={() => setFeedView(false)}
          className="absolute left-4 top-4 z-50 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Back"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        <div className="h-screen w-full snap-y snap-mandatory overflow-y-scroll" onScroll={handleScroll}>
          {galleries.map((gallery, index) => (
            <div key={gallery.id} className="relative h-screen w-full snap-start snap-always">
              <video
                ref={(el) => {
                  videoRefs.current[index] = el
                }}
                src={`/api/proxy-media?url=${encodeURIComponent(gallery.url)}`}
                poster={`/api/proxy-media?url=${encodeURIComponent(gallery.thumbnail)}`}
                loop
                playsInline
                muted
                className="h-full w-full object-contain bg-black"
              />

              {/* Video Info Overlay */}
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
              </div>

              {/* Side Action Buttons */}
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
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 p-1 backdrop-blur-md">
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
          onClick={() => setApiSource("redgifs")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            apiSource === "redgifs"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          RedGifs
        </button>
      </div>

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
                <button className="flex items-center gap-2 text-purple-500 hover:text-purple-400">
                  <span className="text-sm font-medium sm:text-base">View All</span>
                  <ArrowRight className="h-4 w-4" />
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
                      {gallery.isVideo && apiSource === "redgifs" ? (
                        <div className="relative h-full w-full">
                          <video
                            src={`/api/proxy-media?url=${encodeURIComponent(gallery.url)}`}
                            poster={`/api/proxy-media?url=${encodeURIComponent(gallery.thumbnail)}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="rounded-full bg-purple-600/90 p-4 backdrop-blur-sm transition-transform group-hover:scale-110">
                              <Play className="h-8 w-8 text-white" fill="white" />
                            </div>
                          </div>
                        </div>
                      ) : gallery.thumbnail ? (
                        <Image
                          src={gallery.thumbnail || "/placeholder.svg"}
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
                src={`/api/proxy-media?url=${encodeURIComponent(selectedGallery.url)}`}
                poster={`/api/proxy-media?url=${encodeURIComponent(selectedGallery.thumbnail)}`}
                controls
                autoPlay
                loop
                className="max-h-[80vh] w-full rounded-lg bg-black"
                playsInline
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
