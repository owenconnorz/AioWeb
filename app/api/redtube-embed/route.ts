import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("video_id")

    if (!videoId) {
      return NextResponse.json({ error: "video_id is required" }, { status: 400 })
    }

    // Fetch the video page directly to extract the video stream URL
    // Using Brazil location headers to bypass geo-restrictions
    const pageUrl = `https://www.redtube.com/${videoId}`
    
    const pageResponse = await fetch(pageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "X-Forwarded-For": "177.67.80.1",
        "CF-IPCountry": "BR",
        "Cookie": "platform=pc; age_verified=1; accessAgeDisclaimerRT=1; countryCode=BR; ageVerified=1",
      },
    })

    if (!pageResponse.ok) {
      throw new Error(`RedTube page fetch error: ${pageResponse.status}`)
    }

    const html = await pageResponse.text()

    // Extract video URL from the page - look for mediaDefinitions or video URLs
    const mediaDefMatch = html.match(/mediaDefinitions['"]\s*:\s*(\[[^\]]+\])/i)
    const videoUrlMatch = html.match(/videoUrl['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/i)
    const hlsMatch = html.match(/['"]quality_\d+['"]\s*:\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i)
    const mp4Match = html.match(/['"]videoUrl['"]\s*:\s*['"](https?:\/\/[^'"]+\.mp4[^'"]*)['"]/i) ||
                     html.match(/https?:\/\/[^'"]+cdn[^'"]+\.mp4[^'"]*/)
    
    let videoStreamUrl = null
    let qualities: { quality: string; url: string }[] = []

    // Try to parse mediaDefinitions for multiple qualities
    if (mediaDefMatch) {
      try {
        const mediaDefinitions = JSON.parse(mediaDefMatch[1])
        for (const def of mediaDefinitions) {
          if (def.videoUrl && def.quality) {
            qualities.push({ quality: def.quality, url: def.videoUrl })
          }
        }
        // Get the highest quality
        if (qualities.length > 0) {
          qualities.sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
          videoStreamUrl = qualities[0].url
        }
      } catch (e) {
        // Parsing failed, continue with other methods
      }
    }

    // Fallback to direct URL matches
    if (!videoStreamUrl) {
      videoStreamUrl = videoUrlMatch?.[1] || hlsMatch?.[1] || mp4Match?.[0]
    }

    // Also try to get the embed URL as fallback
    const embedUrl = `https://embed.redtube.com/?id=${videoId}`

    return NextResponse.json({
      video_id: videoId,
      stream_url: videoStreamUrl,
      qualities: qualities,
      embed_url: embedUrl,
      // Return a player HTML that bypasses geo-restriction by using direct video URL
      player_html: videoStreamUrl ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            video { width: 100%; height: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <video controls autoplay playsinline>
            ${qualities.map(q => `<source src="${q.url}" type="video/mp4" label="${q.quality}p">`).join('\n')}
            ${videoStreamUrl ? `<source src="${videoStreamUrl}" type="video/mp4">` : ''}
          </video>
        </body>
        </html>
      ` : null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch video",
        video_id: request.nextUrl.searchParams.get("video_id"),
        embed_url: `https://embed.redtube.com/?id=${request.nextUrl.searchParams.get("video_id")}`,
      },
      { status: 500 },
    )
  }
}
