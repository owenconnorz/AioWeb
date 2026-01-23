import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("id")

    if (!videoId) {
      return new Response("Video ID required", { status: 400 })
    }

    // Fetch video info from our API
    const apiUrl = new URL("/api/redtube-embed", request.url)
    apiUrl.searchParams.set("video_id", videoId)
    
    const response = await fetch(apiUrl.toString())
    const data = await response.json()

    if (data.player_html) {
      return new Response(data.player_html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "X-Frame-Options": "ALLOWALL",
        },
      })
    }

    // Fallback: create a player that fetches video directly
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
          .loading { color: #fff; text-align: center; }
          .spinner { width: 50px; height: 50px; border: 4px solid #333; border-top-color: #f00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          video { width: 100%; height: 100%; max-height: 100vh; object-fit: contain; }
          .error { color: #f00; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div id="player" class="loading">
          <div class="spinner"></div>
          <p>Loading video...</p>
        </div>
        <script>
          async function loadVideo() {
            try {
              const response = await fetch('/api/redtube-embed?video_id=${videoId}');
              const data = await response.json();
              
              if (data.stream_url) {
                document.getElementById('player').innerHTML = \`
                  <video controls autoplay playsinline>
                    \${data.qualities?.map(q => \`<source src="\${q.url}" type="video/mp4">\`).join('') || ''}
                    <source src="\${data.stream_url}" type="video/mp4">
                  </video>
                \`;
              } else {
                // No direct stream, show error
                document.getElementById('player').innerHTML = '<div class="error">Video unavailable in your region</div>';
              }
            } catch (e) {
              document.getElementById('player').innerHTML = '<div class="error">Failed to load video</div>';
            }
          }
          loadVideo();
        </script>
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
