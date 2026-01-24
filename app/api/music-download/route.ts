import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Working Cobalt API instances (sorted by reliability score)
const COBALT_INSTANCES = [
  "https://cobalt-api.meowing.de",
  "https://cobalt-backend.canine.tools",
  "https://capi.3kh0.net",
  "https://downloadapi.stuff.solutions",
]

// Get audio stream URL for a YouTube video using Cobalt API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    let audioUrl: string | null = null
    let error: string | null = null
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Try Cobalt API instances
    for (const instance of COBALT_INSTANCES) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)

        const response = await fetch(instance, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            url: youtubeUrl,
            downloadMode: "audio",
            audioFormat: "mp3",
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          error = `${instance} returned ${response.status}`
          continue
        }

        const data = await response.json()

        // Handle different response formats from Cobalt
        if (data.status === "tunnel" && data.url) {
          audioUrl = data.url
          break
        } else if (data.status === "redirect" && data.url) {
          audioUrl = data.url
          break
        } else if (data.status === "stream" && data.url) {
          audioUrl = data.url
          break
        } else if (data.url) {
          audioUrl = data.url
          break
        } else if (data.status === "error") {
          error = data.error?.code || data.text || "Cobalt error"
          continue
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "Unknown error"
        continue
      }
    }

    if (!audioUrl) {
      return NextResponse.json(
        {
          error: "Could not get audio stream",
          details: error || "All Cobalt instances failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      videoId,
      audioUrl,
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get audio stream" },
      { status: 500 },
    )
  }
}

// Proxy endpoint to download audio and return as blob
export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json()

    if (!audioUrl) {
      return NextResponse.json({ error: "audioUrl is required" }, { status: 400 })
    }

    // Fetch the audio stream with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 min timeout for large files

    const response = await fetch(audioUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "audio/mpeg,audio/mp3,audio/webm,audio/mp4,audio/*,*/*",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg"
    const audioBuffer = await response.arrayBuffer()

    if (audioBuffer.byteLength === 0) {
      throw new Error("Received empty audio file")
    }

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download audio" },
      { status: 500 },
    )
  }
}
