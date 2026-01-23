import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("id")

    if (!videoId) {
      return new Response("Video ID required", { status: 400 })
    }

    // Use the official RedTube API getVideoEmbedCode endpoint
    // This returns a BASE64 encoded embed HTML that should work properly
    const apiUrl = `https://api.redtube.com/?data=redtube.Videos.getVideoEmbedCode&video_id=${videoId}&output=json`
    
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    })

    const data = await response.json()

    if (data.embed?.code) {
      // Decode the BASE64 embed code
      const decodedEmbed = Buffer.from(data.embed.code, "base64").toString("utf-8")
      
      // Extract iframe src from decoded HTML
      const srcMatch = decodedEmbed.match(/src="([^"]+)"/)
      let embedSrc = srcMatch?.[1] || `https://embed.redtube.com/?id=${videoId}`
      
      // Fix http to https
      embedSrc = embedSrc.replace(/^http:/, "https:")
      
      // Create a full HTML page with the embed
      const playerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe 
            src="${embedSrc}" 
            allowfullscreen 
            allow="autoplay; fullscreen; encrypted-media"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </body>
        </html>
      `

      return new Response(playerHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "X-Frame-Options": "ALLOWALL",
        },
      })
    }

    // Fallback: redirect to RedTube directly
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, sans-serif; }
          .container { text-align: center; padding: 20px; }
          h2 { color: #fff; margin-bottom: 10px; }
          p { color: #999; margin-bottom: 20px; font-size: 14px; }
          a { color: #fff; text-decoration: none; display: inline-block; padding: 12px 24px; background: #c00; border-radius: 8px; font-weight: 500; }
          a:hover { background: #e00; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Video Unavailable</h2>
          <p>This video cannot be embedded. Click below to watch on RedTube.</p>
          <a href="https://www.redtube.com/${videoId}" target="_blank" rel="noopener">Watch on RedTube</a>
        </div>
      </body>
      </html>
    `

    return new Response(fallbackHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "X-Frame-Options": "ALLOWALL",
      },
    })
  } catch (error) {
    return new Response("Error loading video", { status: 500 })
  }
}
