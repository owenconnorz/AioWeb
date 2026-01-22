"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Play, Pause, SkipForward, SkipBack, Heart, Repeat, Home, Compass, Library, X, ChevronLeft, ChevronRight, Loader2, ListMusic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Track {
  id: string
  videoId: string
  title: string
  artist?: string
  subtitle?: string
  album?: string
  duration?: string
  thumbnail: string
  type?: string
}

interface Shelf {
  shelfTitle: string
  items: Track[]
}

const GENRES = [
  { id: "pop", name: "Pop", color: "from-pink-500 to-rose-500" },
  { id: "rock", name: "Rock", color: "from-red-500 to-red-700" },
  { id: "electronic", name: "Electronic", color: "from-cyan-500 to-blue-500" },
  { id: "hip hop", name: "Hip-Hop", color: "from-amber-500 to-orange-500" },
  { id: "r&b", name: "R&B", color: "from-purple-500 to-violet-600" },
  { id: "jazz", name: "Jazz", color: "from-yellow-500 to-amber-600" },
  { id: "classical", name: "Classical", color: "from-indigo-500 to-purple-600" },
  { id: "country", name: "Country", color: "from-orange-400 to-yellow-500" },
]

export function MusicBrowser() {
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "library">("home")
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  
  // Library state
  const [likedTracks, setLikedTracks] = useState<Track[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([])
  
  const playerRef = useRef<HTMLIFrameElement>(null)

  // Load library from localStorage
  useEffect(() => {
    const savedLiked = localStorage.getItem("ytmusic_liked")
    const savedRecent = localStorage.getItem("ytmusic_recent")
    if (savedLiked) setLikedTracks(JSON.parse(savedLiked))
    if (savedRecent) setRecentlyPlayed(JSON.parse(savedRecent))
  }, [])

  // Save library to localStorage
  useEffect(() => {
    localStorage.setItem("ytmusic_liked", JSON.stringify(likedTracks))
  }, [likedTracks])

  useEffect(() => {
    localStorage.setItem("ytmusic_recent", JSON.stringify(recentlyPlayed))
  }, [recentlyPlayed])

  // Load home feed
  const loadHomeFeed = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/music?action=home")
      const data = await response.json()
      
      if (data.shelves && data.shelves.length > 0) {
        // Filter out empty shelves
        const validShelves = data.shelves.filter((s: Shelf) => s.items && s.items.length > 0)
        setShelves(validShelves)
      } else {
        setError("No content available")
      }
    } catch (err) {
      setError("Failed to load music")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHomeFeed()
  }, [loadHomeFeed])

  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const response = await fetch(`/api/music?action=search&query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  // Play track using YouTube embed
  const playTrack = (track: Track, trackList?: Track[]) => {
    if (!track.videoId) return
    
    setCurrentTrack(track)
    setIsPlaying(true)
    setShowPlayer(true)
    
    if (trackList) {
      setQueue(trackList.filter(t => t.videoId))
      setQueueIndex(trackList.findIndex(t => t.videoId === track.videoId) || 0)
    }
    
    // Add to recently played
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.videoId !== track.videoId)
      return [track, ...filtered].slice(0, 50)
    })
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (queue.length === 0) return
    
    let nextIndex = queueIndex + 1
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (nextIndex >= queue.length) {
      nextIndex = isRepeat ? 0 : queueIndex
    }
    
    if (queue[nextIndex]) {
      setQueueIndex(nextIndex)
      setCurrentTrack(queue[nextIndex])
    }
  }

  const playPrev = () => {
    if (queue.length === 0) return
    
    let prevIndex = queueIndex - 1
    if (prevIndex < 0) {
      prevIndex = isRepeat ? queue.length - 1 : 0
    }
    
    if (queue[prevIndex]) {
      setQueueIndex(prevIndex)
      setCurrentTrack(queue[prevIndex])
    }
  }

  const toggleLike = (track: Track) => {
    setLikedTracks(prev => {
      const isLiked = prev.some(t => t.videoId === track.videoId)
      if (isLiked) {
        return prev.filter(t => t.videoId !== track.videoId)
      }
      return [track, ...prev]
    })
  }

  const isLiked = (track: Track) => likedTracks.some(t => t.videoId === track.videoId)

  // Track card component
  const TrackCard = ({ track, trackList, size = "normal" }: { track: Track; trackList?: Track[]; size?: "normal" | "small" }) => (
    <button
      onClick={() => playTrack(track, trackList)}
      className={`group relative flex flex-col items-start text-left transition-all hover:bg-white/5 rounded-lg p-2 ${size === "small" ? "w-32" : "w-40 sm:w-44"}`}
    >
      <div className={`relative ${size === "small" ? "w-28 h-28" : "w-36 h-36 sm:w-40 sm:h-40"} rounded-lg overflow-hidden bg-slate-800`}>
        {track.thumbnail ? (
          <img
            src={track.thumbnail || "/placeholder.svg"}
            alt={track.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
            <ListMusic className="w-12 h-12 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        {currentTrack?.videoId === track.videoId && isPlaying && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5">
            <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>
      <h4 className={`mt-2 font-medium text-white line-clamp-2 ${size === "small" ? "text-xs" : "text-sm"}`}>
        {track.title}
      </h4>
      <p className={`text-slate-400 line-clamp-1 ${size === "small" ? "text-xs" : "text-xs"}`}>
        {track.artist || track.subtitle || ""}
      </p>
    </button>
  )

  // Shelf component with horizontal scroll
  const ShelfSection = ({ shelf }: { shelf: Shelf }) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    const scroll = (direction: "left" | "right") => {
      if (scrollRef.current) {
        const scrollAmount = 300
        scrollRef.current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth"
        })
      }
    }

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{shelf.shelfTitle}</h3>
          <div className="flex gap-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {shelf.items.map((track, idx) => (
            <TrackCard key={`${track.videoId || track.id}-${idx}`} track={track} trackList={shelf.items} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-gradient-to-b from-slate-900 to-black rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">Music</span>
          </div>
        </div>
        
        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          {showSearch ? (
            <div className="flex items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search songs, artists..."
                className="bg-white/10 border-0 text-white placeholder:text-slate-400"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery("")
                  setSearchResults([])
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 bg-white/10 hover:bg-white/20"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Search Results</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchResults([])
                  setSearchQuery("")
                  setShowSearch(false)
                }}
              >
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {searchResults.map((track, idx) => (
                <button
                  key={`${track.videoId}-${idx}`}
                  onClick={() => playTrack(track, searchResults)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <img
                    src={track.thumbnail || "/placeholder.svg"}
                    alt={track.title}
                    className="w-12 h-12 rounded object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-medium line-clamp-1">{track.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-1">
                      {track.artist} {track.album && `• ${track.album}`}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">{track.duration}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLike(track)
                    }}
                  >
                    <Heart className={`h-4 w-4 ${isLiked(track) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={loadHomeFeed} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Tabs Content */}
        {!loading && !error && searchResults.length === 0 && (
          <>
            {activeTab === "home" && (
              <div>
                {/* Listen Again (Recently Played) */}
                {recentlyPlayed.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Listen Again</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {recentlyPlayed.slice(0, 8).map((track, idx) => (
                        <button
                          key={`recent-${track.videoId}-${idx}`}
                          onClick={() => playTrack(track)}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-colors"
                        >
                          <img
                            src={track.thumbnail || "/placeholder.svg"}
                            alt={track.title}
                            className="w-14 h-14 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-sm text-white font-medium line-clamp-2 pr-2">
                            {track.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shelves from YT Music */}
                {shelves.map((shelf, idx) => (
                  <ShelfSection key={`shelf-${idx}`} shelf={shelf} />
                ))}
                
                {shelves.length === 0 && !loading && (
                  <div className="text-center py-10">
                    <p className="text-slate-400">Loading YouTube Music content...</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "explore" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Browse by Genre</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                  {GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => {
                        setSearchQuery(genre.name)
                        setShowSearch(true)
                        setTimeout(() => {
                          handleSearch()
                        }, 100)
                      }}
                      className={`aspect-video rounded-lg bg-gradient-to-br ${genre.color} hover:opacity-90 flex items-center justify-center transition-all hover:scale-105`}
                    >
                      <span className="text-white font-bold text-lg">{genre.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "library" && (
              <div>
                {/* Liked Songs */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-700 to-blue-500 flex items-center justify-center">
                      <Heart className="w-10 h-10 text-white fill-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Liked Songs</h3>
                      <p className="text-slate-400">{likedTracks.length} songs</p>
                    </div>
                  </div>
                  
                  {likedTracks.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Songs you like will appear here</p>
                  ) : (
                    <div className="space-y-2">
                      {likedTracks.map((track, idx) => (
                        <button
                          key={`liked-${track.videoId}-${idx}`}
                          onClick={() => playTrack(track, likedTracks)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <span className="text-slate-500 w-6 text-sm">{idx + 1}</span>
                          <img
                            src={track.thumbnail || "/placeholder.svg"}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 text-left">
                            <h4 className="text-white font-medium line-clamp-1">{track.title}</h4>
                            <p className="text-sm text-slate-400 line-clamp-1">{track.artist || track.subtitle}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLike(track)
                            }}
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Recently Played in Library */}
                {recentlyPlayed.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Recently Played</h3>
                    <div className="space-y-2">
                      {recentlyPlayed.slice(0, 20).map((track, idx) => (
                        <button
                          key={`history-${track.videoId}-${idx}`}
                          onClick={() => playTrack(track)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <img
                            src={track.thumbnail || "/placeholder.svg"}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 text-left">
                            <h4 className="text-white font-medium line-clamp-1">{track.title}</h4>
                            <p className="text-sm text-slate-400 line-clamp-1">{track.artist || track.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-around p-2 bg-black/50 border-t border-white/10">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === "home" ? "text-white" : "text-slate-400"}`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === "explore" ? "text-white" : "text-slate-400"}`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-xs">Explore</span>
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === "library" ? "text-white" : "text-slate-400"}`}
        >
          <Library className="h-5 w-5" />
          <span className="text-xs">Library</span>
        </button>
      </div>

      {/* Mini Player with YouTube Embed */}
      {showPlayer && currentTrack && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-t border-white/10">
          {/* YouTube Embed for audio playback */}
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1&enablejsapi=1`}
            className="w-full h-0"
            allow="autoplay; encrypted-media"
            style={{ height: 0, border: 0 }}
          />
          
          <div className="flex items-center gap-3 p-3">
            {/* Track Info */}
            <img
              src={currentTrack.thumbnail || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm line-clamp-1">{currentTrack.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-1">{currentTrack.artist || currentTrack.subtitle}</p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleLike(currentTrack)}
              >
                <Heart className={`h-4 w-4 ${isLiked(currentTrack) ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={playPrev}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-white text-black hover:bg-white/90 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={playNext}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden sm:flex"
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className={`h-4 w-4 ${isRepeat ? "text-red-500" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
