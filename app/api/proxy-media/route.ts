export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get("url")

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "URL parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.redgifs.com/",
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch media" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const buffer = await response.arrayBuffer()

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return new Response(JSON.stringify({ error: "Failed to proxy media" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
