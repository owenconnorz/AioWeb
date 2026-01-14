export const runtime = "edge"
export const dynamic = "force-static"
export const revalidate = 604800 // 7 days

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

    console.log("[v0] Proxying URL:", targetUrl)

    const cacheKey = `redgifs-proxy:${targetUrl}`

    // Get range header for video streaming
    const range = request.headers.get("range")

    // Fetch media with proper headers (NO auth token for CDN)
    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.redgifs.com/",
      Origin: "https://www.redgifs.com",
      Accept: "*/*",
    }

    // Add range header if present for video seeking
    if (range) {
      fetchHeaders["Range"] = range
    }

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
      next: { revalidate: 604800 }, // Cache for 7 days
    })

    if (!response.ok) {
      console.error(`[v0] Proxy fetch failed: ${response.status} ${response.statusText}`)
      const body = await response.text()
      console.error(`[v0] Response body:`, body)
      return new Response(JSON.stringify({ error: `Failed to fetch media: ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const contentLength = response.headers.get("content-length")
    const acceptRanges = response.headers.get("accept-ranges")
    const contentRange = response.headers.get("content-range")

    console.log("[v0] Proxy success:", { contentType, contentLength, status: response.status })

    const buffer = await response.arrayBuffer()

    const responseHeaders: HeadersInit = {
      "Content-Type": contentType,
      // Aggressive caching: 7 days browser cache, 30 days CDN cache
      "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400, immutable",
      "CDN-Cache-Control": "public, max-age=2592000, immutable",
      "Vercel-CDN-Cache-Control": "public, max-age=2592000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
      // Add ETag for better caching
      ETag: `"${Buffer.from(targetUrl).toString("base64").slice(0, 32)}"`,
    }

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength
    }

    if (acceptRanges) {
      responseHeaders["Accept-Ranges"] = acceptRanges
    }

    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange
    }

    return new Response(buffer, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to proxy media" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
    },
  })
}
