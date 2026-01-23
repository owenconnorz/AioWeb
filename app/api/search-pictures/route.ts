import { type NextRequest, NextResponse } from "next/server"

let cachedToken: { token: string; expires: number } | null = null

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const category = searchParams.get("category") || ""
    const galleryId = searchParams.get("gallery") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const api = searchParams.get("api") || "pornpics"
    const endpointType = searchParams.get("endpointType") || ""

    

    if (api === "redgifs") {
      return await fetchRedGifs(query, page)
    }
    
    if (api === "rule34") {
      return await fetchRule34(query, page)
    }

    return await fetchPornPics({ query, category, galleryId, page, endpointType })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch galleries",
        galleries: [],
        photos: [],
        page: 1,
        total: 0,
      },
      { status: 500 },
    )
  }
}

async function fetchPornPics({
  query,
  category,
  galleryId,
  page,
  endpointType,
}: {
  query: string
  category: string
  galleryId: string
  page: number
  endpointType: string
}) {
  const baseUrl = "https://ppics-api.vercel.app/api"
  let apiUrl = ""

  if (galleryId) {
    const cleanPath = galleryId.replace(/^\/+/, "").replace(/\/+$/, "")

    if (endpointType === "images") {
      apiUrl = `${baseUrl}/tag/${cleanPath}`
    } else {
      apiUrl = `${baseUrl}/gallery/${cleanPath}${page > 1 ? `?page=${page}` : ""}`
    }
  } else if (category) {
    const categorySlug = category.toLowerCase().replace(/\s+/g, "-")
    apiUrl = `${baseUrl}/gallery/${categorySlug}`
  } else if (query && query !== "popular") {
    apiUrl = `${baseUrl}/gallery/${encodeURIComponent(query)}`
  } else {
    apiUrl = `${baseUrl}/home`
  }

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok && galleryId && endpointType !== "images") {
    const cleanPath = galleryId.replace(/^\/+/, "").replace(/\/+$/, "")
    const fallbackUrl = `${baseUrl}/tag/${cleanPath}`

    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()

      if (fallbackData.images && Array.isArray(fallbackData.images)) {
        const photos = fallbackData.images.map((url: string, index: number) => ({
          id: index.toString(),
          url: url,
          thumbnail: url,
        }))

        return NextResponse.json({
          photos,
          galleries: [],
          page: 1,
          total: photos.length,
        })
      }
    }

    return NextResponse.json({
      error: `API returned ${response.status}`,
      galleries: [],
      photos: [],
      page: 1,
      total: 0,
    })
  }

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }

  const data = await response.json()

  let galleries = []
  let photos = []

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
    photos = data.map((url: string, index: number) => ({
      id: index.toString(),
      url: url,
      thumbnail: url,
    }))

    return NextResponse.json({
      photos,
      galleries: [],
      page: 1,
      total: photos.length,
    })
  }

  if (data.images && Array.isArray(data.images)) {
    photos = data.images.map((item: any, index: number) => ({
      id: index.toString(),
      url: typeof item === "string" ? item : item.url || item.src || item.image || "",
      thumbnail: typeof item === "string" ? item : item.thumbnail || item.thumb || item.url || "",
    }))

    return NextResponse.json({
      photos,
      galleries: [],
      page: 1,
      total: photos.length,
    })
  } else if (data.galleries && Array.isArray(data.galleries)) {
    galleries = data.galleries.map((item: any) => ({
      id: item.url || item.href || item.id || Math.random().toString(),
      title: item.title || item.name || "Untitled Gallery",
      url: item.url || item.href || "",
      thumbnail: item.thumbnail || item.thumb || item.cover_image || item.preview || "",
      preview: item.preview || item.thumbnail || item.thumb || item.cover_image || "",
      tags: item.tags || [],
      photoCount: item.photos || item.count || 0,
      isGallery: true,
    }))
  } else if (data.categories && Array.isArray(data.categories)) {
    galleries = data.categories.map((item: any) => ({
      id: item.href || Math.random().toString(),
      title: item.title || "Untitled Category",
      url: item.href || "",
      thumbnail: item.cover_image || "",
      preview: item.cover_image || "",
      tags: [item.title],
      photoCount: 0,
      isCategory: true,
    }))
  }

  

  return NextResponse.json({
    galleries,
    photos,
    page,
    total: galleries.length + photos.length,
  })
}

