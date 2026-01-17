import type React from "react"
// Video loading utility functions

type ApiSource = "redgifs" | "eporner" | "xvidapi" | "cam4" | "pornpics" | "chaturbate"

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
}

export async function loadVideos(
  apiSource: ApiSource,
  setSearchQuery: (query: string) => void,
  setVideos: (videos: Video[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  query = "",
  category = "",
  refreshKey = 0,
): Promise<void> {
  setLoading(true)
  setError("")

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
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load videos")
    console.error("Video load error:", err)
  } finally {
    setLoading(false)
  }
}

export async function loadMoreVideos(
  apiSource: ApiSource,
  page: number,
  setPage: (page: number) => void,
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>,
  setHasMore: (hasMore: boolean) => void,
  setLoadingMore: (loading: boolean) => void,
  searchQuery = "",
  selectedCategory = "",
): Promise<void> {
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
