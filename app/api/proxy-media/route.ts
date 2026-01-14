let tokenCache: { token: string; expires: number } | null = null

async function getRedGifsToken() {
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.token
  }

  const response = await fetch("https://api.redgifs.com/v2/auth/temporary", {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get RedGifs token")
  }

  const data = await response.json()
  tokenCache = {
    token: data.token,
    expires: Date.now() + 23 * 60 * 60 * 1000, // 23 hours
  }

  return data.token
}

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

    // Get fresh token for RedGifs
    const token = await getRedGifsToken()

    // Fetch media with proper headers
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.redgifs.com/",
        Origin: "https://www.redgifs.com",
        Authorization: `Bearer ${token}`,
        Accept: "video/mp4,image/webp,image/jpeg,image/*,*/*",
      },
    })

    if (!response.ok) {
      console.error(`[v0] Proxy fetch failed: ${response.status} ${response.statusText}`)
      return new Response(JSON.stringify({ error: `Failed to fetch media: ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const buffer = await response.arrayBuffer()

    // Return with aggressive caching
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, max-age=604800",
        "Vercel-CDN-Cache-Control": "public, max-age=604800",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    })
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to proxy media" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
