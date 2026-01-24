import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Get audio stream URL for a YouTube video
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    let audioUrl: string | null = null
    let error: string | null = null

    // Try Piped API instances first (more reliable)
    const pipedInstances = [
      "https://pipedapi.kavin.rocks",
      "https://pipedapi.adminforge.de",
      "https://api.piped.privacydev.net",
      "https://pipedapi.r4fo.com",
    ]

    for (const instance of pipedInstances) {
      try {
        const response = await fetch(`${instance}/streams/${videoId}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (!response.ok) continue

        const data = await response.json()

        // Get audio streams and sort by bitrate
        const audioStreams = data.audioStreams || []
        if (audioStreams.length > 0) {
          audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
          audioUrl = audioStreams[0].url
          break
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "Unknown error"
        continue
      }
    }

    // Fallback to Invidious API
    if (!audioUrl) {
      const invidiousInstances = [
        "https://invidious.fdn.fr",
        "https://inv.tux.pizza",
        "https://invidious.privacyredirect.com",
        "https://vid.puffyan.us",
        "https://invidious.nerdvpn.de",
        "https://invidious.jing.rocks",
      ]

      for (const instance of invidiousInstances) {
        try {
          const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })

          if (!response.ok) continue

          const data = await response.json()

          // Find the best audio-only format
          const audioFormats = data.adaptiveFormats?.filter((f: any) =>
            f.type?.startsWith("audio/") || f.encoding?.includes("opus") || f.encoding?.includes("aac")
          ) || []

          // Sort by bitrate to get best quality
          audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))

          if (audioFormats.length > 0) {
            audioUrl = audioFormats[0].url
            break
          }

          // Fallback to combined formats if no audio-only
          const combinedFormats = data.formatStreams || []
          if (combinedFormats.length > 0) {
            audioUrl = combinedFormats[0].url
            break
          }
        } catch (e) {
          error = e instanceof Error ? e.message : "Unknown error"
          continue
        }
      }
    }

    if (!audioUrl) {
      return NextResponse.json({
        error: "Could not get audio stream",
        details: error,
      }, { status: 500 })
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

    // Fetch the audio stream
    const response = await fetch(audioUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Range": "bytes=0-",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || "audio/webm"
    const audioBuffer = await response.arrayBuffer()

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
      { status: 500 }
    )
  }
}
