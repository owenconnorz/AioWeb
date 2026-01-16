import { type NextRequest, NextResponse } from "next/server"

interface XvidapiVideo {
  id?: number
  name?: string
  slug?: string
  origin_name?: string
  tag?: string
  category?: string[]
  poster?: string
  poster_url?: string
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
    const page = Number.parseInt(searchParams.get("page") || "1", 10) // Added page parameter for pagination

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log(`[v0] Searching ${source} API for:`, query, `page:`, page)

    if (source === "camsoda") {
      return await searchCamSoda(page)
    } else if (source === "cam4") {
      return await searchCam4(page)
    } else if (source === "xvidapi") {
      return await searchXvidapi(query, page)
    } else {
      return await searchEporner(query, page)
    }
  } catch (error) {
    console.error("[v0] Error searching videos:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search videos" },
      { status: 500 },
    )
  }
}

async function searchEporner(query: string, page = 1) {
  const response = await fetch(
    `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=12&page=${page}&format=json`,
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
  console.log(`[v0] eporner API response page ${page}:`, data.count, "videos")

  return NextResponse.json({
    videos: data.videos || [],
    total: data.count || 0,
  })
}

async function searchXvidapi(query: string, page = 1) {
  const isPopular = query === "popular"
  const apiUrl = isPopular
    ? `https://xvidapi.com/api.php/provide/vod?ac=detail&at=json&pg=${page}`
    : `https://xvidapi.com/api.php/provide/vod?ac=detail&at=json&wd=${encodeURIComponent(query)}&pg=${page}`

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
  console.log(`[v0] xvidapi page ${page}:`, (data.list || []).length, "videos")

  const transformedVideos = (data.list || []).slice(0, 12).map((video: XvidapiVideo) => {
    const videoId = video.slug || video.id != null ? String(video.id) : `temp-${Date.now()}-${Math.random()}`

    let embedUrl = ""
    let duration = "Unknown"
    let thumbnail = ""

    if (video.poster_url) {
      thumbnail = video.poster_url
    } else if (video.poster) {
      thumbnail = video.poster
    }

    if (video.episodes?.server_data) {
      const firstServer = Object.values(video.episodes.server_data)[0]
      if (firstServer?.link_embed) {
        embedUrl = firstServer.link_embed
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
      views: 0,
      rate: 0,
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

async function searchCam4(page = 1) {
  const apiUrl = `https://api.cam4pays.com/api/v1/cams/online.json?aff_id=66db08bf0f40da23bf28e055&prog=rs&gender=female&limit=50&order_by=viewers_desc`
  console.log(`[v0] Fetching Cam4 API:`, apiUrl)

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    console.log(`[v0] Cam4 API error status:`, response.status)
    throw new Error(`Cam4 API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] Cam4 API response:`, Array.isArray(data) ? data.length : 0, "cams")

  const transformedVideos = (Array.isArray(data) ? data : []).map((cam: any) => {
    return {
      id: cam.nickname || `cam-${cam.id || Date.now()}-${Math.random()}`,
      title: cam.nickname || "Live Cam",
      keywords: cam.show_tags?.join(", ") || cam.status || "",
      views: cam.viewers || 0,
      rate: 0,
      url: cam.link || "",
      added: new Date().toISOString(),
      length_sec: 0,
      length_min: "LIVE",
      embed: cam.preview_url || cam.link || "",
      default_thumb: {
        src: cam.thumb_big || cam.thumb || cam.profile_thumb || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} live cams`)

  return NextResponse.json({
    videos: transformedVideos,
    total: transformedVideos.length,
  })
}

async function searchCamSoda(page = 1) {
  const apiUrl = `https://www.camsoda.com/api/v1/browse/online?limit=50&offset=${(page - 1) * 50}`
  console.log(`[v0] Fetching CamSoda API:`, apiUrl)

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    console.log(`[v0] CamSoda API error status:`, response.status)
    throw new Error(`CamSoda API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] CamSoda API response:`, data.results?.length || 0, "cams")

  const transformedVideos = (data.results || []).map((cam: any) => {
    const username = cam.username || cam.user?.username || `cam-${Date.now()}`
    const thumbUrl = cam.thumb || cam.thumbnail || `/placeholder.svg?height=360&width=640`

    return {
      id: username,
      title: username,
      keywords: cam.tags?.join(", ") || cam.status || "Live",
      views: cam.num_users || cam.viewers || 0,
      rate: 0,
      url: `https://www.camsoda.com/${username}`,
      added: new Date().toISOString(),
      length_sec: 0,
      length_min: "LIVE",
      embed: `https://www.camsoda.com/${username}`,
      default_thumb: {
        src: thumbUrl,
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} CamSoda live cams`)

  return NextResponse.json({
    videos: transformedVideos,
    total: transformedVideos.length,
  })
}
