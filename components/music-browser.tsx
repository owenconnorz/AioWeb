"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import React from "react"

import { Search, Play, Pause, SkipForward, SkipBack, Heart, Repeat, Home, Compass, Library, X, ChevronLeft, ChevronRight, Loader2, ListMusic, ArrowLeft, Shuffle, Clock, Share2, Volume2, Plus, Trash2, GripVertical, Music } from "lucide-react"
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

interface MusicBrowserProps {
  onBack?: () => void
}

export function MusicBrowser({ onBack }: MusicBrowserProps) {
  const [mounted, setMounted] = useState(false)
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
  const [showFullPlayer, setShowFullPlayer] = useState(false)
  
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  // Library state
  const [likedTracks, setLikedTracks] = useState<Track[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([])
  
  // Dynamic theme state
  const [dynamicThemeEnabled, setDynamicThemeEnabled] = useState(true)
  const [dominantColor, setDominantColor] = useState<string>("#1e293b") // default slate-800
  const [secondaryColor, setSecondaryColor] = useState<string>("#0f172a") // default slate-900
  
  // Playback time tracking
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // New feature states
  const [showQueuePanel, setShowQueuePanel] = useState(false)
  const [playlists, setPlaylists] = useState<{id: string, name: string, tracks: Track[]}[]>([])
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [equalizer, setEqualizer] = useState("normal")
  const [showEqualizerMenu, setShowEqualizerMenu] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [expandedShelf, setExpandedShelf] = useState<Shelf | null>(null)
  
  const progressBarRef = useRef<HTMLDivElement>(null)
  
  // Equalizer presets
  const EQUALIZER_PRESETS = [
    { id: "normal", name: "Normal" },
    { id: "bass", name: "Bass Boost" },
    { id: "rock", name: "Rock" },
    { id: "pop", name: "Pop" },
    { id: "jazz", name: "Jazz" },
    { id: "classical", name: "Classical" },
    { id: "electronic", name: "Electronic" },
  ]
  
  // Playback speed options
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]
  
  // Sleep timer options (in minutes)
  const SLEEP_TIMER_OPTIONS = [
    { label: "Off", value: null },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hour", value: 60 },
  ]
  
  // Helper to parse duration string (e.g., "3:45") to seconds
  const parseDuration = (durationStr: string | undefined): number => {
    if (!durationStr) return 210 // default 3:30
    const parts = durationStr.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return 210
  }
  
  // Helper to format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const playerRef = useRef<HTMLIFrameElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const silentAudioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Swipe gesture handlers
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }
  
  const onTouchMoveMini = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }
  
  const onTouchMoveFull = (e: React.TouchEvent) => {
    // Prevent browser pull-to-refresh when swiping down
    if (e.targetTouches[0].clientY > (touchStart || 0)) {
      e.preventDefault()
    }
    setTouchEnd(e.targetTouches[0].clientY)
  }
  
  const onTouchEndMini = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isSwipeUp = distance > minSwipeDistance
    if (isSwipeUp) {
      setShowFullPlayer(true)
    }
    setTouchStart(null)
    setTouchEnd(null)
  }
  
  const onTouchEndFull = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchEnd - touchStart
    const isSwipeDown = distance > minSwipeDistance
    if (isSwipeDown) {
      setShowFullPlayer(false)
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Handle SSR - mount check
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Load dynamic theme preference
  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem("dynamicMusicTheme")
      if (saved !== null) {
        setDynamicThemeEnabled(JSON.parse(saved))
      }
    } catch (e) {
      // ignore
    }
  }, [mounted])
  
  // Extract dominant color from album art
  const extractColors = useCallback((imageUrl: string) => {
    if (!dynamicThemeEnabled || !imageUrl) {
      setDominantColor("#1e293b")
      setSecondaryColor("#0f172a")
      return
    }
    
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        
        // Use small size for faster processing
        canvas.width = 50
        canvas.height = 50
        ctx.drawImage(img, 0, 0, 50, 50)
        
        const imageData = ctx.getImageData(0, 0, 50, 50).data
        
        // Simple color extraction - find average color
        let r = 0, g = 0, b = 0, count = 0
        
        for (let i = 0; i < imageData.length; i += 4) {
          // Skip very dark or very light pixels
          const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3
          if (brightness > 30 && brightness < 220) {
            r += imageData[i]
            g += imageData[i + 1]
            b += imageData[i + 2]
            count++
          }
        }
        
        if (count > 0) {
          r = Math.round(r / count)
          g = Math.round(g / count)
          b = Math.round(b / count)
          
          // Create darker version for secondary color
          const darkerR = Math.round(r * 0.4)
          const darkerG = Math.round(g * 0.4)
          const darkerB = Math.round(b * 0.4)
          
          setDominantColor(`rgb(${r}, ${g}, ${b})`)
          setSecondaryColor(`rgb(${darkerR}, ${darkerG}, ${darkerB})`)
        }
      } catch (e) {
        // CORS error or other issue, use defaults
        setDominantColor("#1e293b")
        setSecondaryColor("#0f172a")
      }
    }
    
    img.onerror = () => {
      setDominantColor("#1e293b")
      setSecondaryColor("#0f172a")
    }
  }, [dynamicThemeEnabled])
  
  // Extract colors when track changes
  useEffect(() => {
    if (currentTrack?.thumbnail) {
      extractColors(currentTrack.thumbnail)
    }
  }, [currentTrack, extractColors])
  
  // Reset time when track changes and set duration
  useEffect(() => {
    if (currentTrack) {
      setCurrentTime(0)
      setDuration(parseDuration(currentTrack.duration))
    }
  }, [currentTrack])
  
  // Track playback time while playing
  useEffect(() => {
    if (!isPlaying || !currentTrack) return
    
    const trackDuration = parseDuration(currentTrack.duration)
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= trackDuration) {
          // Auto-play next track when current finishes
          playNext()
          return 0
        }
        return prev + 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isPlaying, currentTrack])
  
  // Initialize silent audio for Media Session API
  // This tricks the browser into letting us control media session even though YouTube iframe plays audio
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    // Create a silent audio context
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
    } catch (e) {
      console.log("[v0] AudioContext not supported")
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [mounted])
  
  // Play silent audio to activate media session
  useEffect(() => {
    if (!mounted || !showPlayer || !silentAudioRef.current) return
    
    const audio = silentAudioRef.current
    
    if (isPlaying) {
      // Play silent audio to keep media session active
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [mounted, showPlayer, isPlaying])
  
  // Media Session API for Bluetooth/system media controls
  useEffect(() => {
    if (!mounted || !currentTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    
    // Set metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist || currentTrack.subtitle || 'Unknown Artist',
      album: currentTrack.album || 'Unknown Album',
      artwork: currentTrack.thumbnail ? [
        { src: currentTrack.thumbnail, sizes: '320x320', type: 'image/jpeg' },
        { src: currentTrack.thumbnail.replace('mqdefault', 'maxresdefault'), sizes: '1280x720', type: 'image/jpeg' }
      ] : []
    })
    
    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true)
      if (playerRef.current?.contentWindow) {
        playerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo' }),
          '*'
        )
      }
    })
    
    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false)
      if (playerRef.current?.contentWindow) {
        playerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo' }),
          '*'
        )
      }
    })
    
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrev()
    })
    
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext()
    })
    
    // Update playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    
    return () => {
      // Cleanup handlers on unmount
      try {
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('previoustrack', null)
        navigator.mediaSession.setActionHandler('nexttrack', null)
      } catch (e) {
        // Some browsers may not support null handlers
      }
    }
  }, [mounted, currentTrack, isPlaying])

  // Load library from localStorage - only on client
  useEffect(() => {
    if (!mounted) return
    try {
      const savedLiked = localStorage.getItem("ytmusic_liked")
      const savedRecent = localStorage.getItem("ytmusic_recent")
      const savedPlaylists = localStorage.getItem("ytmusic_playlists")
      if (savedLiked) setLikedTracks(JSON.parse(savedLiked))
      if (savedRecent) setRecentlyPlayed(JSON.parse(savedRecent))
      if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists))
    } catch (e) {
      // localStorage not available
    }
  }, [mounted])
  
  // Save playlists to localStorage
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem("ytmusic_playlists", JSON.stringify(playlists))
    } catch (e) {
      // localStorage not available
    }
  }, [playlists, mounted])
  
  // Sleep timer effect
  useEffect(() => {
    if (!sleepTimerEnd) return
    
    const checkTimer = setInterval(() => {
      if (Date.now() >= sleepTimerEnd) {
        setIsPlaying(false)
        setSleepTimer(null)
        setSleepTimerEnd(null)
        if (playerRef.current?.contentWindow) {
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo' }),
            '*'
          )
        }
      }
    }, 1000)
    
    return () => clearInterval(checkTimer)
  }, [sleepTimerEnd])

  // Save library to localStorage - only on client after initial load
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem("ytmusic_liked", JSON.stringify(likedTracks))
    } catch (e) {
      // localStorage not available
    }
  }, [likedTracks, mounted])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem("ytmusic_recent", JSON.stringify(recentlyPlayed))
    } catch (e) {
      // localStorage not available
    }
  }, [recentlyPlayed, mounted])

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
    const newState = !isPlaying
    setIsPlaying(newState)
    
    // Send command to YouTube iframe
    if (playerRef.current?.contentWindow) {
      const command = newState ? 'playVideo' : 'pauseVideo'
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command }),
        '*'
      )
    }
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
      setIsPlaying(true) // Auto-play on skip
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
      setIsPlaying(true) // Auto-play on skip
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
  
  // Queue management
  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track])
  }
  
  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index))
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1)
    }
  }
  
  const moveInQueue = (fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev]
      const [removed] = newQueue.splice(fromIndex, 1)
      newQueue.splice(toIndex, 0, removed)
      return newQueue
    })
    // Adjust current index if needed
    if (fromIndex === queueIndex) {
      setQueueIndex(toIndex)
    } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
      setQueueIndex(prev => prev - 1)
    } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
      setQueueIndex(prev => prev + 1)
    }
  }
  
  const clearQueue = () => {
    const current = queue[queueIndex]
    setQueue(current ? [current] : [])
    setQueueIndex(0)
  }
  
  // Playlist management
  const createPlaylist = (name: string) => {
    if (!name.trim()) return
    const newPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      tracks: []
    }
    setPlaylists(prev => [...prev, newPlaylist])
    setNewPlaylistName("")
    setShowPlaylistModal(false)
  }
  
  const addToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        // Avoid duplicates
        if (p.tracks.some(t => t.videoId === track.videoId)) return p
        return { ...p, tracks: [...p.tracks, track] }
      }
      return p
    }))
  }
  
  const removeFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter(t => t.videoId !== trackId) }
      }
      return p
    }))
  }
  
  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId))
  }
  
  const playPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId)
    if (playlist && playlist.tracks.length > 0) {
      setQueue(playlist.tracks)
      setQueueIndex(0)
      setCurrentTrack(playlist.tracks[0])
      setShowPlayer(true)
      setIsPlaying(true)
    }
  }
  
  // Sleep timer
  const setSleepTimerMinutes = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimer(null)
      setSleepTimerEnd(null)
    } else {
      setSleepTimer(minutes)
      setSleepTimerEnd(Date.now() + minutes * 60 * 1000)
    }
  }
  
  // Seekable progress bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !currentTrack) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = Math.floor(percent * duration)
    
    setCurrentTime(newTime)
    setIsSeeking(true)
    
    // Note: Can't actually seek in YouTube iframe without proper API integration
    // This updates the visual progress bar
  }
  
  const handleSeekEnd = () => {
    setIsSeeking(false)
  }
  
  // Share song
  const shareSong = async () => {
    if (!currentTrack) return
    
    const shareUrl = `https://www.youtube.com/watch?v=${currentTrack.videoId}`
    const shareText = `${currentTrack.title} - ${currentTrack.artist || currentTrack.subtitle}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: shareText,
          url: shareUrl
        })
      } catch (e) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert("Link copied to clipboard!")
      } catch (e) {
        // Clipboard not available
      }
    }
  }
  
  // Playback speed (visual only - YouTube iframe doesn't support speed control via postMessage)
  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    setShowSpeedMenu(false)
  }

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
          <button 
            onClick={() => setExpandedShelf(shelf)}
            className="text-xl font-bold text-white hover:text-red-400 transition-colors text-left flex items-center gap-2"
          >
            {shelf.shelfTitle}
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
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

  // SSR safety - don't render until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen h-screen w-full bg-gradient-to-b from-slate-900 to-black items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <>
    <div className={`flex flex-col min-h-screen h-screen w-full bg-gradient-to-b from-slate-900 to-black overflow-hidden ${showFullPlayer ? 'invisible' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/30">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
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
                
                {/* Playlists */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Playlists</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white"
                      onClick={() => setShowPlaylistModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Create
                    </Button>
                  </div>
                  
                  {playlists.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No playlists yet</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {playlists.map(playlist => (
                        <button
                          key={playlist.id}
                          className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                          onClick={() => setSelectedPlaylist(playlist.id)}
                        >
                          <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center mb-2">
                            <Music className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="text-white font-medium text-sm truncate w-full">{playlist.name}</h4>
                          <p className="text-xs text-slate-400">{playlist.tracks.length} songs</p>
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
            
            {/* Playlist Detail View */}
            {selectedPlaylist && (
              <div className="fixed inset-0 z-50 bg-slate-900">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-white"
                      onClick={() => setSelectedPlaylist(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h3 className="text-lg font-bold text-white">
                      {playlists.find(p => p.id === selectedPlaylist)?.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-500"
                      onClick={() => {
                        deletePlaylist(selectedPlaylist)
                        setSelectedPlaylist(null)
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="p-4">
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        playPlaylist(selectedPlaylist)
                        setSelectedPlaylist(null)
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" /> Play All
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {playlists.find(p => p.id === selectedPlaylist)?.tracks.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No songs in this playlist</p>
                    ) : (
                      <div className="space-y-2">
                        {playlists.find(p => p.id === selectedPlaylist)?.tracks.map((track, idx) => (
                          <div
                            key={`pl-${track.videoId}-${idx}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <button
                              onClick={() => playTrack(track, playlists.find(p => p.id === selectedPlaylist)?.tracks)}
                              className="flex items-center gap-3 flex-1"
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
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              onClick={() => removeFromPlaylist(selectedPlaylist, track.videoId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Silent audio element for Media Session API - enables Bluetooth/system controls */}
      <audio
        ref={silentAudioRef}
        loop
        playsInline
        src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
        style={{ display: 'none' }}
      />

      {/* YouTube Embed for audio playback - hidden */}
      {showPlayer && currentTrack && (
        <iframe
          key={currentTrack.videoId}
          ref={playerRef}
          src={`https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          className="w-0 h-0 absolute"
          allow="autoplay; encrypted-media"
          style={{ height: 0, width: 0, border: 0, position: 'absolute', left: -9999 }}
        />
      )}

      {/* Mini Player - Above tab bar, swipe up to expand */}
      {showPlayer && currentTrack && !showFullPlayer && (
        <div 
          className="border-t border-white/10 cursor-pointer transition-colors duration-500"
          style={{ 
            background: dynamicThemeEnabled 
              ? `linear-gradient(to right, ${secondaryColor}, ${dominantColor})`
              : 'linear-gradient(to right, #0f172a, #1e293b)'
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMoveMini}
          onTouchEnd={onTouchEndMini}
          onClick={() => setShowFullPlayer(true)}
        >
          {/* Swipe indicator */}
          <div className="flex justify-center pt-2">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>
          
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
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </div>
        </div>
      )}

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
    </div>

    {/* Full Screen Player - Rendered outside main container for proper fixed positioning */}
    {showFullPlayer && currentTrack && (
      <div 
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex flex-col overscroll-none"
        style={{ 
          backgroundColor: dynamicThemeEnabled ? secondaryColor : '#000000',
          minHeight: '100vh',
          minHeight: '100dvh',
          touchAction: 'pan-x pinch-zoom'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMoveFull}
        onTouchEnd={onTouchEndFull}
      >
        {/* Gradient overlay - uses dynamic colors */}
        <div 
          className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-700 ease-out"
          style={{ 
            background: dynamicThemeEnabled 
              ? `linear-gradient(180deg, ${dominantColor} 0%, ${secondaryColor} 50%, ${secondaryColor} 100%)`
              : 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #000000 100%)'
          }}
        />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white"
            onClick={() => setShowFullPlayer(false)}
          >
            <ChevronLeft className="h-6 w-6 rotate-[-90deg]" />
          </Button>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Now Playing</p>
            <p className="text-sm text-white">{currentTrack.album || "Unknown Album"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white"
          >
            <ListMusic className="h-5 w-5" />
          </Button>
        </div>

        {/* Album Art */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-8 shrink-0 min-h-0">
          <img
            src={currentTrack.thumbnail?.replace('mqdefault', 'maxresdefault') || currentTrack.thumbnail || "/placeholder.svg"}
            alt={currentTrack.title}
            className="w-full max-w-[320px] aspect-square rounded-lg shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Track Info */}
        <div 
          className="relative z-10 px-8 py-4 shrink-0"
          style={{ backgroundColor: dynamicThemeEnabled ? secondaryColor : '#0f172a' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="overflow-hidden">
                <h2 
                  className="text-xl font-bold text-white whitespace-nowrap animate-marquee"
                  style={{
                    animation: currentTrack.title.length > 25 ? 'marquee 8s linear infinite' : 'none'
                  }}
                >
                  {currentTrack.title}
                  {currentTrack.title.length > 25 && <span className="px-8">{currentTrack.title}</span>}
                </h2>
              </div>
              <p className="text-slate-400 truncate">{currentTrack.artist || currentTrack.subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white"
              onClick={() => toggleLike(currentTrack)}
            >
              <Heart className={`h-6 w-6 ${isLiked(currentTrack) ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Progress Bar - Seekable */}
        <div 
          className="relative z-10 px-8 py-2 shrink-0"
          style={{ backgroundColor: dynamicThemeEnabled ? secondaryColor : '#0f172a' }}
        >
          <div 
            ref={progressBarRef}
            className="w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer touch-none"
            onClick={handleSeek}
            onTouchStart={handleSeek}
            onTouchMove={handleSeek}
            onTouchEnd={handleSeekEnd}
          >
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ 
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                transition: isSeeking ? 'none' : 'width 0.3s'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div 
          className="relative z-10 flex items-center justify-center gap-6 py-4 shrink-0"
          style={{ backgroundColor: dynamicThemeEnabled ? secondaryColor : '#0f172a' }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-white"
            onClick={() => setIsShuffle(!isShuffle)}
          >
            <Shuffle className={`h-5 w-5 ${isShuffle ? "text-red-500" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-white"
            onClick={playPrev}
          >
            <SkipBack className="h-7 w-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 bg-white text-black hover:bg-white/90 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-white"
            onClick={playNext}
          >
            <SkipForward className="h-7 w-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-white"
            onClick={() => setIsRepeat(!isRepeat)}
          >
            <Repeat className={`h-5 w-5 ${isRepeat ? "text-red-500" : ""}`} />
          </Button>
        </div>
        
        {/* Extra Controls Row */}
        <div 
          className="relative z-10 flex items-center justify-around px-8 py-3 shrink-0"
          style={{ backgroundColor: dynamicThemeEnabled ? secondaryColor : '#0f172a' }}
        >
          {/* Queue */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white flex flex-col items-center gap-1"
            onClick={() => setShowQueuePanel(true)}
          >
            <ListMusic className="h-5 w-5" />
            <span className="text-xs">Queue</span>
          </Button>
          
          {/* Sleep Timer */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 ${sleepTimer ? "text-red-500" : "text-white/70 hover:text-white"}`}
              onClick={() => {
                const nextIndex = SLEEP_TIMER_OPTIONS.findIndex(o => o.value === sleepTimer) + 1
                const nextOption = SLEEP_TIMER_OPTIONS[nextIndex % SLEEP_TIMER_OPTIONS.length]
                setSleepTimerMinutes(nextOption.value)
              }}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs">{sleepTimer ? `${sleepTimer}m` : "Timer"}</span>
            </Button>
          </div>
          
          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white flex flex-col items-center gap-1"
            onClick={shareSong}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Share</span>
          </Button>
          
          {/* Speed */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 ${playbackSpeed !== 1 ? "text-red-500" : "text-white/70 hover:text-white"}`}
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            >
              <span className="text-sm font-bold">{playbackSpeed}x</span>
              <span className="text-xs">Speed</span>
            </Button>
            {showSpeedMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 overflow-hidden">
                {SPEED_OPTIONS.map(speed => (
                  <button
                    key={speed}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-white/10 ${playbackSpeed === speed ? "text-red-500" : "text-white"}`}
                    onClick={() => setSpeed(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Equalizer */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 ${equalizer !== "normal" ? "text-red-500" : "text-white/70 hover:text-white"}`}
              onClick={() => setShowEqualizerMenu(!showEqualizerMenu)}
            >
              <Volume2 className="h-5 w-5" />
              <span className="text-xs">EQ</span>
            </Button>
            {showEqualizerMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 overflow-hidden min-w-[120px]">
                {EQUALIZER_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-white/10 ${equalizer === preset.id ? "text-red-500" : "text-white"}`}
                    onClick={() => {
                      setEqualizer(preset.id)
                      setShowEqualizerMenu(false)
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swipe down indicator */}
        <div 
          className="relative z-10 flex justify-center pb-6 shrink-0"
          style={{ backgroundColor: dynamicThemeEnabled ? secondaryColor : '#0f172a' }}
        >
          <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    )}
    
    {/* Queue Panel Modal */}
    {showQueuePanel && (
      <div className="fixed inset-0 z-[10000] bg-black/80 flex items-end">
        <div 
          className="w-full max-h-[80vh] bg-slate-900 rounded-t-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Queue</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500"
                onClick={clearQueue}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white"
                onClick={() => setShowQueuePanel(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {queue.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Queue is empty</p>
            ) : (
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <div 
                    key={`${track.videoId}-${index}`}
                    className={`flex items-center gap-3 p-3 rounded-lg ${index === queueIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <div className="text-slate-500 text-sm w-6">{index + 1}</div>
                    <img
                      src={track.thumbnail || "/placeholder.svg"}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${index === queueIndex ? "text-red-500" : "text-white"}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{track.artist || track.subtitle}</p>
                    </div>
                    {index !== queueIndex && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => removeFromQueue(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    
    {/* Create Playlist Modal */}
    {showPlaylistModal && (
      <div className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm">
          <h3 className="text-lg font-bold text-white mb-4">Create Playlist</h3>
          <Input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-white"
              onClick={() => {
                setShowPlaylistModal(false)
                setNewPlaylistName("")
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => createPlaylist(newPlaylistName)}
              disabled={!newPlaylistName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
