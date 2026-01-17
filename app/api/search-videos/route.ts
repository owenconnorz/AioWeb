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
    const source = searchParams.get("source") || "eporner"
    const page = Number.parseInt(searchParams.get("page") || "1", 10)

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log(`[v0] Searching ${source} API for:`, query, `page:`, page)

    if (source === "chaturbate") {
      return await searchChaturbate(page)
    } else if (source === "cam4") {
      return await searchCam4(page)
    } else if (source === "xvidapi") {
      return await searchXvidapi(query, page)
    } else if (source === "redtube") {
      return await searchRedTube(query, page)
    } else if (source === "youporn") {
      return await searchYouPorn(query, page)
    } else if (source === "tube8") {
      return await searchTube8(query, page)
    } else if (source === "xhamster") {
      return await searchXHamster(query, page)
    } else if (source === "spankbang") {
      return await searchSpankBang(query, page)
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

async function searchChaturbate(page = 1) {
  // The /affiliates/api/onlinerooms/ endpoint is more permissive
  const apiUrl = `https://chaturbate.com/affiliates/api/onlinerooms/?wm=aBtQT&format=json&limit=50&offset=${(page - 1) * 50}&gender=f`
  console.log(`[v0] Fetching Chaturbate API:`, apiUrl)

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.log(`[v0] Chaturbate API error:`, response.status, errorText.substring(0, 200))
    throw new Error(`Chaturbate API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(
    `[v0] Chaturbate API response:`,
    data.results?.length || (Array.isArray(data) ? data.length : 0),
    "models",
  )

  // Chaturbate API returns either { results: [...] } or just an array
  const models = data.results || (Array.isArray(data) ? data : [])

  if (models.length > 0) {
    console.log(`[v0] Chaturbate first model sample:`, JSON.stringify(models[0]).substring(0, 500))
  }

  const transformedVideos = models.map((model: any) => {
    const username = model.username || model.room_slug || `model-${Date.now()}`

    // Using the iframe_embed URL format which provides just the video player without chat
    const embedUrl =
      model.iframe_embed ||
      `https://chaturbate.com/embed/${username}/?join_overlay=1&campaign=aBtQT&disable_sound=0&tour=9oGW`

    return {
      id: username,
      title: username,
      keywords: model.tags?.join(", ") || model.current_show || "Live",
      views: model.num_users || model.num_viewers || 0,
      rate: 0,
      url: `https://chaturbate.com/${username}`,
      added: new Date().toISOString(),
      length_sec: 0,
      length_min: "LIVE",
      embed: embedUrl,
      default_thumb: {
        src: model.image_url || model.image_url_360x270 || `/placeholder.svg?height=360&width=640`,
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} Chaturbate live models`)

  return NextResponse.json({
    videos: transformedVideos,
    total: transformedVideos.length,
  })
}

async function searchRedTube(query: string, page = 1) {
  const isPopular = query === "popular"
  const ordering = isPopular ? "mostviewed" : ""

  let apiUrl = `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=big&page=${page}`

  if (!isPopular && query) {
    apiUrl += `&search=${encodeURIComponent(query)}`
  }
  if (ordering) {
    apiUrl += `&ordering=${ordering}&period=weekly`
  }

  console.log(`[v0] Fetching RedTube API:`, apiUrl)

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.log(`[v0] RedTube API error:`, response.status, errorText.substring(0, 200))
    throw new Error(`RedTube API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] RedTube API response:`, data.videos?.length || 0, "videos")

  if (data.code && data.message) {
    throw new Error(data.message)
  }

  const videos = data.videos || []

  const transformedVideos = videos.map((item: any) => {
    const video = item.video
    // The API response includes embed_url field which is the official embed URL
    const embedUrl = video.embed_url || `https://embed.redtube.com/?id=${video.video_id}`

    return {
      id: video.video_id || `rt-${Date.now()}-${Math.random()}`,
      title: video.title || "Untitled",
      keywords: video.tags?.map((t: any) => t.tag_name).join(", ") || "",
      views: Number.parseInt(video.views || "0", 10),
      rate: Number.parseFloat(video.rating || "0"),
      url: video.url || `https://www.redtube.com/${video.video_id}`,
      added: video.publish_date || "",
      length_sec: Number.parseInt(video.duration || "0", 10),
      length_min: video.duration || "0:00",
      embed: embedUrl,
      default_thumb: {
        src: video.default_thumb || video.thumb || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: video.thumbs || [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} RedTube videos`)

  return NextResponse.json({
    videos: transformedVideos,
    total: data.count || transformedVideos.length,
  })
}

async function searchYouPorn(query: string, page = 1) {
  const isPopular = query === "popular"

  let apiUrl = `https://www.youporn.com/api/webmasters/search/?output=json&thumbsize=big&page=${page}`

  if (!isPopular && query) {
    apiUrl += `&search=${encodeURIComponent(query)}`
  }
  if (isPopular) {
    apiUrl += `&ordering=mostviewed&period=weekly`
  }

  console.log(`[v0] Fetching YouPorn API:`, apiUrl)

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.log(`[v0] YouPorn API error:`, response.status, errorText.substring(0, 200))
    throw new Error(`YouPorn API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] YouPorn API response:`, data.videos?.length || 0, "videos")

  const videos = data.videos || []

  const transformedVideos = videos.map((video: any) => {
    const embedUrl = video.embed_url || `https://www.youporn.com/embed/${video.video_id}`

    return {
      id: video.video_id || `yp-${Date.now()}-${Math.random()}`,
      title: video.title || "Untitled",
      keywords: video.tags?.map((t: any) => t.tag_name).join(", ") || "",
      views: Number.parseInt(video.views || "0", 10),
      rate: Number.parseFloat(video.rating || "0"),
      url: video.url || `https://www.youporn.com/watch/${video.video_id}`,
      added: video.publish_date || "",
      length_sec: Number.parseInt(video.duration || "0", 10),
      length_min: video.duration || "0:00",
      embed: embedUrl,
      default_thumb: {
        src: video.default_thumb || video.thumb || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: video.thumbs || [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} YouPorn videos`)

  return NextResponse.json({
    videos: transformedVideos,
    total: data.count || transformedVideos.length,
  })
}

async function searchTube8(query: string, page = 1) {
  const isPopular = query === "popular"

  let apiUrl = `https://api.tube8.com/api.php?data=tube8.Videos.searchVideos&output=json&thumbsize=big&page=${page}`

  if (!isPopular && query) {
    apiUrl += `&search=${encodeURIComponent(query)}`
  }
  if (isPopular) {
    apiUrl += `&ordering=mostviewed&period=weekly`
  }

  console.log(`[v0] Fetching Tube8 API:`, apiUrl)

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.log(`[v0] Tube8 API error:`, response.status, errorText.substring(0, 200))
    throw new Error(`Tube8 API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] Tube8 API response:`, data.videos?.length || 0, "videos")

  const videos = data.videos || []

  const transformedVideos = videos.map((item: any) => {
    const video = item.video || item
    const embedUrl = video.embed_url || `https://www.tube8.com/embed/${video.video_id}`

    return {
      id: video.video_id || `t8-${Date.now()}-${Math.random()}`,
      title: video.title || "Untitled",
      keywords: video.tags?.map((t: any) => t.tag_name).join(", ") || "",
      views: Number.parseInt(video.views || "0", 10),
      rate: Number.parseFloat(video.rating || "0"),
      url: video.url || `https://www.tube8.com/video/${video.video_id}`,
      added: video.publish_date || "",
      length_sec: Number.parseInt(video.duration || "0", 10),
      length_min: video.duration || "0:00",
      embed: embedUrl,
      default_thumb: {
        src: video.default_thumb || video.thumb || video.preview || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: [],
    }
  })

  console.log(`[v0] Returning ${transformedVideos.length} Tube8 videos`)

  return NextResponse.json({
    videos: transformedVideos,
    total: data.count || transformedVideos.length,
  })
}

async function searchXHamster(query: string, page = 1) {
  const isPopular = query === "popular"

  // xHamster uses a different API structure
  let apiUrl = `https://xhamster.com/api/front/content?page=${page}&categories[]=all`

  if (!isPopular && query) {
    apiUrl = `https://xhamster.com/api/front/search?q=${encodeURIComponent(query)}&page=${page}`
  }

  console.log(`[v0] Fetching xHamster API:`, apiUrl)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      // Fall back to a simpler endpoint if the main one fails
      console.log(`[v0] xHamster API primary endpoint failed, status:`, response.status)
      throw new Error(`xHamster API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[v0] xHamster API response:`, data.videos?.length || data.data?.length || 0, "videos")

    const videos = data.videos || data.data || []

    const transformedVideos = videos.slice(0, 20).map((video: any) => {
      const videoId = video.id || video.video_id || `xh-${Date.now()}-${Math.random()}`
      const embedUrl = `https://xhamster.com/embed/${videoId}`

      return {
        id: videoId,
        title: video.title || video.name || "Untitled",
        keywords: video.categories?.join(", ") || video.tags?.join(", ") || "",
        views: video.views || 0,
        rate: video.rating || 0,
        url: video.pageURL || video.url || `https://xhamster.com/videos/${videoId}`,
        added: video.created || "",
        length_sec: video.duration || 0,
        length_min: video.durationFormatted || "0:00",
        embed: embedUrl,
        default_thumb: {
          src: video.thumbURL || video.thumb || video.preview || "/placeholder.svg",
          size: "640x360",
          width: 640,
          height: 360,
        },
        thumbs: [],
      }
    })

    console.log(`[v0] Returning ${transformedVideos.length} xHamster videos`)

    return NextResponse.json({
      videos: transformedVideos,
      total: data.total || transformedVideos.length,
    })
  } catch (error) {
    console.error("[v0] xHamster API error:", error)
    // Return empty result instead of throwing
    return NextResponse.json({
      videos: [],
      total: 0,
      error: "xHamster API temporarily unavailable",
    })
  }
}

async function searchSpankBang(query: string, page = 1) {
  const isPopular = query === "popular"

  // SpankBang has a simple search endpoint
  const apiUrl = isPopular
    ? `https://spankbang.com/api/videos/trending?page=${page}`
    : `https://spankbang.com/s/${encodeURIComponent(query)}/${page}/`

  console.log(`[v0] Fetching SpankBang:`, apiUrl)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/json",
      },
    })

    if (!response.ok) {
      console.log(`[v0] SpankBang error:`, response.status)
      throw new Error(`SpankBang error: ${response.status}`)
    }

    // SpankBang doesn't have a proper JSON API, so we parse HTML or use fallback
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      const videos = data.videos || data.data || []

      const transformedVideos = videos.map((video: any) => ({
        id: video.id || `sb-${Date.now()}-${Math.random()}`,
        title: video.title || "Untitled",
        keywords: video.tags?.join(", ") || "",
        views: video.views || 0,
        rate: video.rating || 0,
        url: video.url || `https://spankbang.com/${video.id}/video/`,
        added: video.uploaded || "",
        length_sec: video.duration || 0,
        length_min: video.length || "0:00",
        embed: `https://spankbang.com/${video.id}/embed/`,
        default_thumb: {
          src: video.thumb || video.preview || "/placeholder.svg",
          size: "640x360",
          width: 640,
          height: 360,
        },
        thumbs: [],
      }))

      return NextResponse.json({
        videos: transformedVideos,
        total: data.total || transformedVideos.length,
      })
    }

    // Return empty if no JSON API available
    return NextResponse.json({
      videos: [],
      total: 0,
      error: "SpankBang API requires scraping - limited functionality",
    })
  } catch (error) {
    console.error("[v0] SpankBang error:", error)
    return NextResponse.json({
      videos: [],
      total: 0,
      error: "SpankBang temporarily unavailable",
    })
  }
}
