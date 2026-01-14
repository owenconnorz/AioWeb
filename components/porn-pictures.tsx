"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Loader2, ArrowRight } from "lucide-react"

interface Gallery {
  id: string
  title: string
  url: string
  thumbnail: string
  preview: string
  tags: string[]
  photos?: string[]
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
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setGalleries([])
    setError("")
    setSearchQuery("")
    loadGalleries()
  }, [apiSource])

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

  const handleCategoryClick = (gallery: Gallery) => {
    window.open(gallery.url, "_blank", "noopener,noreferrer")
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
                {galleries.map((gallery) => (
                  <div
                    key={gallery.id}
                    onClick={() => handleCategoryClick(gallery)}
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

                    <div className="aspect-video w-full overflow-hidden bg-slate-900">
                      {gallery.thumbnail ? (
                        <img
                          src={gallery.thumbnail || "/placeholder.svg"}
                          alt={gallery.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            console.log("[v0] Image failed to load:", gallery.thumbnail)
                            e.currentTarget.style.display = "none"
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900"><svg class="h-16 w-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></div>`
                            }
                          }}
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
    </div>
  )
}