async function fetchRedGifs(query: string, page: number, retryCount = 0) {
  try {
    const now = Date.now()
    // Use consistent User-Agent for both auth and API requests
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    // Always get fresh token on retry or if expired/missing
    if (!cachedToken || cachedToken.expires < now || retryCount > 0) {
      const authResponse = await fetch("https://api.redgifs.com/v2/auth/temporary", {
        method: "GET",
        headers: {
          "User-Agent": userAgent,
          "Accept": "application/json",
        },
      })

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        throw new Error(`RedGifs auth failed: ${authResponse.status}`)
      }

      const authData = await authResponse.json()
      cachedToken = {
        token: authData.token,
        expires: now + 300000, // 5 minutes - shorter cache to avoid WrongSender
      }
    }

    const accessToken = cachedToken.token

    const endpoint = query
      ? `https://api.redgifs.com/v2/gifs/search?search_text=${encodeURIComponent(query)}&order=trending&count=40&page=${page}`
      : `https://api.redgifs.com/v2/gifs/search?search_text=&order=trending&count=40&page=${page}`

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401 && retryCount < 2) {
        cachedToken = null
        // Retry with a fresh token, but limit retries to prevent infinite loop
        return fetchRedGifs(query, page, retryCount + 1)
      }
      throw new Error(`RedGifs API returned ${response.status}`)
    }

    const data = await response.json()
    

    const galleries =
      data.gifs?.map((gif: any) => {
        const thumbnail = gif.urls?.poster || gif.urls?.thumbnail || ""
        // Use SD for faster loading, with mobile as fallback (smaller file sizes)
        const videoUrl = gif.urls?.sd || gif.urls?.mobile || gif.urls?.hd || gif.urls?.vthumbnail || ""
        // Also provide HD URL for quality toggle
        const hdUrl = gif.urls?.hd || gif.urls?.sd || ""
        const title = gif.tags && gif.tags.length > 0 ? gif.tags.join(", ") : gif.userName || gif.id || "Untitled"
        // Check if video has audio
        const hasAudio = gif.hasAudio === true || gif.has_audio === true

        return {
          id: gif.id || Math.random().toString(),
          title: title,
          url: videoUrl,
          hdUrl: hdUrl,
          thumbnail: thumbnail,
          preview: thumbnail,
          tags: gif.tags || [],
          photoCount: 1,
          isVideo: true,
          hasAudio: hasAudio,
          duration: gif.duration || 0,
          // Mark as RedGifs so we can skip proxy
          source: "redgifs",
        }
      }) || []

    return NextResponse.json({
      galleries,
      photos: [],
      page,
      total: galleries.length,
    })
  } catch (error) {
    throw error
  }
}

// Danbooru API - public API that doesn't require authentication for basic access
async function fetchRule34(query: string, page: number) {
  try {
    const isPopular = !query || query === "popular"
    // For popular, use order:score to get highest rated content
    const searchTags = isPopular ? "order:score" : query.replace(/\s+/g, "_")
    
    // Use Danbooru public API
    const apiUrl = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(searchTags)}&limit=40&page=${page}`
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Danbooru API error: ${response.status}`)
    }

    const posts = await response.json()
    // Danbooru returns array directly

    const galleries = (Array.isArray(posts) ? posts : []).map((post: any) => {
      const fileUrl = post.file_url || post.large_file_url || ""
      const isVideo = fileUrl.endsWith(".mp4") || fileUrl.endsWith(".webm")
      const tags = post.tag_string ? post.tag_string.split(" ").slice(0, 5) : []
      
      return {
        id: post.id?.toString() || Math.random().toString(),
        title: tags.join(", ") || "Danbooru",
        url: fileUrl,
        thumbnail: post.preview_file_url || post.large_file_url || "",
        preview: post.large_file_url || post.preview_file_url || "",
        tags: tags,
        photoCount: 1,
        isVideo: isVideo,
        hasAudio: isVideo,
        score: post.score || 0,
        width: post.image_width,
        height: post.image_height,
      }
    })

    return NextResponse.json({
      galleries,
      photos: [],
      page,
      total: galleries.length,
    })
  } catch (error) {
    throw error
  }
}
