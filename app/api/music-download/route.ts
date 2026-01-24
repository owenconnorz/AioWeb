import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Helper to extract audio URL from streaming data
function extractAudioUrl(streamingData: any): string | null {
  // Get adaptive formats (audio-only streams)
  const formats = streamingData?.adaptiveFormats || []

  // Filter for audio-only formats with direct URLs
  const audioFormats = formats.filter(
    (f: any) => f.mimeType?.startsWith("audio/") && f.url
  )

  // Sort by bitrate (highest first)
  audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))

  if (audioFormats.length > 0) {
    return audioFormats[0].url
  }

  // Try combined formats if no audio-only
  const combinedFormats = streamingData?.formats || []
  if (combinedFormats.length > 0 && combinedFormats[0].url) {
    return combinedFormats[0].url
  }

  return null
}

// Get audio stream URL for a YouTube video using InnerTube API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    let audioUrl: string | null = null
    let error: string | null = null

    // Try TV Embedded HTML5 client first (doesn't require sign-in)
    try {
      const response = await fetch(
        "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version",
          },
          body: JSON.stringify({
            videoId,
            context: {
              client: {
                clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
                clientVersion: "2.0",
                hl: "en",
                gl: "US",
              },
              thirdParty: {
                embedUrl: "https://www.youtube.com",
              },
            },
            playbackContext: {
              contentPlaybackContext: {
                signatureTimestamp: 20073,
              },
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.playabilityStatus?.status === "OK" && data.streamingData) {
          audioUrl = extractAudioUrl(data.streamingData)
        } else {
          error = data.playabilityStatus?.reason || "TV client failed"
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "TV client error"
    }

    // Fallback: Try WEB client with embed context
    if (!audioUrl) {
      try {
        const response = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Origin": "https://www.youtube.com",
              "Referer": "https://www.youtube.com/",
            },
            body: JSON.stringify({
              videoId,
              context: {
                client: {
                  clientName: "WEB_EMBEDDED_PLAYER",
                  clientVersion: "1.20240101.00.00",
                  hl: "en",
                  gl: "US",
                },
                thirdParty: {
                  embedUrl: "https://www.youtube.com",
                },
              },
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.playabilityStatus?.status === "OK" && data.streamingData) {
            audioUrl = extractAudioUrl(data.streamingData)
          } else {
            error = data.playabilityStatus?.reason || "WEB embed client failed"
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "WEB embed error"
      }
    }

    // Fallback: Try Android client (may require different handling)
    if (!audioUrl) {
      try {
        const response = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
              "X-YouTube-Client-Name": "3",
              "X-YouTube-Client-Version": "19.09.37",
            },
            body: JSON.stringify({
              videoId,
              context: {
                client: {
                  clientName: "ANDROID",
                  clientVersion: "19.09.37",
                  androidSdkVersion: 30,
                  hl: "en",
                  gl: "US",
                },
              },
              contentCheckOk: true,
              racyCheckOk: true,
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.playabilityStatus?.status === "OK" && data.streamingData) {
            audioUrl = extractAudioUrl(data.streamingData)
          } else {
            error = data.playabilityStatus?.reason || "Android client failed"
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "Android client error"
      }
    }

    // Final fallback: iOS client
    if (!audioUrl) {
      try {
        const response = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 17_4 like Mac OS X)",
              "X-YouTube-Client-Name": "5",
              "X-YouTube-Client-Version": "19.09.3",
            },
            body: JSON.stringify({
              videoId,
              context: {
                client: {
                  clientName: "IOS",
                  clientVersion: "19.09.3",
                  deviceModel: "iPhone14,3",
                  hl: "en",
                  gl: "US",
                },
              },
              contentCheckOk: true,
              racyCheckOk: true,
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.playabilityStatus?.status === "OK" && data.streamingData) {
            audioUrl = extractAudioUrl(data.streamingData)
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "iOS client error"
      }
    }

    if (!audioUrl) {
      return NextResponse.json(
        {
          error: "Could not get audio stream",
          details: error || "No audio formats available",
        },
        { status: 500 }
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
      { status: 500 }
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
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 min timeout

    const response = await fetch(audioUrl, {
      headers: {
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
        "Accept": "audio/webm,audio/mp4,audio/*,*/*",
        "Range": "bytes=0-",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to download audio" }, { status: 500 })
  }
}
