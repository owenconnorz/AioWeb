import { type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const embedUrl = searchParams.get("url")

    if (!embedUrl) {
      return new Response("Missing embed URL", { status: 400 })
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: "https://www.google.com/",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    }

    const response = await fetch(embedUrl, { headers })
    const html = await response.text()

    let videoUrl = ""

    const hlsMatch = html.match(/html5player\.setVideoHLS\(['"]([^'"]+)['"]\)/)
    if (hlsMatch) {
      videoUrl = hlsMatch[1]
    }

    const urlMatch = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/)
    if (!videoUrl && urlMatch) {
      videoUrl = urlMatch[1]
    }

    const mp4Match = html.match(/src:\s*['"]([^'"]+\.mp4[^'"]*)['"]/i)
    if (!videoUrl && mp4Match) {
      videoUrl = mp4Match[1]
    }

    const sourceMatch = html.match(/<source[^>]+src=['"]([^'"]+)['"]/i)
    if (!videoUrl && sourceMatch) {
      videoUrl = sourceMatch[1]
    }

    const videoDataMatch = html.match(/video_url['"]\s*:\s*['"]([^'"]+)['"]/i)
    if (!videoUrl && videoDataMatch) {
      videoUrl = videoDataMatch[1]
    }

    if (!videoUrl) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; }
            .error { color: #fff; text-align: center; padding: 40px; font-family: -apple-system, sans-serif; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Could not extract video URL</h1>
            <p>This video format is not supported yet.</p>
          </div>
        </body>
        </html>
      `,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      )
    }

    if (videoUrl.startsWith("//")) {
      videoUrl = "https:" + videoUrl
    } else if (videoUrl.startsWith("/")) {
      const embedDomain = new URL(embedUrl)
      videoUrl = embedDomain.origin + videoUrl
    }

    const isHLS = videoUrl.includes(".m3u8")

    const playerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
          video { width: 100%; height: 100%; object-fit: contain; }
          .error { color: #fff; text-align: center; padding: 40px; font-family: -apple-system, sans-serif; }
        </style>
        ${isHLS ? '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>' : ""}
      </head>
      <body>
        <video id="player" controls autoplay playsinline></video>
        <script>
          const video = document.getElementById('player');
          const videoUrl = "${videoUrl}";

          ${
            isHLS
              ? `
          if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
            });
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              video.play().catch(e => console.log('Autoplay prevented'));
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
            video.play().catch(e => console.log('Autoplay prevented'));
          }
          `
              : `
          video.src = videoUrl;
          video.play().catch(e => console.log('Autoplay prevented'));
          `
          }
        </script>
      </body>
      </html>
    `

    return new Response(playerHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    return new Response("Error loading video", { status: 500 })
  }
}
