import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const category = searchParams.get("category") || ""
    const galleryId = searchParams.get("gallery") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const api = searchParams.get("api") || "pornpics"

    console.log("[v0] Fetching pictures:", { query, category, galleryId, page, api })

    if (api === "redgifs") {
      return await fetchRedGifs(query, page)
    }

    return await fetchPornPics({ query, category, galleryId, page })
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
}: {
  query: string
  category: string
  galleryId: string
  page: number
}) {
  const baseUrl = "https://ppics-api.vercel.app/api"
  let apiUrl = ""

  if (galleryId) {
    apiUrl = `${baseUrl}/tag/${galleryId}`
  } else if (category) {
    const categorySlug = category.toLowerCase().replace(/\s+/g, "-")
    apiUrl = `${baseUrl}/gallery/${categorySlug}`
  } else if (query) {
    apiUrl = `${baseUrl}/gallery/${encodeURIComponent(query)}`
  } else {
    apiUrl = `${baseUrl}/home`
  }

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent": "NaughtyAI/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] Pornpics API response:", JSON.stringify(data).substring(0, 500))

  let galleries = []
  let photos = []

  if (data.images && Array.isArray(data.images)) {
    photos = data.images.map((item: any, index: number) => ({
      id: index.toString(),
      url: item.url || item.src || item.image || "",
      thumbnail: item.thumbnail || item.thumb || item.url || "",
    }))

    return NextResponse.json({
      photos,
      galleries: [],
      page: 1,
      total: photos.length,
    })
  } else if (data.galleries && Array.isArray(data.galleries)) {
    galleries = data.galleries.map((item: any) => ({
      id: item.id || item.url || item.href || Math.random().toString(),
      title: item.title || item.name || "Untitled Gallery",
      url: `https://www.pornpics.com${item.url || item.href || ""}`,
      thumbnail: item.thumbnail || item.thumb || item.cover_image || item.preview || "",
      preview: item.preview || item.thumbnail || item.thumb || item.cover_image || "",
      tags: item.tags || [],
      photoCount: item.photos || item.count || 0,
    }))
  } else if (data.categories && Array.isArray(data.categories)) {
    galleries = data.categories.map((item: any) => ({
      id: item.href || Math.random().toString(),
      title: item.title || "Untitled Category",
      url: `https://www.pornpics.com${item.href || ""}`,
      thumbnail: item.cover_image || "",
      preview: item.cover_image || "",
      tags: [item.title],
      photoCount: 0,
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
    const authResponse = await fetch("https://api.redgifs.com/v2/auth/temporary", {
      method: "GET",
      headers: {
        "User-Agent": "NaughtyAI/1.0",
      },
    })

    if (!authResponse.ok) {
      throw new Error(`RedGifs auth failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.token

    console.log("[v0] RedGifs token obtained successfully")

    const endpoint = query
      ? `https://api.redgifs.com/v2/gifs/search?search_text=${encodeURIComponent(query)}&order=trending&count=40&page=${page}`
      : `https://api.redgifs.com/v2/gifs/search?search_text=&order=trending&count=40&page=${page}`

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "NaughtyAI/1.0",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] RedGifs API error:", response.status, errorBody)
      throw new Error(`RedGifs API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] RedGifs API response:", JSON.stringify(data).substring(0, 500))

    const galleries =
      data.gifs?.map((gif: any) => {
        const thumbnail = gif.urls?.poster || gif.urls?.thumbnail || gif.urls?.vthumbnail || gif.urls?.sd || ""
        const title = gif.tags && gif.tags.length > 0 ? gif.tags.join(", ") : gif.userName || gif.id || "Untitled"

        console.log("[v0] Processing gif:", gif.id, "thumbnail:", thumbnail)

        return {
          id: gif.id || Math.random().toString(),
          title: title,
          url: `https://redgifs.com/watch/${gif.id}`,
          thumbnail: thumbnail,
          preview: thumbnail,
          tags: gif.tags || [],
          photoCount: 1,
        }
      }) || []

    console.log("[v0] Processed galleries:", galleries.length, "first thumbnail:", galleries[0]?.thumbnail)

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
