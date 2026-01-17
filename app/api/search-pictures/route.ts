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

    console.log("[v0] Fetching pictures:", { query, category, galleryId, page, api, endpointType })

    if (api === "redgifs") {
      return await fetchRedGifs(query, page)
    }

    return await fetchPornPics({ query, category, galleryId, page, endpointType })
  } catch (error) {
    console.error("[v0] Error fetching pictures:", error)
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

  console.log("[v0] Fetching PornPics from:", apiUrl)

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok && galleryId && endpointType !== "images") {
    const cleanPath = galleryId.replace(/^\/+/, "").replace(/\/+$/, "")
    const fallbackUrl = `${baseUrl}/tag/${cleanPath}`
    console.log("[v0] Gallery endpoint failed, trying tag endpoint:", fallbackUrl)

    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()
      console.log("[v0] Fallback tag response:", JSON.stringify(fallbackData).substring(0, 500))

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

    console.error("[v0] PornPics API error:", response.status)
    return NextResponse.json({
      error: `API returned ${response.status}`,
      galleries: [],
      photos: [],
      page: 1,
      total: 0,
    })
  }

  if (!response.ok) {
    console.error("[v0] PornPics API error:", response.status, await response.text())
    throw new Error(`API returned ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] Pornpics API response:", JSON.stringify(data).substring(0, 500))

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

  console.log("[v0] Result - galleries:", galleries.length, "photos:", photos.length)

  return NextResponse.json({
    galleries,
    photos,
    page,
    total: galleries.length + photos.length,
  })
}

async function fetchRedGifs(query: string, page: number) {
  try {
    const now = Date.now()
    if (!cachedToken || cachedToken.expires < now) {
      const authResponse = await fetch("https://api.redgifs.com/v2/auth/temporary", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      })

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error("[v0] RedGifs auth failed:", authResponse.status, errorText)
        throw new Error(`RedGifs auth failed: ${authResponse.status}`)
      }

      const authData = await authResponse.json()
      cachedToken = {
        token: authData.token,
        expires: now + 3600000,
      }
      console.log("[v0] RedGifs new token obtained successfully")
    } else {
      console.log("[v0] RedGifs using cached token")
    }

    const accessToken = cachedToken.token

    const endpoint = query
      ? `https://api.redgifs.com/v2/gifs/search?search_text=${encodeURIComponent(query)}&order=trending&count=40&page=${page}`
      : `https://api.redgifs.com/v2/gifs/search?search_text=&order=trending&count=40&page=${page}`

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] RedGifs API error:", response.status, errorBody)
      if (response.status === 401) {
        cachedToken = null
        console.log("[v0] Token invalid, retrying with fresh token...")
        return fetchRedGifs(query, page)
      }
      throw new Error(`RedGifs API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] RedGifs API response:", JSON.stringify(data).substring(0, 500))

    const galleries =
      data.gifs?.map((gif: any) => {
        const thumbnail = gif.urls?.poster || gif.urls?.thumbnail || ""
        const videoUrl = gif.urls?.sd || gif.urls?.hd || gif.urls?.mobile || gif.urls?.vthumbnail || ""
        const title = gif.tags && gif.tags.length > 0 ? gif.tags.join(", ") : gif.userName || gif.id || "Untitled"

        console.log(
          "[v0] Processing gif:",
          gif.id,
          "thumbnail:",
          thumbnail?.substring(0, 80),
          "videoUrl:",
          videoUrl?.substring(0, 80),
        )

        return {
          id: gif.id || Math.random().toString(),
          title: title,
          url: videoUrl,
          thumbnail: thumbnail,
          preview: thumbnail,
          tags: gif.tags || [],
          photoCount: 1,
          isVideo: true,
        }
      }) || []

    console.log(
      "[v0] Processed galleries:",
      galleries.length,
      "first thumbnail:",
      galleries[0]?.thumbnail?.substring(0, 80),
      "first video:",
      galleries[0]?.url?.substring(0, 80),
    )

    return NextResponse.json({
      galleries,
      photos: [],
      page,
      total: galleries.length,
    })
  } catch (error) {
    console.error("[v0] RedGifs error:", error)
    throw error
  }
}
