export const dynamic = "force-dynamic"
export const revalidate = false

const cache = new Map<string, { data: ArrayBuffer; headers: Record<string, string>; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

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

    const cached = cache.get(targetUrl)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("[v0] Serving from memory cache:", targetUrl)
      return new Response(cached.data, {
        status: 200,
        headers: cached.headers as HeadersInit,
      })
    }

    console.log("[v0] Proxying URL:", targetUrl)

    const range = request.headers.get("range")

    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.redgifs.com/",
      Origin: "https://www.redgifs.com",
      Accept: "*/*",
      "Accept-Encoding": "identity", // Disable compression for faster streaming
    }

    if (range) {
      fetchHeaders["Range"] = range
    }

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
    })

    if (!response.ok) {
      console.error(`[v0] Proxy fetch failed: ${response.status} ${response.statusText}`)
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

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable", // 1 year cache
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
      ETag: `"${Buffer.from(targetUrl).toString("base64").slice(0, 32)}"`,
    }

    if (contentLength) responseHeaders["Content-Length"] = contentLength
    if (acceptRanges) responseHeaders["Accept-Ranges"] = acceptRanges
    if (contentRange) responseHeaders["Content-Range"] = contentRange

    if (!range && buffer.byteLength < 10 * 1024 * 1024) {
      cache.set(targetUrl, { data: buffer, headers: responseHeaders, timestamp: Date.now() })

      if (cache.size > 100) {
        const entries = Array.from(cache.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        for (let i = 0; i < 20; i++) {
          cache.delete(entries[i][0])
        }
      }
    }

    return new Response(buffer, {
      status: response.status,
      headers: responseHeaders as HeadersInit,
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
