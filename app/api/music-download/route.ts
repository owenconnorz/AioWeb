import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Extract best audio URL from InnerTube streaming data
function extractAudioUrl(streamingData: any): string | null {
  const formats = streamingData?.adaptiveFormats || []
  const audioFormats = formats.filter((f: any) => f.mimeType?.startsWith("audio/") && f.url)
  audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
  
  if (audioFormats.length > 0) {
    return audioFormats[0].url
  }
  
  // Fallback to combined formats
  const combinedFormats = streamingData?.formats || []
  if (combinedFormats.length > 0 && combinedFormats[0].url) {
    return combinedFormats[0].url
  }
  
  return null
}

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

    // Try InnerTube ANDROID_TESTSUITE client (doesn't require login)
    try {
      const response = await fetch(
        "https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "com.google.android.youtube/17.36.4 (Linux; U; Android 13) gzip",
            "X-YouTube-Client-Name": "30",
            "X-YouTube-Client-Version": "1.9",
          },
          body: JSON.stringify({
            videoId,
            context: {
              client: {
                clientName: "ANDROID_TESTSUITE",
                clientVersion: "1.9",
                androidSdkVersion: 33,
                hl: "en",
                gl: "US",
              },
            },
            contentCheckOk: true,
            racyCheckOk: true,
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.playabilityStatus?.status === "OK" && data.streamingData) {
          audioUrl = extractAudioUrl(data.streamingData)
        } else {
          error = data.playabilityStatus?.reason || "ANDROID_TESTSUITE failed"
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "ANDROID_TESTSUITE error"
    }

    // Fallback: Try ANDROID_VR client (also bypasses login)
    if (!audioUrl) {
      try {
        const response = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "com.google.android.apps.youtube.vr.oculus/1.57.29 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
              "X-YouTube-Client-Name": "28",
              "X-YouTube-Client-Version": "1.57.29",
            },
            body: JSON.stringify({
              videoId,
              context: {
                client: {
                  clientName: "ANDROID_VR",
                  clientVersion: "1.57.29",
                  deviceMake: "Oculus",
                  deviceModel: "Quest 3",
                  androidSdkVersion: 32,
                  hl: "en",
                  gl: "US",
                },
              },
              contentCheckOk: true,
              racyCheckOk: true,
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.playabilityStatus?.status === "OK" && data.streamingData) {
            audioUrl = extractAudioUrl(data.streamingData)
          } else {
            error = data.playabilityStatus?.reason || "ANDROID_VR failed"
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "ANDROID_VR error"
      }
    }

    // Fallback: Try TVHTML5_SIMPLY_EMBEDDED_PLAYER
    if (!audioUrl) {
      try {
        const response = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0",
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
                  embedUrl: "https://www.google.com",
                },
              },
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.playabilityStatus?.status === "OK" && data.streamingData) {
            audioUrl = extractAudioUrl(data.streamingData)
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "TVHTML5 error"
      }
    }

    // Final fallback: Try IOS client
    if (!audioUrl) {
      try {
        const response = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)",
              "X-YouTube-Client-Name": "5",
              "X-YouTube-Client-Version": "19.29.1",
            },
            body: JSON.stringify({
              videoId,
              context: {
                client: {
                  clientName: "IOS",
                  clientVersion: "19.29.1",
                  deviceMake: "Apple",
                  deviceModel: "iPhone16,2",
                  hl: "en",
                  gl: "US",
                },
              },
              contentCheckOk: true,
              racyCheckOk: true,
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.playabilityStatus?.status === "OK" && data.streamingData) {
            audioUrl = extractAudioUrl(data.streamingData)
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "IOS error"
      }
    }

    if (!audioUrl) {
      return NextResponse.json(
        {
          error: "Could not get audio stream",
          details: error || "All methods failed",
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
