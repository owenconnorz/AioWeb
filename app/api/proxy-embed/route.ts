export const dynamic = "force-dynamic"

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

    // Determine the appropriate referer based on the target URL
    let referer = "https://www.google.com/"
    let origin = "https://www.google.com"
    let cookie = ""

    if (targetUrl.includes("redtube.com") || targetUrl.includes("embed.redtube.com")) {
      referer = "https://www.redtube.com/"
      origin = "https://www.redtube.com"
      // RedTube requires specific cookies and headers for embed access
      cookie = "platform=pc; age_verified=1; accessAgeDisclaimerPH=1"
    }

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: referer,
      Origin: origin,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "iframe",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    }

    if (cookie) {
      headers["Cookie"] = cookie
    }

    const response = await fetch(targetUrl, { headers })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch embed: ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    let html = await response.text()

    // Rewrite relative URLs to absolute URLs
    const baseUrl = new URL(targetUrl)
    html = html.replace(/src="\/([^"]+)"/g, `src="${baseUrl.origin}/$1"`)
    html = html.replace(/href="\/([^"]+)"/g, `href="${baseUrl.origin}/$1"`)
    
    // For RedTube embeds, also rewrite protocol-relative URLs
    if (targetUrl.includes("redtube.com")) {
      html = html.replace(/src="\/\/([^"]+)"/g, 'src="https://$1"')
      html = html.replace(/href="\/\/([^"]+)"/g, 'href="https://$1"')
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "X-Frame-Options": "ALLOWALL",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to proxy embed" }), {
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
