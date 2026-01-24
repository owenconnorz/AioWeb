import { type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get("id")

    if (!videoId) {
      return new Response("Video ID required", { status: 400 })
    }

    // The embed URL format for RedTube
    // Using the embed URL directly instead of fetching from API (which returns "No video with this ID" for some videos)
    const embedSrc = `https://embed.redtube.com/?id=${videoId}`
    
    // Create an HTML page that serves as a wrapper for the embed
    // This acts as an intermediary origin which may help with CORS/referrer issues
    const playerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="referrer" content="no-referrer">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: none; }
          .error { display: none; color: #fff; text-align: center; padding: 40px; font-family: -apple-system, sans-serif; }
          .error h2 { margin-bottom: 15px; }
          .error p { color: #999; margin-bottom: 20px; }
          .error a { color: #fff; background: #c00; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <iframe 
          id="player"
          src="${embedSrc}" 
          allowfullscreen 
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerpolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        ></iframe>
        <div id="error" class="error">
          <h2>Video Blocked</h2>
          <p>This video cannot be embedded from this location.</p>
          <a href="https://www.redtube.com/${videoId}" target="_blank" rel="noopener">Watch on RedTube</a>
        </div>
        <script>
          // Detect if iframe fails to load
          const iframe = document.getElementById('player');
          const error = document.getElementById('error');
          
          iframe.onerror = function() {
            iframe.style.display = 'none';
            error.style.display = 'block';
          };
          
          // Also check after a timeout if content seems blocked
          setTimeout(function() {
            try {
              // If we can't access iframe content and it looks empty, show error
              if (iframe.contentWindow && iframe.contentWindow.document.body.innerHTML === '') {
                iframe.style.display = 'none';
                error.style.display = 'block';
              }
            } catch(e) {
              // Cross-origin, which is expected - do nothing
            }
          }, 5000);
        </script>
      </body>
      </html>
    `

    return new Response(playerHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "X-Frame-Options": "ALLOWALL",
        "Content-Security-Policy": "frame-ancestors *",
      },
    })
  } catch (error) {
    return new Response("Error loading video", { status: 500 })
  }
}
