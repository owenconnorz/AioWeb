import { type NextRequest, NextResponse } from "next/server"

interface XvidapiVideo {
  vod_id: number
  vod_name: string
  vod_pic: string
  vod_remarks: string
  vod_time: string
  vod_play_url: string
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
  console.log("[v0] xvidapi API response:", data)

  const transformedVideos = (data.list || []).slice(0, 12).map((video: XvidapiVideo) => {
    const playUrl = video.vod_play_url ? video.vod_play_url.split("$")[1] || "" : ""
    const duration = video.vod_remarks || "Unknown"

    return {
      id: video.vod_id.toString(),
      title: video.vod_name,
      keywords: "",
      views: 0,
      rate: 0,
      url: playUrl,
      added: video.vod_time,
      length_sec: 0,
      length_min: duration,
      embed: playUrl,
      default_thumb: {
        src: video.vod_pic || "/placeholder.svg",
        size: "640x360",
        width: 640,
        height: 360,
      },
      thumbs: [],
    }
  })

  return NextResponse.json({
    videos: transformedVideos,
    total: data.total || 0,
  })
}
