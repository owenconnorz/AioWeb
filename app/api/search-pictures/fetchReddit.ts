import { NextResponse } from "next/server"

// Cache for Reddit OAuth token
let redditToken: { token: string; expires: number } | null = null

// Get Reddit OAuth token using client credentials
async function getRedditToken(): Promise<string> {
  const now = Date.now()
  
  // Return cached token if still valid
  if (redditToken && redditToken.expires > now) {
    return redditToken.token
  }
  
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error("Reddit API credentials not configured")
  }
  
  // Use client credentials flow for application-only access
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "web:mediabrowser:v1.0.0 (by /u/mediabrowser_app)",
      "Authorization": `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }).toString(),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Reddit auth failed: ${response.status} - ${errorText}`)
  }
  
  const data = await response.json()
  
  redditToken = {
    token: data.access_token,
    expires: now + (data.expires_in * 1000) - 60000, // Expire 1 minute early
  }
  
  return redditToken.token
}

// Reddit API - fetches images and videos from subreddits
export async function fetchReddit(subreddit: string, sort: string, after: string) {
  try {
    const cleanSubreddit = subreddit.replace(/^r\//, "").replace(/\s/g, "")
    const afterParam = after ? `&after=${after}` : ""
    
    // Get OAuth token and make authenticated request
    const token = await getRedditToken()
    const oauthUrl = `https://oauth.reddit.com/r/${cleanSubreddit}/${sort}?limit=50&raw_json=1${afterParam}`
    
    const response = await fetch(oauthUrl, {
      headers: {
        "User-Agent": "web:mediabrowser:v1.0.0 (by /u/mediabrowser_app)",
        "Authorization": `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Subreddit not found" }, { status: 404 })
      }
      if (response.status === 403) {
        return NextResponse.json({ error: "Subreddit is private or quarantined" }, { status: 403 })
      }
      throw new Error(`Reddit API returned ${response.status}`)
    }
    
    const data = await response.json()
    const posts = data?.data?.children || []

    const galleries = posts
      .filter((post: any) => {
        const p = post.data
        // Filter for image/video posts
        return (
          p.post_hint === "image" ||
          p.post_hint === "hosted:video" ||
          p.post_hint === "rich:video" ||
          p.is_gallery ||
          p.is_video ||
          (p.url && /\.(jpg|jpeg|png|gif|webp|mp4)(\?.*)?$/i.test(p.url)) ||
          (p.url && p.url.includes("redgifs.com")) ||
          (p.url && p.url.includes("gfycat.com")) ||
          (p.url && p.url.includes("imgur.com"))
        )
      })
      .map((post: any) => {
        const p = post.data
        
        // Get thumbnail/preview
        let thumbnail = p.thumbnail
        let preview = ""
        
        if (p.preview?.images?.[0]) {
          const previewData = p.preview.images[0]
          preview = previewData.source?.url || ""
          // Get a smaller resolution for thumbnail
          if (previewData.resolutions?.length > 0) {
            const midRes = previewData.resolutions[Math.min(2, previewData.resolutions.length - 1)]
            thumbnail = midRes?.url || thumbnail
          }
        }
        
        // Handle different media types
        let mediaUrl = p.url || ""
        let videoUrl = null
        let isVideo = false
        
        // Reddit hosted video
        if (p.is_video && p.media?.reddit_video) {
          videoUrl = p.media.reddit_video.fallback_url
          isVideo = true
        }
        // Embedded video (redgifs, gfycat, etc)
        else if (p.post_hint === "rich:video" && p.secure_media?.oembed) {
          videoUrl = p.url
          isVideo = true
        }
        // Direct video link
        else if (mediaUrl.includes(".mp4") || mediaUrl.includes(".webm")) {
          videoUrl = mediaUrl
          isVideo = true
        }
        // RedGifs
        else if (mediaUrl.includes("redgifs.com")) {
          videoUrl = mediaUrl
          isVideo = true
        }
        
        // Handle galleries
        let galleryImages: string[] = []
        if (p.is_gallery && p.media_metadata) {
          galleryImages = Object.values(p.media_metadata)
            .filter((m: any) => m.status === "valid")
            .map((m: any) => {
              if (m.s?.u) return m.s.u
              if (m.s?.gif) return m.s.gif
              return ""
            })
            .filter(Boolean)
          
          if (galleryImages.length > 0) {
            mediaUrl = galleryImages[0]
            preview = galleryImages[0]
          }
        }
        
        return {
          id: p.id,
          title: p.title || "Untitled",
          url: mediaUrl,
          videoUrl,
          thumbnail: thumbnail && thumbnail !== "self" && thumbnail !== "default" ? thumbnail : preview || mediaUrl,
          preview: preview || mediaUrl,
          tags: [p.subreddit, ...(p.link_flair_text ? [p.link_flair_text] : [])],
          isVideo,
          isGallery: p.is_gallery || false,
          galleryImages,
          subreddit: p.subreddit,
          permalink: `https://reddit.com${p.permalink}`,
          author: p.author,
          score: p.score,
          created: p.created_utc,
        }
      })

    return NextResponse.json({
      galleries,
      photos: [],
      page: 1,
      total: galleries.length,
      after: data?.data?.after || null,
    })
  } catch (error) {
    console.error("Reddit fetch error:", error)
    
    return NextResponse.json({
      galleries: [],
      photos: [],
      page: 1,
      total: 0,
      after: null,
      error: error instanceof Error ? error.message : "Reddit API error",
    })
  }
}
