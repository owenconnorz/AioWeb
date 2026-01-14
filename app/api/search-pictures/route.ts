import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")

    console.log("[v0] Fetching pornpics galleries:", { query, page })

    const baseUrl = "https://ppics-api.vercel.app/api"
    let apiUrl = ""

    if (query) {
      // Search by tag/query
      apiUrl = `${baseUrl}/tag/${encodeURIComponent(query)}?page=${page}`
    } else {
      // Get popular galleries - the home endpoint returns categories, we need to fetch actual galleries
      // Using a popular category to get galleries
      apiUrl = `${baseUrl}/tag/popular?page=${page}`
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
    console.log("[v0] Pornpics API response structure:", JSON.stringify(data).substring(0, 500))

    let galleries = []

    // Check if response has galleries array
    if (data.galleries && Array.isArray(data.galleries)) {
      galleries = data.galleries.map((item: any) => ({
        id: item.id || item.url || Math.random().toString(),
        title: item.title || item.name || "Untitled Gallery",
        url: `https://www.pornpics.com${item.url || item.href || ""}`,
        thumbnail: item.thumbnail || item.thumb || item.cover_image || item.preview || "",
        preview: item.preview || item.thumbnail || item.thumb || item.cover_image || "",
        tags: item.tags || [],
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
      }))
    }

    console.log("[v0] Transformed galleries count:", galleries.length)

    return NextResponse.json({
      galleries,
      page,
      total: galleries.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching pornpics galleries:", error)
    return NextResponse.json({ error: "Failed to fetch galleries", galleries: [] }, { status: 500 })
  }
}
