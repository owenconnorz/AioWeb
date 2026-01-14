import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const category = searchParams.get("category") || ""
    const galleryId = searchParams.get("gallery") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")

    console.log("[v0] Fetching pornpics:", { query, category, galleryId, page })

    const baseUrl = "https://ppics-api.vercel.app/api"
    let apiUrl = ""

    if (galleryId) {
      apiUrl = `${baseUrl}/tag/${galleryId}`
    } else if (category) {
      const categorySlug = category.toLowerCase().replace(/\s+/g, "-")
      apiUrl = `${baseUrl}/gallery/${categorySlug}`
    } else if (query) {
      // Search uses gallery endpoint with query
      apiUrl = `${baseUrl}/gallery/${encodeURIComponent(query)}`
    } else {
      // Get categories from home endpoint
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
    }
    // Handle categories response from home endpoint
    else if (data.categories && Array.isArray(data.categories)) {
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
  } catch (error) {
    console.error("[v0] Error fetching pornpics:", error)
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
