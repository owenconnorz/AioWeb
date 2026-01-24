import { type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoUrl = searchParams.get("url")
    const poster = searchParams.get("poster") || ""

    if (!videoUrl) {
      return new Response("Video URL required", { status: 400 })
    }

    const isHLS = videoUrl.includes(".m3u8")
    
    // Create an HTML page with HLS.js for m3u8 streams or native video for mp4
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
        ${isHLS ? '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>' : ''}
      </head>
      <body>
        <video 
          id="player" 
          controls 
          autoplay 
          playsinline
          muted
          ${poster ? `poster="${poster}"` : ''}
        ></video>
        <script>
          const video = document.getElementById('player');
          const videoUrl = "${videoUrl}";
          
          // Function to attempt autoplay with fallback
          function attemptAutoplay() {
            // First try with sound
            video.muted = false;
            video.play().then(() => {
              console.log('Autoplay with sound succeeded');
            }).catch(e => {
              console.log('Autoplay with sound failed, trying muted');
              // If that fails, try muted autoplay
              video.muted = true;
              video.play().then(() => {
                // Show unmute hint or auto-unmute on user interaction
                video.addEventListener('click', () => { video.muted = false; }, { once: true });
              }).catch(e2 => {
                console.log('All autoplay attempts failed');
              });
            });
          }
          
          ${isHLS ? `
          // HLS stream
          if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
            });
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              attemptAutoplay();
            });
            hls.on(Hls.Events.ERROR, function(event, data) {
              if (data.fatal) {
                console.error('HLS error:', data);
                // Try direct playback as fallback
                video.src = videoUrl;
                attemptAutoplay();
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = videoUrl;
            video.addEventListener('loadedmetadata', function() {
              attemptAutoplay();
            });
          } else {
            document.body.innerHTML = '<div class="error"><p>HLS not supported in this browser</p></div>';
          }
          ` : `
          // Direct video playback
          video.src = videoUrl;
          video.addEventListener('loadedmetadata', function() {
            attemptAutoplay();
          });
          `}
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
