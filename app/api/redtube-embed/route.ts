import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("video_id")

    if (!videoId) {
      return NextResponse.json({ error: "video_id is required" }, { status: 400 })
    }

    console.log(`[v0] Fetching RedTube embed code for video:`, videoId)

    // Fetch the embed code from RedTube API
    const apiUrl = `https://api.redtube.com/?data=redtube.Videos.getVideoEmbedCode&video_id=${videoId}&output=json`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`[v0] RedTube embed API error:`, response.status, errorText.substring(0, 200))
      throw new Error(`RedTube embed API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[v0] RedTube embed API response:`, JSON.stringify(data).substring(0, 200))

    if (data.embed?.code) {
      // Decode the BASE64 embed code
      const decodedEmbed = Buffer.from(data.embed.code, "base64").toString("utf-8")
      console.log(`[v0] Decoded embed code:`, decodedEmbed.substring(0, 300))

      // Extract the embed URL from the HTML - look for iframe src or embed src
      const iframeSrcMatch = decodedEmbed.match(/src="([^"]*embed[^"]*)"/i)
      const embedSrcMatch = decodedEmbed.match(/embed\s+src="([^"]*)"/i)

      let embedUrl = iframeSrcMatch?.[1] || embedSrcMatch?.[1] || `https://embed.redtube.com/?id=${videoId}`

      // Clean up the URL - fix http to https
      embedUrl = embedUrl.replace(/^http:/, "https:")

      console.log(`[v0] Extracted embed URL:`, embedUrl)

      return NextResponse.json({
        embed_url: embedUrl,
        raw_html: decodedEmbed,
        video_id: videoId,
      })
    }

    // Fallback to default embed URL
    return NextResponse.json({
      embed_url: `https://embed.redtube.com/?id=${videoId}`,
      raw_html: null,
      video_id: videoId,
    })
  } catch (error) {
    console.error("[v0] Error fetching RedTube embed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch embed code",
        embed_url: `https://embed.redtube.com/?id=${request.nextUrl.searchParams.get("video_id")}`,
      },
      { status: 500 },
    )
  }
}
