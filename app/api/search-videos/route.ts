import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log("[v0] Searching eporner API for:", query)

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
  } catch (error) {
    console.error("[v0] Error searching videos:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search videos" },
      { status: 500 },
    )
  }
}
