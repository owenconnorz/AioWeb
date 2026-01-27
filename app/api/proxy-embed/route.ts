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
      // RedTube requires specific cookies and headers for embed access - use Brazil location to bypass age verification
      cookie = "platform=pc; age_verified=1; accessAgeDisclaimerPH=1; accessAgeDisclaimerRT=1; countryCode=BR; ageVerified=1"
    }

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: referer,
      Origin: origin,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "X-Forwarded-For": "177.67.80.1",
      "CF-IPCountry": "BR",
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

    // For upload18.net (xvidapi embeds), strip popups and ads
    if (targetUrl.includes("upload18.net")) {
      // Remove popup scripts and ad networks
      html = html.replace(/<script[^>]*>(.*?window\.open.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?popunder.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?jerkmate.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?mosaic.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?exoclick.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?juicyads.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?trafficsource.*?)<\/script>/gis, '')
      html = html.replace(/<script[^>]*>(.*?adblock.*?)<\/script>/gis, '')

      // Remove iframe ads
      html = html.replace(/<iframe[^>]*jerkmate[^>]*>.*?<\/iframe>/gis, '')
      html = html.replace(/<iframe[^>]*mosaic[^>]*>.*?<\/iframe>/gis, '')

      // Block all window.open calls
      html = html.replace(/window\.open\(/g, '(function(){return false;})(')

      // Block popup event listeners
      html = html.replace(/addEventListener\(['"]click['"],[^)]*window\.open/g, 'addEventListener("click", function(e){e.preventDefault();return false;}')

      // Add popup blocker script at the beginning
      const popupBlocker = `
        <script>
          (function() {
            // Block all window.open calls
            window.open = function() { return null; };

            // Block popunders
            var _original = window.addEventListener;
            window.addEventListener = function(a,b,c) {
              if (b && b.toString && b.toString().indexOf('window.open') > -1) {
                return;
              }
              _original.apply(this, arguments);
            };

            // Prevent click redirects
            document.addEventListener('click', function(e) {
              if (e.target && e.target.tagName === 'A') {
                var href = e.target.getAttribute('href');
                if (href && (href.includes('jerkmate') || href.includes('mosaic') || href.includes('exo') || href.includes('ads'))) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }
            }, true);
          })();
        </script>
      `;
      html = html.replace(/<head>/i, '<head>' + popupBlocker);
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
