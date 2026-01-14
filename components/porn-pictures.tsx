"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, ExternalLink, Loader2, ArrowRight } from "lucide-react"

interface Gallery {
  id: string
  title: string
  url: string
  thumbnail: string
  preview: string
  tags: string[]
}

export function PornPictures() {
  const [searchQuery, setSearchQuery] = useState("")
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadGalleries()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && !loading) {
          loadMoreGalleries()
        }
      },
      { threshold: 0.1 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadingMore, hasMore, loading, page])

  const loadGalleries = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/search-pictures?page=1`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load galleries")
      }

      setGalleries(data.galleries || [])
      setPage(1)
      setHasMore(data.galleries && data.galleries.length > 0)
    } catch (err) {
      console.error("[v0] Error loading galleries:", err)
      setError(err instanceof Error ? err.message : "Failed to load galleries")
    } finally {
      setLoading(false)
    }
  }

  const loadMoreGalleries = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1

      const url = searchQuery
        ? `/api/search-pictures?query=${encodeURIComponent(searchQuery)}&page=${nextPage}`
        : `/api/search-pictures?page=${nextPage}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load more galleries")
      }

      if (data.galleries && data.galleries.length > 0) {
        setGalleries((prev) => [...prev, ...data.galleries])
        setPage(nextPage)
        setHasMore(data.galleries.length > 0)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("[v0] Error loading more galleries:", err)
    } finally {
      setLoadingMore(false)
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

      const response = await fetch(`/api/search-pictures?query=${encodeURIComponent(searchQuery)}&page=1`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search galleries")
      }

      setGalleries(data.galleries || [])
      setPage(1)
      setHasMore(data.galleries && data.galleries.length > 0)
    } catch (err) {
      console.error("[v0] Error searching galleries:", err)
      setError(err instanceof Error ? err.message : "Failed to search galleries")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search galleries..."
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
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {searchQuery ? "Search Results" : "Popular Galleries"}
              </h2>
              {!searchQuery && (
                <button className="flex items-center gap-2 text-purple-500 hover:text-purple-400">
                  <span className="text-sm font-medium sm:text-base">View All</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {galleries.map((gallery) => (
                <div
                  key={gallery.id}
                  onClick={() => setSelectedGallery(gallery)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900"
                >
                  <div className="aspect-video w-full">
                    {gallery.thumbnail ? (
                      <img
                        src={gallery.thumbnail || "/placeholder.svg"}
                        alt={gallery.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ExternalLink className="h-16 w-16 text-white/40" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
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
                </div>
              ))}
            </div>
          </div>

          <div ref={observerTarget} className="flex justify-center py-4">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-purple-600" />}
            {!hasMore && galleries.length > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No more galleries to load</p>
            )}
          </div>
        </>
      )}

      {selectedGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 p-6">
            <button
              onClick={() => setSelectedGallery(null)}
              className="absolute right-4 top-4 rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <h2 className="pr-12 text-2xl font-bold text-white">{selectedGallery.title}</h2>

              <div className="aspect-video w-full overflow-hidden rounded-lg">
                {selectedGallery.preview ? (
                  <img
                    src={selectedGallery.preview || "/placeholder.svg"}
                    alt={selectedGallery.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                    <ExternalLink className="h-24 w-24 text-white/40" />
                  </div>
                )}
              </div>

              <a
                href={selectedGallery.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700"
              >
                <ExternalLink className="h-5 w-5" />
                View Full Gallery
              </a>

              {selectedGallery.tags && selectedGallery.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedGallery.tags.map((tag, idx) => (
                    <span key={idx} className="rounded-full bg-purple-600/30 px-3 py-1 text-sm text-purple-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
