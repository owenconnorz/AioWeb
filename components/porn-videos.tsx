"use client"
import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Play, ExternalLink } from "lucide-react"

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

export function PornVideos() {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/search-videos?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to search videos")
      }

      setVideos(data.videos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search videos")
      console.error("Video search error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Porn Videos</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Search and browse adult video content</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="search" className="text-slate-900 dark:text-white">
            Search Videos
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="search"
              type="text"
              placeholder="Enter search terms..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 dark:bg-slate-700 dark:text-white"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {videos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={video.default_thumb.src || "/placeholder.svg"}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
                    {video.length_min}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-2 line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
                    {video.title}
                  </h3>
                  <div className="mb-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span>{video.views.toLocaleString()} views</span>
                    <span>★ {video.rate.toFixed(1)}</span>
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Watch Video
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && videos.length === 0 && searchQuery && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-slate-600 dark:text-slate-400">No videos found. Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
