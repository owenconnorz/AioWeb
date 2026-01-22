import { NextResponse } from "next/server"

// YouTube Music Innertube API - using the public key that doesn't require auth
const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"

const getInnertubeContext = () => ({
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20241106.01.00",
    hl: "en",
    gl: "US",
    platform: "DESKTOP",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36,gzip(gfe)",
    acceptHeader: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
  user: {
    lockedSafetyMode: false,
  },
})

async function innertubeRequest(endpoint: string, body: any) {
  try {
    const response = await fetch(
      `https://music.youtube.com/youtubei/v1/${endpoint}?key=${INNERTUBE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Origin": "https://music.youtube.com",
          "Referer": "https://music.youtube.com/",
          "X-Goog-Visitor-Id": "CgtQbTdfRHpfX3FqbyiQqL24BjIKCgJVUxIEGgAgFA%3D%3D",
        },
        body: JSON.stringify({
          context: getInnertubeContext(),
          ...body,
        }),
      }
    )
    
    if (!response.ok) {
      console.error("[v0] Innertube response not ok:", response.status)
      return { error: response.status }
    }
    
    return response.json()
  } catch (error) {
    console.error("[v0] Innertube request failed:", error)
    return { error: String(error) }
  }
}

// Parse shelf content from YouTube Music response
function parseShelfContent(content: any): any[] {
  const items: any[] = []
  
  if (!content) return items
  
  // Handle musicCarouselShelfRenderer
  if (content.musicCarouselShelfRenderer) {
    const shelf = content.musicCarouselShelfRenderer
    const title = shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || "Unknown"
    
    const shelfItems = shelf.contents?.map((item: any) => {
      if (item.musicTwoRowItemRenderer) {
        const renderer = item.musicTwoRowItemRenderer
        const videoId = renderer.navigationEndpoint?.watchEndpoint?.videoId
        const playlistId = renderer.navigationEndpoint?.watchEndpoint?.playlistId
        const browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId
        
        return {
          type: videoId ? "track" : browseId?.startsWith("UC") ? "artist" : "playlist",
          id: videoId || playlistId || browseId,
          videoId,
          playlistId,
          browseId,
          title: renderer.title?.runs?.[0]?.text || "Unknown",
          subtitle: renderer.subtitle?.runs?.map((r: any) => r.text).join("") || "",
          thumbnail: renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
        }
      }
      if (item.musicResponsiveListItemRenderer) {
        const renderer = item.musicResponsiveListItemRenderer
        const videoId = renderer.playlistItemData?.videoId || 
                       renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId
        
        return {
          type: "track",
          id: videoId,
          videoId,
          title: renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Unknown",
          subtitle: renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((r: any) => r.text).join("") || "",
          thumbnail: renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
        }
      }
      return null
    }).filter(Boolean) || []
    
    return [{ shelfTitle: title, items: shelfItems }]
  }
  
  // Handle musicShelfRenderer
  if (content.musicShelfRenderer) {
    const shelf = content.musicShelfRenderer
    const title = shelf.title?.runs?.[0]?.text || "Unknown"
    
    const shelfItems = shelf.contents?.map((item: any) => {
      if (item.musicResponsiveListItemRenderer) {
        const renderer = item.musicResponsiveListItemRenderer
        const videoId = renderer.playlistItemData?.videoId ||
                       renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId
        
        return {
          type: "track",
          id: videoId,
          videoId,
          title: renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Unknown",
          subtitle: renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((r: any) => r.text).join("") || "",
          thumbnail: renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
        }
      }
      return null
    }).filter(Boolean) || []
    
    return [{ shelfTitle: title, items: shelfItems }]
  }
  
  return items
}

// Fallback shelves when API fails
function getFallbackShelves() {
  return [
    {
      shelfTitle: "Popular Music",
      items: [
        { id: "1", videoId: "dQw4w9WgXcQ", title: "Never Gonna Give You Up", artist: "Rick Astley", thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
        { id: "2", videoId: "kJQP7kiw5Fk", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg" },
        { id: "3", videoId: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", artist: "Queen", thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg" },
        { id: "4", videoId: "hTWKbfoikeg", title: "Smells Like Teen Spirit", artist: "Nirvana", thumbnail: "https://i.ytimg.com/vi/hTWKbfoikeg/mqdefault.jpg" },
        { id: "5", videoId: "JGwWNGJdvx8", title: "Shape of You", artist: "Ed Sheeran", thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg" },
      ]
    },
    {
      shelfTitle: "Trending",
      items: [
        { id: "6", videoId: "CevxZvSJLk8", title: "Rockstar", artist: "Post Malone", thumbnail: "https://i.ytimg.com/vi/CevxZvSJLk8/mqdefault.jpg" },
        { id: "7", videoId: "RgKAFK5djSk", title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg" },
        { id: "8", videoId: "OPf0YbXqDm0", title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg" },
        { id: "9", videoId: "09R8_2nJtjg", title: "Sugar", artist: "Maroon 5", thumbnail: "https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg" },
        { id: "10", videoId: "lp-EO5I60KA", title: "Counting Stars", artist: "OneRepublic", thumbnail: "https://i.ytimg.com/vi/lp-EO5I60KA/mqdefault.jpg" },
      ]
    }
  ]
}

// Get audio stream URL for a video
async function getAudioStreamUrl(videoId: string) {
  try {
    const playerResponse = await innertubeRequest("player", {
      videoId,
      playbackContext: {
        contentPlaybackContext: {
          signatureTimestamp: 19950,
        },
      },
    })
    
    // Get audio-only format
    const formats = playerResponse.streamingData?.adaptiveFormats || []
    const audioFormats = formats.filter((f: any) => f.mimeType?.startsWith("audio/"))
    
    // Prefer highest quality audio
    const bestAudio = audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
    
    if (bestAudio?.url) {
      return bestAudio.url
    }
    
    // If URL requires signature, return null (would need cipher decryption)
    return null
  } catch (error) {
    console.error("[v0] Error getting audio stream:", error)
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") || "home"
  const query = searchParams.get("query") || ""
  const videoId = searchParams.get("videoId") || ""
  const browseId = searchParams.get("browseId") || ""

  try {
    switch (action) {
      case "home": {
        // Get YouTube Music home feed
        const data = await innertubeRequest("browse", {
          browseId: "FEmusic_home",
        })
        
        // Check for API errors
        if (data.error) {
          // Return fallback trending music
          return NextResponse.json({ 
            shelves: getFallbackShelves(),
            fallback: true 
          })
        }
        
        const shelves: any[] = []
        const contents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || []
        
        for (const content of contents) {
          const parsed = parseShelfContent(content)
          shelves.push(...parsed)
        }
        
        // If no shelves parsed, return fallback
        if (shelves.length === 0) {
          return NextResponse.json({ 
            shelves: getFallbackShelves(),
            fallback: true 
          })
        }
        
        return NextResponse.json({ shelves })
      }
      
      case "search": {
        const data = await innertubeRequest("search", {
          query,
          params: "EgWKAQIIAWoMEAMQBBAJEAoQBRAW", // Filter for songs
        })
        
        const results: any[] = []
        const contents = data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || []
        
        for (const content of contents) {
          if (content.musicShelfRenderer) {
            const items = content.musicShelfRenderer.contents?.map((item: any) => {
              if (item.musicResponsiveListItemRenderer) {
                const renderer = item.musicResponsiveListItemRenderer
                const videoId = renderer.playlistItemData?.videoId ||
                              renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId
                
                return {
                  type: "track",
                  id: videoId,
                  videoId,
                  title: renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Unknown",
                  artist: renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "",
                  album: renderer.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "",
                  duration: renderer.flexColumns?.[3]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "",
                  thumbnail: renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
                }
              }
              return null
            }).filter(Boolean) || []
            
            results.push(...items)
          }
        }
        
        return NextResponse.json({ results })
      }
      
      case "charts": {
        const data = await innertubeRequest("browse", {
          browseId: "FEmusic_charts",
        })
        
        const shelves: any[] = []
        const contents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || []
        
        for (const content of contents) {
          const parsed = parseShelfContent(content)
          shelves.push(...parsed)
        }
        
        return NextResponse.json({ shelves })
      }
      
      case "moods": {
        const data = await innertubeRequest("browse", {
          browseId: "FEmusic_moods_and_genres",
        })
        
        const moods: any[] = []
        const grid = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.gridRenderer
        
        if (grid?.items) {
          for (const item of grid.items) {
            if (item.musicNavigationButtonRenderer) {
              const renderer = item.musicNavigationButtonRenderer
              moods.push({
                title: renderer.buttonText?.runs?.[0]?.text || "",
                browseId: renderer.clickCommand?.browseEndpoint?.browseId || "",
                color: renderer.solid?.leftStripeColor || "#333",
              })
            }
          }
        }
        
        return NextResponse.json({ moods })
      }
      
      case "playlist": {
        const data = await innertubeRequest("browse", {
          browseId: browseId || "VLRDCLAK5uy_kmPRjHDEANtt6CD4i4A", // Default to a popular playlist
        })
        
        const header = data.header?.musicDetailHeaderRenderer || data.header?.musicEditablePlaylistDetailHeaderRenderer?.header?.musicDetailHeaderRenderer
        const contents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents || []
        
        const tracks = contents.map((item: any) => {
          if (item.musicResponsiveListItemRenderer) {
            const renderer = item.musicResponsiveListItemRenderer
            const videoId = renderer.playlistItemData?.videoId
            
            return {
              type: "track",
              id: videoId,
              videoId,
              title: renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Unknown",
              artist: renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "",
              album: renderer.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "",
              duration: renderer.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || "",
              thumbnail: renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
            }
          }
          return null
        }).filter(Boolean)
        
        return NextResponse.json({
          title: header?.title?.runs?.[0]?.text || "Playlist",
          description: header?.description?.runs?.[0]?.text || "",
          thumbnail: header?.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
          tracks,
        })
      }
      
      case "stream": {
        // Get audio stream URL for a video
        const streamUrl = await getAudioStreamUrl(videoId)
        
        if (streamUrl) {
          return NextResponse.json({ streamUrl })
        }
        
        // Fallback: Return embed URL for iframe playback
        return NextResponse.json({ 
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
          error: "Direct stream not available, use embed"
        })
      }
      
      case "next": {
        // Get related tracks / queue
        const data = await innertubeRequest("next", {
          videoId,
          isAudioOnly: true,
        })
        
        const items = data.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || []
        
        const tracks = items.map((item: any) => {
          if (item.playlistPanelVideoRenderer) {
            const renderer = item.playlistPanelVideoRenderer
            return {
              type: "track",
              id: renderer.videoId,
              videoId: renderer.videoId,
              title: renderer.title?.runs?.[0]?.text || "Unknown",
              artist: renderer.shortBylineText?.runs?.[0]?.text || "",
              duration: renderer.lengthText?.runs?.[0]?.text || "",
              thumbnail: renderer.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
            }
          }
          return null
        }).filter(Boolean)
        
        return NextResponse.json({ tracks })
      }
      
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] YouTube Music API error:", error)
    return NextResponse.json({ error: "Failed to fetch from YouTube Music", details: String(error) }, { status: 500 })
  }
}
