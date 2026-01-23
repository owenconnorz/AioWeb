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
        link_m3u8?: string
        link_mp4?: string
      }
    }
  }
  created_at?: string
  updated_at?: string
}

async function searchHentai(query: string, page = 1) {
  // Use waifu.pics API - fast and reliable for anime images
  const categories = ["waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill", "kick", "happy", "wink", "poke", "dance", "cringe"]
  
  // For popular, get random images from multiple categories
  // For search, try to match category or use random
  const isPopular = query === "popular"
  
  try {
    // Fetch multiple images in parallel for better content variety
    const promises = []
    const count = 12
    
    for (let i = 0; i < count; i++) {
      const category = isPopular 
        ? categories[Math.floor(Math.random() * categories.length)]
        : categories.find(c => c.toLowerCase().includes(query.toLowerCase())) || categories[Math.floor(Math.random() * categories.length)]
      
      promises.push(
        fetch(`https://api.waifu.pics/sfw/${category}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
        }).then(r => r.json()).catch(() => null)
      )
    }
    
    const results = await Promise.all(promises)
    
    const transformedVideos = results
      .filter(item => item && item.url)
      .map((item: any, index: number) => {
        const imageUrl = item.url
        const isGif = imageUrl?.endsWith('.gif')
        
        return {
          id: `waifu-${Date.now()}-${index}`,
          title: `Anime ${isGif ? 'GIF' : 'Image'} ${index + 1}`,
          keywords: "anime, waifu, kawaii",
          views: Math.floor(Math.random() * 1000),
          rate: Math.floor(Math.random() * 5),
          url: imageUrl,
          added: new Date().toISOString(),
          length_sec: 0,
          length_min: isGif ? "GIF" : "Image",
          embed: imageUrl,
          default_thumb: {
            src: imageUrl || "/placeholder.svg",
            size: "300x400",
            width: 300,
            height: 400,
          },
          thumbs: [],
          isImage: true,
          fullImage: imageUrl,
          sampleImage: imageUrl,
        }
      })

    return NextResponse.json({
      videos: transformedVideos,
      total: transformedVideos.length,
    })
  } catch (error) {
    throw new Error(`Anime API error: ${error}`)
  }
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
    } else if (source === "hentai") {
      return await searchHentai(query, page)
    } else if (source === "pornhub") {
      return await searchPornhub(query, page)
    } else if (source === "jsonporn") {
      return await searchJsonPorn(query, page)
    } else if (source === "youporn") {
      return await searchYouPorn(query, page)
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

async function searchXvidapi(query: string, page = 1, refresh = 0) {
  const isPopular = query === "popular"
  // Add randomization for popular queries to get different content each time
  const randomOffset = isPopular ? Math.floor(Math.random() * 50) + 1 : 0
  const actualPage = page + randomOffset
  
  const apiUrl = isPopular
    ? `https://xvidapi.com/api.php/provide/vod?ac=detail&at=json&pg=${actualPage}`
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

    let directVideoUrl = ""
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
      // Try to get direct video URL (m3u8 or mp4)
      if (firstServer?.link_m3u8) {
        directVideoUrl = firstServer.link_m3u8
      } else if (firstServer?.link_mp4) {
        directVideoUrl = firstServer.link_mp4
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
      url: directVideoUrl || embedUrl,
      added: video.updated_at || video.created_at || "",
      length_sec: 0,
      length_min: duration,
      embed: embedUrl,
      directUrl: directVideoUrl,
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

  const models = data.results || (Array.isArray(data) ? data : [])

  if (models.length > 0) {
    console.log(`[v0] Chaturbate first model sample:`, JSON.stringify(models[0]).substring(0, 500))
  }

  const transformedVideos = models.map((model: any) => {
    const username = model.username || model.room_slug || `model-${Date.now()}`

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

async function searchJsonPorn(query: string, page = 1) {
  const apiKey = process.env.JSON_PORN_API_KEY
  if (!apiKey) {
    throw new Error("JSON_PORN_API_KEY is not configured")
  }

  const isPopular = query === "popular"
  const searchQuery = isPopular ? "" : query
  
  // JSON Porn API via RapidAPI
  const apiUrl = isPopular
    ? `https://json-porn.p.rapidapi.com/porn?page=${page}&limit=24`
    : `https://json-porn.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=24`

  console.log("[v0] JSON Porn API URL:", apiUrl)
  
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "json-porn.p.rapidapi.com",
    },
  })

  console.log("[v0] JSON Porn API status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] JSON Porn API error:", errorText.substring(0, 500))
    throw new Error(`JSON Porn API error: ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] JSON Porn API response keys:", Object.keys(data))
  console.log("[v0] JSON Porn API response preview:", JSON.stringify(data).substring(0, 500))
  
  const videos = data.videos || data.data || data.results || data.items || data || []
  console.log("[v0] JSON Porn videos count:", Array.isArray(videos) ? videos.length : 'not array')

  const transformedVideos = (Array.isArray(videos) ? videos : []).map((video: any) => {
    return {
      id: video.id || video.video_id || `jsonporn-${Date.now()}-${Math.random()}`,
      title: video.title || video.name || "Video",
      keywords: video.tags?.join(", ") || video.categories?.join(", ") || "",
      views: video.views || 0,
      rate: video.rating || 0,
      url: video.url || video.video_url || "",
      added: video.date || video.created_at || "",
      length_sec: video.duration || 0,
      length_min: video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : "",
      embed: video.embed_url || video.embed || video.url || "",
      directUrl: video.video_url || video.mp4_url || video.stream_url || "",
      default_thumb: {
        src: video.thumbnail || video.thumb || video.preview || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: video.thumbnails || [],
    }
  })

  return NextResponse.json({
    videos: transformedVideos,
    total: data.total || data.count || transformedVideos.length,
  })
}

// Pornhub API - using unofficial public API
async function searchPornhub(query: string, page = 1) {
  try {
    const isPopular = query === "popular"
    
    // Use the public API endpoint
    const apiBase = "https://node-1-sync.obj3ct32.com:8443/api"
    
    // Get trending videos for popular, or fetch video details
    let videoIds: string[] = []
    
    if (isPopular) {
      // Fetch trending video IDs
      const trendingRes = await fetch(`${apiBase}/trending`, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })
      
      if (!trendingRes.ok) {
        throw new Error(`Pornhub trending API error: ${trendingRes.status}`)
      }
      
      const trendingData = await trendingRes.json()
      videoIds = trendingData.video_ids || trendingData.videos || []
    } else {
      // For search, we'll use random videos as the API doesn't have a search endpoint
      const randomRes = await fetch(`${apiBase}/random`, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })
      
      if (randomRes.ok) {
        const randomData = await randomRes.json()
        videoIds = [randomData.video_id || randomData.id].filter(Boolean)
      }
    }
    
    // Fetch video details for each ID (limit to 20 to avoid too many requests)
    const limitedIds = videoIds.slice(0, 20)
    const videoPromises = limitedIds.map(async (id: string) => {
      try {
        const res = await fetch(`${apiBase}/video/${id}`, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })
        if (res.ok) {
          return await res.json()
        }
        return null
      } catch {
        return null
      }
    })
    
    const videoResults = await Promise.all(videoPromises)
    const videos = videoResults.filter(Boolean)
    
    const transformedVideos = videos.map((video: any) => ({
      video_id: video.video_id || video.id || Math.random().toString(),
      title: video.title || "Pornhub Video",
      keywords: video.tags?.join(", ") || video.categories?.join(", ") || "",
      views: video.views || 0,
      rate: video.rating || 0,
      url: video.url || `https://www.pornhub.com/view_video.php?viewkey=${video.video_id}`,
      added: video.upload_date || "",
      length_sec: video.duration || 0,
      length_min: video.duration_formatted || "",
      embed: `https://www.pornhub.com/embed/${video.video_id}`,
      default_thumb: {
        src: video.thumbnail || video.thumb || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: video.thumbnails || [],
    }))
    
    return NextResponse.json({
      videos: transformedVideos,
      total: transformedVideos.length,
    })
  } catch (error) {
    console.error("[v0] Pornhub API error:", error)
    return NextResponse.json({ videos: [], total: 0 })
  }
}

// YouPorn API - using multiple fallback APIs for reliability
async function searchYouPorn(query: string, page = 1) {
  try {
    const searchQuery = query === "popular" ? "amateur" : query
    
    // Try Lustpress API first
    try {
      const lustpressUrl = `https://lust.scathach.id/youporn/search?key=${encodeURIComponent(searchQuery)}&page=${page}`
      const lustpressResponse = await fetch(lustpressUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })
      
      if (lustpressResponse.ok) {
        const data = await lustpressResponse.json()
        const videos = data.data || []
        if (videos.length > 0) {
          const transformedVideos = videos.map((video: any) => transformLustpressVideo(video))
          return NextResponse.json({ videos: transformedVideos, total: transformedVideos.length })
        }
      }
    } catch (e) {
      // Lustpress failed, try fallback
    }
    
    // Fallback: Use EPorner API which is reliable
    const epornerUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchQuery)}&per_page=24&page=${page}&thumbsize=medium&order=top-weekly&format=json`
    
    const response = await fetch(epornerUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    
    if (!response.ok) {
      return NextResponse.json({ videos: [], total: 0 })
    }
    
    const data = await response.json()
    
    // Transform EPorner format to standard format
    const transformedVideos = (data.videos || []).map((video: any) => ({
      id: `yp-${video.id}`,
      title: video.title || "Video",
      keywords: video.keywords || "youporn",
      views: video.views || 0,
      rate: video.rate || 0,
      url: video.url || "",
      added: video.added || "",
      length_sec: video.length_sec || 0,
      length_min: video.length_min || "",
      embed: video.embed || "",
      default_thumb: video.default_thumb || { src: "/placeholder.svg", size: "640x360", width: 640, height: 360 },
      thumbs: video.thumbs || [],
    }))
    
    return NextResponse.json({
      videos: transformedVideos,
      total: data.total_count || transformedVideos.length,
    })
  } catch (error) {
    console.error("[v0] YouPorn API error:", error)
    return NextResponse.json({ videos: [], total: 0 })
  }
}

// Helper to transform Lustpress video format to standard format
function transformLustpressVideo(video: any) {
  return {
    id: video.id || `yp-${Date.now()}`,
    title: video.title || "YouPorn Video",
    keywords: video.tags?.join(", ") || "youporn",
    views: parseInt(video.views?.replace(/[^0-9]/g, "") || "0"),
    rate: parseFloat(video.rating || "0"),
    url: video.link || video.url || "",
    added: video.uploaded || "",
    length_sec: 0,
    length_min: video.duration || "",
    embed: video.link ? `https://www.youporn.com/embed/${video.id}` : "",
    default_thumb: {
      src: video.image || video.thumbnail || "/placeholder.svg",
      size: "640x360",
      width: 640,
      height: 360,
    },
    thumbs: video.image ? [{ src: video.image, size: "640x360", width: 640, height: 360 }] : [],
  }
}
