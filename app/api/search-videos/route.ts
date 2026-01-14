import { type NextRequest, NextResponse } from "next/server"

interface XvidapiVideo {
  id?: number
  name?: string
  slug?: string
  origin_name?: string
  tag?: string
  category?: string[]
  poster?: string
  episodes?: {
    server_name?: string
    server_data?: {
      [key: string]: {
        slug?: string
        title?: string
        link_embed?: string
      }
    }
  }
  created_at?: string
  updated_at?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const source = searchParams.get("source") || "eporner" // Get API source parameter

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log(`[v0] Searching ${source} API for:`, query)

    if (source === "xvidapi") {
      return await searchXvidapi(query)
    } else {
      return await searchEporner(query)
    }
  } catch (error) {
    console.error("[v0] Error searching videos:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search videos" },
      { status: 500 },
    )
  }
}

async function searchEporner(query: string) {
  const response = await fetch(
    `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=12&format=json`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  )

  if (!response.ok) {
    throw new Error(`eporner API error: ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] eporner API response:", data)

  return NextResponse.json({
    videos: data.videos || [],
    total: data.count || 0,
  })
}

async function searchXvidapi(query: string) {
  const isPopular = query === "popular"
  const apiUrl = isPopular
    ? "https://xvidapi.com/api.php/provide/vod?ac=detail&at=json&pg=1"
    : `https://xvidapi.com/api.php/provide/vod?ac=detail&at=json&wd=${encodeURIComponent(query)}`

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`xvidapi API error: ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] xvidapi raw response sample:", JSON.stringify(data.list?.[0] || {}).slice(0, 800))

  const transformedVideos = (data.list || []).slice(0, 12).map((video: XvidapiVideo) => {
    const videoId = video.slug || video.id != null ? String(video.id) : `temp-${Date.now()}-${Math.random()}`

    let embedUrl = ""
    let duration = "Unknown"
    let thumbnail = ""

    // Get poster/thumbnail from the poster field
    if (video.poster) {
      thumbnail = video.poster
    }

    // Extract embed URL from episodes data
    if (video.episodes?.server_data) {
      const firstServer = Object.values(video.episodes.server_data)[0]
      if (firstServer?.link_embed) {
        embedUrl = firstServer.link_embed
        // Extract duration from title if available (e.g., "Full - Title")
        const titleText = firstServer.title || ""
        const parts = titleText.split(" - ")
        if (parts.length > 0 && parts[0].includes(":")) {
          duration = parts[0]
        }
      }
    }

    const title = video.name || video.origin_name || "Untitled"

    console.log(`[v0] Transformed video ${videoId}: thumbnail=${thumbnail}, embed=${embedUrl}`)

    return {
      id: videoId,
      title: title,
      keywords: video.tag || "",
      views: 0, // xvidapi doesn't provide view counts
      rate: 0, // xvidapi doesn't provide ratings
      url: embedUrl,
      added: video.updated_at || video.created_at || "",
      length_sec: 0,
      length_min: duration,
      embed: embedUrl,
      default_thumb: thumbnail
        ? {
            src: thumbnail,
            size: "640x360",
            width: 640,
            height: 360,
          }
        : null,
      thumbs: [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} transformed videos`)

  return NextResponse.json({
    videos: transformedVideos,
    total: data.total || 0,
  })
}
