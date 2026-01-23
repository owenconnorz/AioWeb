import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("video_id")

    if (!videoId) {
      return NextResponse.json({ error: "video_id is required" }, { status: 400 })
    }

    // Use RedTube's official API to get video info including media URLs
    const apiUrl = `https://api.redtube.com/?data=redtube.Videos.getVideoById&video_id=${videoId}&output=json`
    
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "X-Forwarded-For": "177.67.80.1",
        "CF-IPCountry": "BR",
      },
    })

    const apiData = await apiResponse.json()
    
    let videoStreamUrl = null
    let qualities: { quality: string; url: string }[] = []
    let thumbUrl = ""

    // Extract video info from API response
    if (apiData.video) {
      const video = apiData.video
      thumbUrl = video.thumb || video.default_thumb || ""
      
      // Check for mediaDefinitions in the API response
      if (video.mediaDefinitions && Array.isArray(video.mediaDefinitions)) {
        for (const def of video.mediaDefinitions) {
          if (def.videoUrl && def.quality) {
            qualities.push({ quality: String(def.quality), url: def.videoUrl })
          }
        }
      }
      
      // Try other URL fields
      if (!videoStreamUrl && video.mp4) {
        videoStreamUrl = video.mp4
      }
      if (!videoStreamUrl && video.flv) {
        videoStreamUrl = video.flv
      }
    }

    // Sort qualities and get best one
    if (qualities.length > 0) {
      qualities.sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
      videoStreamUrl = qualities[0].url
    }

    // If API doesn't return video URLs, try scraping the embed page with different approach
    if (!videoStreamUrl) {
      // Try fetching from PornHub's CDN pattern (RedTube uses same parent company)
      const embedUrl = `https://www.redtube.com/embed/${videoId}`
      
      const embedResponse = await fetch(embedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "X-Forwarded-For": "191.96.232.1",
          "CF-IPCountry": "AR",
          "Cookie": "platform=mobile; age_verified=1; accessAgeDisclaimerRT=1; countryCode=AR; ss=246810121416",
        },
      })
      
      const embedHtml = await embedResponse.text()
      
      // Look for video URLs in various formats
      const patterns = [
        /mediaDefinitions\s*[:=]\s*(\[[\s\S]*?\])\s*[,;}\n]/,
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /quality_\d+p?\s*[:=]\s*["']([^"']+\.mp4[^"']*)/gi,
        /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
        /src=["']([^"']*\.mp4[^"']*)/gi,
      ]
      
      for (const pattern of patterns) {
        const matches = embedHtml.match(pattern)
        if (matches) {
          for (const match of matches) {
            // Clean up the match
            let url = match.replace(/.*["']([^"']+)["'].*/, '$1')
            if (url.startsWith('http') && url.includes('.mp4')) {
              videoStreamUrl = url
              break
            }
          }
          if (videoStreamUrl) break
        }
      }
      
      // Try parsing mediaDefinitions JSON
      const mediaMatch = embedHtml.match(/mediaDefinitions['"]\s*[:=]\s*(\[[\s\S]*?\])/)
      if (mediaMatch) {
        try {
          const mediaDefs = JSON.parse(mediaMatch[1])
          for (const def of mediaDefs) {
            if (def.videoUrl) {
              qualities.push({ quality: String(def.quality || '720'), url: def.videoUrl })
            }
          }
          if (qualities.length > 0) {
            qualities.sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
            videoStreamUrl = qualities[0].url
          }
        } catch (e) {}
      }
    }

    const embedUrl = `https://embed.redtube.com/?id=${videoId}`

    return NextResponse.json({
      video_id: videoId,
      stream_url: videoStreamUrl,
      qualities: qualities,
      embed_url: embedUrl,
      thumbnail: thumbUrl,
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
          <video controls autoplay playsinline poster="${thumbUrl}">
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
