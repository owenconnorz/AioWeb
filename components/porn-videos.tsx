"use client"
import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Play, Eye, ThumbsUp, ArrowRight } from "lucide-react"

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
    <div className="space-y-6 pb-24">
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

      {error && <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>}

      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Hottest New Videos</h2>
            <button className="flex items-center gap-2 text-lg font-medium text-violet-500 hover:text-violet-400">
              View All
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {videos.map((video) => (
              <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="space-y-3">
                  {/* Video Thumbnail */}
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
                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                      {video.length_min}
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="space-y-2">
                    <h3 className="line-clamp-2 text-base font-normal leading-snug text-white group-hover:text-violet-400">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{(video.views / 1000).toFixed(0)}K Views</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{Math.round(video.rate * 10)}% Up</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && videos.length === 0 && searchQuery && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
          <p className="text-slate-400">No videos found. Try a different search term.</p>
        </div>
      )}
    </div>
  )
}
