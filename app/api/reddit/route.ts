import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subreddit = searchParams.get("subreddit") || "pics"
  const after = searchParams.get("after") || ""
  const sort = searchParams.get("sort") || "hot"
  
  try {
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=25${after ? `&after=${after}` : ""}`
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "web:aio-app:v1.0.0",
      },
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Subreddit not found" }, { status: 404 })
      }
      throw new Error(`Reddit API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filter and transform posts to only include images and videos
    const posts = data.data.children
      .filter((child: any) => {
        const post = child.data
        // Filter for images and videos only
        const isImage = post.post_hint === "image" || 
                       post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                       post.domain === "i.redd.it" ||
                       post.domain === "i.imgur.com"
        const isVideo = post.is_video || 
                       post.post_hint === "hosted:video" ||
                       post.post_hint === "rich:video" ||
                       post.domain === "v.redd.it" ||
                       post.domain === "gfycat.com" ||
                       post.domain === "redgifs.com"
        const isGallery = post.is_gallery
        
        return (isImage || isVideo || isGallery) && !post.over_18
      })
      .map((child: any) => {
        const post = child.data
        
        // Get media URL
        let mediaUrl = post.url
        let mediaType: "image" | "video" | "gallery" = "image"
        let videoUrl: string | null = null
        let galleryImages: string[] = []
        
        // Handle Reddit videos
        if (post.is_video && post.media?.reddit_video) {
          mediaType = "video"
          videoUrl = post.media.reddit_video.fallback_url
          // Get thumbnail for video
          mediaUrl = post.thumbnail !== "default" ? post.thumbnail : post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&")
        }
        
        // Handle galleries
        if (post.is_gallery && post.media_metadata) {
          mediaType = "gallery"
          galleryImages = Object.values(post.media_metadata)
            .filter((media: any) => media.status === "valid")
            .map((media: any) => {
              if (media.s?.u) return media.s.u.replace(/&amp;/g, "&")
              if (media.s?.gif) return media.s.gif.replace(/&amp;/g, "&")
              return null
            })
            .filter(Boolean) as string[]
          mediaUrl = galleryImages[0] || post.thumbnail
        }
        
        // Get best quality image
        if (mediaType === "image" && post.preview?.images?.[0]?.source?.url) {
          mediaUrl = post.preview.images[0].source.url.replace(/&amp;/g, "&")
        }
        
        return {
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          numComments: post.num_comments,
          created: post.created_utc,
          permalink: `https://reddit.com${post.permalink}`,
          mediaUrl,
          mediaType,
          videoUrl,
          galleryImages,
          thumbnail: post.thumbnail !== "default" && post.thumbnail !== "self" ? post.thumbnail : null,
          width: post.preview?.images?.[0]?.source?.width,
          height: post.preview?.images?.[0]?.source?.height,
        }
      })
    
    return NextResponse.json({
      posts,
      after: data.data.after,
      subreddit,
    })
  } catch (error) {
    console.error("Reddit API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from Reddit" },
      { status: 500 }
    )
  }
}
