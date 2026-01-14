import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Proxy route called")

  if (!request.nextUrl) {
    console.error("[v0] request.nextUrl is undefined")
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const url = request.nextUrl.searchParams.get("url")
  console.log("[v0] Proxy URL param:", url)

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.redgifs.com/",
      },
    })

    if (!response.ok) {
      console.error("[v0] Fetch failed:", response.status, response.statusText)
      return NextResponse.json({ error: "Failed to fetch media" }, { status: response.status })
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return NextResponse.json({ error: "Failed to proxy media" }, { status: 500 })
  }
}
