"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import React from "react"

import { Search, Play, Pause, SkipForward, SkipBack, Heart, Repeat, Home, Compass, Library, X, ChevronLeft, ChevronRight, Loader2, ListMusic, ArrowLeft, Shuffle, Clock, Share2, Volume2, Plus, Trash2, GripVertical, Music, Download, CheckCircle2, WifiOff, HardDrive, MoreVertical, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOfflineMusic } from "@/hooks/use-offline-music"

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
  browseId?: string
  playlistId?: string
}

interface Shelf {
  shelfTitle: string
  items: Track[]
}

// All YT Music Genres
const GENRES = [
  { id: "pop", name: "Pop", color: "from-pink-500 to-rose-500" },
  { id: "rock", name: "Rock", color: "from-red-500 to-red-700" },
  { id: "hip hop", name: "Hip-Hop", color: "from-amber-500 to-orange-500" },
  { id: "r&b soul", name: "R&B & Soul", color: "from-purple-500 to-violet-600" },
  { id: "country", name: "Country", color: "from-orange-400 to-yellow-500" },
  { id: "latin", name: "Latin", color: "from-red-400 to-pink-500" },
  { id: "electronic dance", name: "Electronic", color: "from-cyan-500 to-blue-500" },
  { id: "jazz", name: "Jazz", color: "from-yellow-500 to-amber-600" },
  { id: "classical", name: "Classical", color: "from-indigo-500 to-purple-600" },
  { id: "indie alternative", name: "Indie & Alternative", color: "from-teal-500 to-emerald-600" },
  { id: "metal", name: "Metal", color: "from-slate-600 to-slate-800" },
  { id: "folk acoustic", name: "Folk & Acoustic", color: "from-lime-500 to-green-600" },
  { id: "reggae", name: "Reggae", color: "from-green-500 to-yellow-500" },
  { id: "blues", name: "Blues", color: "from-blue-600 to-indigo-700" },
  { id: "punk", name: "Punk", color: "from-fuchsia-500 to-pink-600" },
  { id: "k-pop", name: "K-Pop", color: "from-violet-400 to-purple-500" },
  { id: "j-pop", name: "J-Pop", color: "from-rose-400 to-red-500" },
  { id: "afrobeats", name: "Afrobeats", color: "from-orange-500 to-red-500" },
  { id: "gospel christian", name: "Gospel & Christian", color: "from-sky-400 to-blue-500" },
  { id: "anime", name: "Anime", color: "from-pink-400 to-violet-500" },
]

// Moods & Moments
const MOODS = [
  { id: "happy", name: "Happy", color: "from-yellow-400 to-orange-400", icon: "sun" },
  { id: "sad", name: "Sad", color: "from-blue-400 to-indigo-500", icon: "cloud-rain" },
  { id: "energetic", name: "Energetic", color: "from-red-500 to-orange-500", icon: "zap" },
  { id: "chill", name: "Chill", color: "from-cyan-400 to-teal-500", icon: "wind" },
  { id: "romantic", name: "Romantic", color: "from-pink-400 to-rose-500", icon: "heart" },
  { id: "angry", name: "Angry", color: "from-red-600 to-red-800", icon: "flame" },
  { id: "peaceful", name: "Peaceful", color: "from-green-400 to-emerald-500", icon: "leaf" },
  { id: "melancholy", name: "Melancholy", color: "from-slate-400 to-slate-600", icon: "moon" },
  { id: "uplifting", name: "Uplifting", color: "from-amber-400 to-yellow-500", icon: "sunrise" },
  { id: "dark", name: "Dark", color: "from-gray-700 to-gray-900", icon: "moon" },
]

// Activities & Contexts
const ACTIVITIES = [
  { id: "workout music", name: "Workout", color: "from-red-500 to-orange-600", icon: "dumbbell" },
  { id: "focus music", name: "Focus", color: "from-blue-500 to-cyan-500", icon: "target" },
  { id: "sleep music", name: "Sleep", color: "from-indigo-600 to-purple-700", icon: "moon" },
  { id: "party music", name: "Party", color: "from-pink-500 to-purple-500", icon: "party-popper" },
  { id: "driving music", name: "Driving", color: "from-slate-500 to-slate-700", icon: "car" },
  { id: "cooking music", name: "Cooking", color: "from-orange-400 to-red-500", icon: "utensils" },
  { id: "study music", name: "Study", color: "from-emerald-500 to-teal-600", icon: "book" },
  { id: "meditation music", name: "Meditation", color: "from-violet-400 to-purple-500", icon: "brain" },
  { id: "gaming music", name: "Gaming", color: "from-green-500 to-emerald-600", icon: "gamepad" },
  { id: "morning music", name: "Morning", color: "from-amber-300 to-orange-400", icon: "sunrise" },
]

// Decades
const DECADES = [
  { id: "2020s hits", name: "2020s", color: "from-fuchsia-500 to-pink-500" },
  { id: "2010s hits", name: "2010s", color: "from-purple-500 to-violet-600" },
  { id: "2000s hits", name: "2000s", color: "from-blue-500 to-cyan-500" },
  { id: "90s hits", name: "90s", color: "from-teal-500 to-emerald-500" },
  { id: "80s hits", name: "80s", color: "from-pink-500 to-rose-500" },
  { id: "70s hits", name: "70s", color: "from-orange-500 to-amber-500" },
  { id: "60s hits", name: "60s", color: "from-yellow-500 to-lime-500" },
  { id: "50s hits", name: "50s", color: "from-red-400 to-rose-500" },
]

// Charts & New Releases
const CHARTS = [
  { id: "top 100 songs", name: "Top 100", color: "from-amber-500 to-yellow-500" },
  { id: "trending music", name: "Trending", color: "from-red-500 to-pink-500" },
  { id: "new releases", name: "New Releases", color: "from-green-500 to-emerald-500" },
  { id: "viral hits", name: "Viral Hits", color: "from-violet-500 to-purple-600" },
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
  const [textSuggestions, setTextSuggestions] = useState<string[]>([])
  const [artistSuggestions, setArtistSuggestions] = useState<{type: string, id: string, browseId: string, name: string, thumbnail: string}[]>([])
  const [songSuggestions, setSongSuggestions] = useState<{type: string, id: string, videoId: string, title: string, artist: string, thumbnail: string}[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Artist page state
  const [showArtistPage, setShowArtistPage] = useState(false)
  const [currentArtist, setCurrentArtist] = useState<{id: string, name: string, thumbnail: string, banner: string, description: string, subscriberCount: string} | null>(null)
  const [artistShelves, setArtistShelves] = useState<any[]>([])
  const [loadingArtist, setLoadingArtist] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Album/Playlist page state
  const [showAlbumPage, setShowAlbumPage] = useState(false)
  const [currentAlbum, setCurrentAlbum] = useState<{id: string, title: string, artist: string, thumbnail: string, year?: string} | null>(null)
  const [albumTracks, setAlbumTracks] = useState<Track[]>([])
  const [loadingAlbum, setLoadingAlbum] = useState(false)
  
  // Set mounted state for portal
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showFullPlayer, setShowFullPlayer] = useState(false)
  
  // Swipe gesture state with drag tracking
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0) // Current drag position
  const [isDragging, setIsDragging] = useState(false)
  const [dragVelocity, setDragVelocity] = useState(0)
  const lastTouchY = useRef<number>(0)
  const lastTouchTime = useRef<number>(0)
  
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
  const [loadingPlaylist, setLoadingPlaylist] = useState(false)
  const [librarySubTab, setLibrarySubTab] = useState<"liked" | "history" | "playlists" | "downloads">("playlists")
  
  // Offline music storage
  const {
    downloadedTracks,
    downloadProgress,
    isOnline,
    isLoading: isLoadingDownloads,
    downloadTrack,
    deleteTrack,
    isDownloaded,
    getOfflineUrl,
    getStorageUsage,
  } = useOfflineMusic()
  
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; percentage: number } | null>(null)
  
  // Audio element for offline playback
  const offlineAudioRef = useRef<HTMLAudioElement>(null)
  const [isOfflinePlayback, setIsOfflinePlayback] = useState(false)
  
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
  
  // Swipe gesture handlers with velocity tracking
  const minSwipeDistance = 50
  const velocityThreshold = 0.5 // pixels per millisecond
  
  const onTouchStartMini = (e: React.TouchEvent) => {
    const y = e.targetTouches[0].clientY
    setTouchStart(y)
    setTouchEnd(null)
    setIsDragging(true)
    setDragOffset(0)
    lastTouchY.current = y
    lastTouchTime.current = Date.now()
    setDragVelocity(0)
  }
  
  const onTouchStartFull = (e: React.TouchEvent) => {
    const y = e.targetTouches[0].clientY
    setTouchStart(y)
    setTouchEnd(null)
    setIsDragging(true)
    setDragOffset(0)
    lastTouchY.current = y
    lastTouchTime.current = Date.now()
    setDragVelocity(0)
  }
  
  const onTouchMoveMini = (e: React.TouchEvent) => {
    if (!touchStart) return
    const y = e.targetTouches[0].clientY
    const now = Date.now()
    const deltaY = y - lastTouchY.current
    const deltaTime = now - lastTouchTime.current
    
    // Calculate velocity (pixels per millisecond)
    if (deltaTime > 0) {
      setDragVelocity(deltaY / deltaTime)
    }
    
    lastTouchY.current = y
    lastTouchTime.current = now
    
    // Calculate drag offset (negative = swiping up to expand)
    const offset = y - touchStart
    // Only allow upward drag (negative offset) for mini player
    if (offset < 0) {
      setDragOffset(offset)
    }
    setTouchEnd(y)
  }
  
  const onTouchMoveFull = (e: React.TouchEvent) => {
    if (!touchStart) return
    const y = e.targetTouches[0].clientY
    const now = Date.now()
    const deltaY = y - lastTouchY.current
    const deltaTime = now - lastTouchTime.current
    
    // Calculate velocity
    if (deltaTime > 0) {
      setDragVelocity(deltaY / deltaTime)
    }
    
    lastTouchY.current = y
    lastTouchTime.current = now
    
    // Prevent browser pull-to-refresh
    if (y > touchStart) {
      e.preventDefault()
    }
    
    // Calculate drag offset (positive = swiping down to minimize)
    const offset = y - touchStart
    // Only allow downward drag (positive offset) for full player
    if (offset > 0) {
      setDragOffset(offset)
    }
    setTouchEnd(y)
  }
  
  const onTouchEndMini = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }
    
    const distance = touchStart - touchEnd
    const shouldExpand = distance > minSwipeDistance || dragVelocity < -velocityThreshold
    
    // Animate to final position
    setDragOffset(0)
    setIsDragging(false)
    
    if (shouldExpand) {
      setShowFullPlayer(true)
    }
    
    setTouchStart(null)
    setTouchEnd(null)
    setDragVelocity(0)
  }
  
  const onTouchEndFull = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }
    
    const distance = touchEnd - touchStart
    const shouldMinimize = distance > minSwipeDistance || dragVelocity > velocityThreshold
    
    // Animate to final position
    setDragOffset(0)
    setIsDragging(false)
    
    if (shouldMinimize) {
      setShowFullPlayer(false)
    }
    
    setTouchStart(null)
    setTouchEnd(null)
    setDragVelocity(0)
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
  
  // Load storage info
  useEffect(() => {
    if (!mounted) return
    getStorageUsage().then(info => {
      if (info) setStorageInfo(info)
    })
  }, [mounted, downloadedTracks.length, getStorageUsage])
  
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
      // AudioContext not supported
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
  
  // Load playlist/album content
  const loadPlaylistContent = async (track: Track) => {
    console.log("[v0] loadPlaylistContent called with track:", JSON.stringify(track))
    const browseId = track.browseId || (track.playlistId ? `VL${track.playlistId}` : null)
    console.log("[v0] browseId resolved to:", browseId)
    
    if (!browseId) {
      console.log("[v0] No browseId found, playing track directly")
      playTrack(track)
      return
    }
    
    setLoadingPlaylist(true)
    try {
      const url = `/api/music?action=playlist&browseId=${encodeURIComponent(browseId)}`
      console.log("[v0] Fetching playlist from:", url)
      const response = await fetch(url)
      const data = await response.json()
      console.log("[v0] Playlist API response:", JSON.stringify(data).substring(0, 500))
      
      if (data.tracks && data.tracks.length > 0) {
        console.log("[v0] Setting expanded shelf with", data.tracks.length, "tracks")
        setExpandedShelf({
          shelfTitle: data.title || track.title,
          items: data.tracks
        })
      } else {
        console.log("[v0] No tracks in response, playing track directly")
        // If no tracks returned, it might be a regular track, just play it
        playTrack(track)
      }
    } catch (err) {
      console.log("[v0] Fetch error:", err)
      // If fetch fails, try to play the track directly
      playTrack(track)
    } finally {
      setLoadingPlaylist(false)
    }
  }
  
  // Fetch search suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setTextSuggestions([])
      setArtistSuggestions([])
      setSongSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    try {
      const response = await fetch(`/api/music?action=suggestions&query=${encodeURIComponent(query)}`)
      const data = await response.json()
      setTextSuggestions(data.textSuggestions || [])
      setArtistSuggestions(data.artistResults || [])
      setSongSuggestions(data.songResults || [])
      const hasResults = (data.textSuggestions?.length > 0) || (data.artistResults?.length > 0) || (data.songResults?.length > 0)
      setShowSuggestions(hasResults)
    } catch {
      setTextSuggestions([])
      setArtistSuggestions([])
      setSongSuggestions([])
    }
  }
  
  // Handle search input change with debounced suggestions
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear previous debounce timer
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current)
    }
    
    // Debounce suggestions fetch
    suggestionsDebounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 200)
  }
  
  // Select a text suggestion
  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setTextSuggestions([])
    setArtistSuggestions([])
    setSongSuggestions([])
    // Trigger search
    setIsSearching(true)
    fetch(`/api/music?action=search&query=${encodeURIComponent(suggestion)}`)
      .then(res => res.json())
      .then(data => {
        setSearchResults(data.results || [])
      })
      .catch(err => console.error("Search error:", err))
      .finally(() => setIsSearching(false))
  }
  
  // Fill suggestion into search box (arrow button)
  const fillSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion)
    fetchSuggestions(suggestion)
  }
  
  // Open artist page
  const openArtistPage = async (browseId: string, artistName?: string, thumbnail?: string) => {
    setShowSuggestions(false)
    setShowSearch(false)
    setLoadingArtist(true)
    setShowArtistPage(true)
    
    // Set initial data if available
    if (artistName) {
      setCurrentArtist({
        id: browseId,
        name: artistName,
        thumbnail: thumbnail || "",
        banner: thumbnail || "",
        description: "",
        subscriberCount: "",
      })
    }
    
    try {
      const response = await fetch(`/api/music?action=artist&browseId=${encodeURIComponent(browseId)}`)
      const data = await response.json()
      if (data.artist) {
        setCurrentArtist(data.artist)
      }
      setArtistShelves(data.shelves || [])
    } catch (err) {
      console.error("Error loading artist:", err)
    } finally {
      setLoadingArtist(false)
    }
  }
  
  // Open album/playlist page
  const openAlbumPage = async (browseId: string, title?: string, artist?: string, thumbnail?: string, year?: string) => {
    setLoadingAlbum(true)
    setShowAlbumPage(true)
    
    // Set initial data if available
    if (title) {
      setCurrentAlbum({
        id: browseId,
        title: title,
        artist: artist || "",
        thumbnail: thumbnail || "",
        year: year,
      })
    }
    
    try {
      const response = await fetch(`/api/music?action=album&browseId=${encodeURIComponent(browseId)}`)
      const data = await response.json()
      console.log("[v0] Album API response:", data)
      console.log("[v0] Debug info:", data.debug)
      if (data.album) {
        setCurrentAlbum({
          id: browseId,
          title: data.album.title || title || "",
          artist: data.album.artist || artist || "",
          thumbnail: data.album.thumbnail || thumbnail || "",
          year: year,
        })
      }
      if (data.tracks && data.tracks.length > 0) {
        const tracks: Track[] = data.tracks.map((t: any) => ({
          id: t.videoId,
          videoId: t.videoId,
          title: t.title,
          artist: t.artist,
          thumbnail: t.thumbnail,
        }))
        setAlbumTracks(tracks)
      } else {
        console.log("[v0] No tracks found in response")
      }
    } catch (err) {
      console.error("[v0] Error loading album:", err)
    } finally {
      setLoadingAlbum(false)
    }
  }
  
  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setShowSuggestions(false)
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

  // Play track using YouTube embed or offline audio
  const playTrack = (track: Track, trackList?: Track[]) => {
    if (!track.videoId) return
    
    // Check if track is downloaded for offline playback
    const offlineUrl = getOfflineUrl(track.videoId)
    
    if (offlineUrl && offlineAudioRef.current) {
      // Use offline audio playback
      setIsOfflinePlayback(true)
      offlineAudioRef.current.src = offlineUrl
      offlineAudioRef.current.play().catch(e => console.log("Offline playback error:", e))
    } else if (!isOnline && !offlineUrl) {
      // Offline and track not downloaded - show error
      alert("You're offline and this track isn't downloaded")
      return
    } else {
      // Online playback via YouTube embed
      setIsOfflinePlayback(false)
    }
    
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
    
    // Handle offline playback
    if (isOfflinePlayback && offlineAudioRef.current) {
      if (newState) {
        offlineAudioRef.current.play().catch(e => console.log("Play error:", e))
      } else {
        offlineAudioRef.current.pause()
      }
      return
    }
    
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

  // Track card component - handles both regular tracks and playlists/albums
  const TrackCard = ({ track, trackList, size = "normal" }: { track: Track; trackList?: Track[]; size?: "normal" | "small" }) => {
    // Check if this is a playlist/album (has browseId or playlistId but no direct videoId)
    const isPlaylist = (track.type === "playlist" || track.type === "album" || (!track.videoId && (track.browseId || track.playlistId)))
    
    const handleClick = () => {
      if (isPlaylist) {
        // Open playlist to show its contents
        loadPlaylistContent(track)
      } else {
        // Regular track - play it
        playTrack(track, trackList)
      }
    }
    
    return (
      <button
        onClick={handleClick}
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
              {isPlaylist ? <ListMusic className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white fill-white" />}
            </div>
          </div>
          {/* Playlist indicator badge */}
          {isPlaylist && (
            <div className="absolute top-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5">
              <ListMusic className="w-3 h-3 text-white" />
            </div>
          )}
          {currentTrack?.videoId === track.videoId && isPlaying && !isPlaylist && (
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
      {(track.artist || track.subtitle) && (
        <p 
          className={`text-slate-400 line-clamp-1 hover:underline cursor-pointer ${size === "small" ? "text-xs" : "text-xs"}`}
          onClick={(e) => {
            e.stopPropagation()
            // Search for artist to get their browseId
            const artistName = track.artist || track.subtitle || ""
            if (artistName) {
              setSearchQuery(artistName)
              setShowSearch(true)
              handleSearch()
            }
          }}
        >
          {track.artist || track.subtitle}
        </p>
      )}
    </button>
    )
  }

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
        <div className="flex-1 max-w-md mx-4 relative">
          {showSearch ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setShowSuggestions(false)
                        handleSearch()
                      }
                      if (e.key === "Escape") {
                        setShowSuggestions(false)
                      }
                    }}
                    onFocus={() => textSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search songs, artists..."
                    className="bg-white/10 border-0 text-white placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                    setSearchResults([])
                    setTextSuggestions([])
                    setShowSuggestions(false)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search Suggestions Dropdown - YT Music Style */}
              {showSuggestions && (textSuggestions.length > 0 || artistSuggestions.length > 0 || songSuggestions.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#212121] rounded-lg shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                  {/* Text Suggestions */}
                  {textSuggestions.map((suggestion, index) => (
                    <div
                      key={`text-${index}`}
                      className="flex items-center hover:bg-white/10 transition-colors"
                    >
                      <button
                        className="flex-1 px-4 py-3 text-left text-white flex items-center gap-4 min-w-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        <span className="truncate text-[15px]">{suggestion}</span>
                      </button>
                      <button
                        className="px-4 py-3 text-slate-400 hover:text-white transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          fillSuggestion(suggestion)
                        }}
                        title="Fill search"
                      >
                        <ArrowLeft className="h-4 w-4 rotate-[135deg]" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Artist & Song Results */}
                  {(artistSuggestions.length > 0 || songSuggestions.length > 0) && textSuggestions.length > 0 && (
                    <div className="border-t border-white/10 my-1" />
                  )}
                  
                  {/* Artist Suggestions */}
                  {artistSuggestions.map((artist, index) => (
                    <button
                      key={`artist-${index}`}
                      className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => openArtistPage(artist.browseId, artist.name, artist.thumbnail)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img 
                          src={artist.thumbnail || "/placeholder.svg"} 
                          alt={artist.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="truncate font-medium text-[15px]">{artist.name}</span>
                      </div>
                      <MoreVertical className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                  
                  {/* Song Suggestions */}
                  {songSuggestions.map((song, index) => (
                    <button
                      key={`song-${index}`}
                      className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowSuggestions(false)
                        const track: Track = {
                          id: song.videoId,
                          videoId: song.videoId,
                          title: song.title,
                          artist: song.artist,
                          thumbnail: song.thumbnail,
                        }
                        playTrack(track, [track])
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img 
                          src={song.thumbnail || "/placeholder.svg"} 
                          alt={song.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium text-[15px]">{song.title}</span>
                          <span className="truncate text-sm text-slate-400">{song.artist}</span>
                        </div>
                      </div>
                      <MoreVertical className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
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
  if (isDownloaded(track.videoId)) {
    deleteTrack(track.videoId)
  } else {
    downloadTrack(track)
  }
  }}
  >
  {downloadProgress.get(track.videoId)?.status === "downloading" ? (
    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
  ) : isDownloaded(track.videoId) ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  ) : (
    <Download className="h-4 w-4" />
  )}
  </Button>
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
              <div className="space-y-8">
                {/* Charts & New Releases */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Charts & New Releases</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CHARTS.map((chart) => (
                      <button
                        key={chart.id}
                        onClick={() => {
                          setSearchQuery(chart.id)
                          setShowSearch(true)
                          setTimeout(() => handleSearch(), 100)
                        }}
                        className={`aspect-[2/1] rounded-lg bg-gradient-to-br ${chart.color} hover:opacity-90 flex items-center justify-center transition-all hover:scale-105 shadow-lg`}
                      >
                        <span className="text-white font-bold text-base drop-shadow-md">{chart.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moods & Moments */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Moods & Moments</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => {
                          setSearchQuery(`${mood.name} music`)
                          setShowSearch(true)
                          setTimeout(() => handleSearch(), 100)
                        }}
                        className={`flex-shrink-0 w-28 h-28 rounded-xl bg-gradient-to-br ${mood.color} hover:opacity-90 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg`}
                      >
                        <span className="text-white font-bold text-sm drop-shadow-md">{mood.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Activities</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {ACTIVITIES.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => {
                          setSearchQuery(activity.id)
                          setShowSearch(true)
                          setTimeout(() => handleSearch(), 100)
                        }}
                        className={`flex-shrink-0 w-32 h-20 rounded-xl bg-gradient-to-br ${activity.color} hover:opacity-90 flex items-center justify-center transition-all hover:scale-105 shadow-lg`}
                      >
                        <span className="text-white font-bold text-sm drop-shadow-md">{activity.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decades */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Decades</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {DECADES.map((decade) => (
                      <button
                        key={decade.id}
                        onClick={() => {
                          setSearchQuery(decade.id)
                          setShowSearch(true)
                          setTimeout(() => handleSearch(), 100)
                        }}
                        className={`flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br ${decade.color} hover:opacity-90 flex items-center justify-center transition-all hover:scale-105 shadow-lg`}
                      >
                        <span className="text-white font-bold text-lg drop-shadow-md">{decade.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* All Genres */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Browse by Genre</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {GENRES.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => {
                          setSearchQuery(genre.id)
                          setShowSearch(true)
                          setTimeout(() => handleSearch(), 100)
                        }}
                        className={`aspect-video rounded-lg bg-gradient-to-br ${genre.color} hover:opacity-90 flex items-center justify-center transition-all hover:scale-105 shadow-lg`}
                      >
                        <span className="text-white font-bold text-base drop-shadow-md">{genre.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

  {activeTab === "library" && (
  <div>
  {/* Offline Status Banner */}
  {!isOnline && (
    <div className="flex items-center gap-2 px-4 py-2 mb-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span className="text-sm text-amber-200">You're offline. Only downloaded music is available.</span>
    </div>
  )}
  
  {/* Library Sub-tabs */}
  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
    {[
      { id: "liked", label: "Liked", icon: Heart },
      { id: "downloads", label: "Downloads", icon: Download },
      { id: "history", label: "History", icon: Clock },
      { id: "playlists", label: "Playlists", icon: ListMusic },
    ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setLibrarySubTab(tab.id as any)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
          librarySubTab === tab.id 
            ? "bg-white text-black" 
            : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        <tab.icon className="w-4 h-4" />
        <span className="text-sm font-medium">{tab.label}</span>
        {tab.id === "downloads" && downloadedTracks.length > 0 && (
          <span className={`text-xs px-1.5 rounded-full ${librarySubTab === "downloads" ? "bg-black/20" : "bg-white/20"}`}>
            {downloadedTracks.length}
          </span>
        )}
      </button>
    ))}
  </div>

  {/* Downloads Tab */}
  {librarySubTab === "downloads" && (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
          <Download className="w-10 h-10 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Downloads</h3>
          <p className="text-slate-400">{downloadedTracks.length} songs saved offline</p>
          {storageInfo && (
            <p className="text-xs text-slate-500 mt-1">
              <HardDrive className="w-3 h-3 inline mr-1" />
              {(storageInfo.used / 1024 / 1024).toFixed(1)} MB used
            </p>
          )}
        </div>
      </div>
      
      {isLoadingDownloads ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : downloadedTracks.length === 0 ? (
        <div className="text-center py-8">
          <Download className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No downloaded songs yet</p>
          <p className="text-sm text-slate-500 mt-1">Download songs to play them offline</p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloadedTracks.map((track, idx) => (
            <div
              key={`download-${track.videoId}-${idx}`}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <button
                onClick={() => playTrack(track as Track, downloadedTracks as Track[])}
                className="flex items-center gap-3 flex-1"
              >
                <span className="text-slate-500 w-6 text-sm">{idx + 1}</span>
                <div className="relative">
                  <img
                    src={track.thumbnail || "/placeholder.svg"}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <CheckCircle2 className="absolute -bottom-1 -right-1 w-4 h-4 text-emerald-400 bg-black rounded-full" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-white font-medium line-clamp-1">{track.title}</h4>
                  <p className="text-sm text-slate-400 line-clamp-1">{track.artist}</p>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTrack(track.videoId)}
                className="h-8 w-8 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* Liked Songs Tab */}
  {librarySubTab === "liked" && (
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
                )}
                
                {/* Playlists Tab */}
                {librarySubTab === "playlists" && (
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
                )}
                
  {/* History Tab */}
  {librarySubTab === "history" && (
  <div>
  <h3 className="text-xl font-bold text-white mb-4">Recently Played</h3>
  {recentlyPlayed.length === 0 ? (
    <div className="text-center py-8">
      <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400">No listening history yet</p>
      <p className="text-sm text-slate-500 mt-1">Songs you play will appear here</p>
    </div>
  ) : (
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
  )}
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

  {/* Hidden Audio element for offline playback */}
  <audio
    ref={offlineAudioRef}
    onEnded={playNext}
    onTimeUpdate={(e) => {
      if (!isSeeking) {
        setCurrentTime(e.currentTarget.currentTime)
      }
    }}
    onLoadedMetadata={(e) => {
      setDuration(e.currentTarget.duration)
    }}
    onPlay={() => setIsPlaying(true)}
    onPause={() => setIsPlaying(false)}
    style={{ display: 'none' }}
  />

  {/* YouTube Embed for audio playback - hidden (only when online and not offline playback) */}
  {showPlayer && currentTrack && !isOfflinePlayback && (
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
          className="border-t border-white/10 cursor-pointer"
          style={{ 
            background: dynamicThemeEnabled 
              ? `linear-gradient(to right, ${secondaryColor}, ${dominantColor})`
              : 'linear-gradient(to right, #0f172a, #1e293b)',
            transform: isDragging && dragOffset < 0 
              ? `translateY(${dragOffset * 0.3}px) scale(${1 + Math.abs(dragOffset) * 0.0003})` 
              : 'translateY(0) scale(1)',
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), background 0.5s',
            opacity: isDragging && dragOffset < 0 ? 1 - Math.abs(dragOffset) * 0.002 : 1,
          }}
          onTouchStart={onTouchStartMini}
          onTouchMove={onTouchMoveMini}
          onTouchEnd={onTouchEndMini}
          onClick={() => !isDragging && setShowFullPlayer(true)}
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
  <div className="flex items-center gap-2">
    <h4 className="text-white font-medium text-sm line-clamp-1">{currentTrack.title}</h4>
    {isOfflinePlayback && (
      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">
        <Download className="w-3 h-3" />
        Offline
      </span>
    )}
  </div>
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

    {/* Artist Page - Full Screen Portal */}
    {showArtistPage && isMounted && createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden w-screen max-w-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/10 flex-shrink-0"
            onClick={() => {
              setShowArtistPage(false)
              setCurrentArtist(null)
              setArtistShelves([])
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-white truncate flex-1 mx-4 text-center">{currentArtist?.name}</h1>
          <div className="w-10 flex-shrink-0" />
        </div>
        
        {loadingArtist ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
            {/* Artist Banner/Image */}
            <div className="relative h-64 sm:h-80 w-full">
              <img
                src={currentArtist?.banner || currentArtist?.thumbnail || "/placeholder.svg"}
                alt={currentArtist?.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              {/* Artist Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentArtist?.name}</h2>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/50 text-white bg-transparent hover:bg-white/10 text-xs sm:text-sm px-3 sm:px-4"
                  >
                    Subscribe
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/50 text-white bg-transparent hover:bg-white/10 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4"
                  >
                    <Radio className="h-3 w-3 sm:h-4 sm:w-4" />
                    Radio
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <Shuffle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* About Section */}
            {(currentArtist?.subscriberCount || currentArtist?.description) && (
              <div className="px-4 py-4">
                <h3 className="text-lg font-bold text-white mb-2">About</h3>
                {currentArtist?.subscriberCount && (
                  <p className="text-slate-400 text-sm mb-1">{currentArtist.subscriberCount} subscribers</p>
                )}
                {currentArtist?.description && (
                  <p className="text-slate-400 text-sm line-clamp-3">{currentArtist.description}</p>
                )}
                {currentArtist?.description && (
                  <button className="text-blue-500 text-sm font-medium mt-1">Show more</button>
                )}
              </div>
            )}
            
            {/* Artist Shelves (Top Songs, Albums, Singles & EPs, etc.) */}
            {artistShelves.map((shelf, shelfIdx) => (
              <div key={`artist-shelf-${shelfIdx}`} className="mb-6 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h3 className="text-xl font-bold text-blue-500">{shelf.title}</h3>
                  {shelf.items?.length > 4 && (
                    <ChevronRight className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                
                {/* Songs list format */}
                {shelf.type === "songs" || shelf.title?.toLowerCase().includes("song") ? (
                  <div className="px-4 space-y-1">
                    {shelf.items?.slice(0, 5).map((item: any, idx: number) => (
                      <button
                        key={`song-${idx}`}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => {
                          const track: Track = {
                            id: item.videoId,
                            videoId: item.videoId,
                            title: item.title,
                            artist: item.artist || currentArtist?.name,
                            thumbnail: item.thumbnail,
                          }
                          playTrack(track, shelf.items?.map((i: any) => ({
                            id: i.videoId,
                            videoId: i.videoId,
                            title: i.title,
                            artist: i.artist || currentArtist?.name,
                            thumbnail: i.thumbnail,
                          })))
                        }}
                      >
                        <img
                          src={item.thumbnail || "/placeholder.svg"}
                          alt={item.title}
                          className="w-12 h-12 rounded object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-white font-medium line-clamp-1">{item.title}</h4>
                          <p className="text-sm text-slate-400 line-clamp-1 flex items-center gap-1">
                            {item.explicit && <span className="text-xs bg-slate-600 px-1 rounded">E</span>}
                            {item.artist || currentArtist?.name}
                          </p>
                        </div>
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Horizontal scroll for albums, videos, etc. */
                  <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide w-full max-w-full">
                    {shelf.items?.map((item: any, idx: number) => (
                      <button
                        key={`item-${idx}`}
                        className="flex-shrink-0 w-32 sm:w-36 text-left"
                        onClick={() => {
                          if (item.videoId) {
                            // Direct video - play it
                            const track: Track = {
                              id: item.videoId,
                              videoId: item.videoId,
                              title: item.title,
                              artist: item.artist || currentArtist?.name,
                              thumbnail: item.thumbnail,
                            }
                            playTrack(track, [track])
                          } else if (item.browseId) {
                            // Album/Playlist - open album page
                            openAlbumPage(item.browseId, item.title, item.artist || currentArtist?.name, item.thumbnail, item.subtitle)
                          }
                        }}
                      >
                        <div className="relative mb-2">
                          <img
                            src={item.thumbnail || "/placeholder.svg"}
                            alt={item.title}
                            className={`w-32 h-32 sm:w-36 sm:h-36 object-cover ${shelf.title?.toLowerCase().includes("artist") || shelf.title?.toLowerCase().includes("fan") ? "rounded-full" : "rounded-lg"}`}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                            <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white fill-white" />
                          </div>
                        </div>
                        <h4 className="text-white font-medium line-clamp-2 text-xs sm:text-sm">{item.title}</h4>
                        {item.subtitle && (
                          <p className="text-slate-400 text-xs line-clamp-1">{item.subtitle}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Padding at bottom for mini player */}
            <div className="h-32" />
          </div>
    )}
    </div>,
    document.body
    )}
    
    {/* Album/Playlist Page - Full Screen Portal */}
    {showAlbumPage && isMounted && createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden w-screen max-w-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/10 flex-shrink-0"
            onClick={() => {
              setShowAlbumPage(false)
              setCurrentAlbum(null)
              setAlbumTracks([])
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-white truncate flex-1 mx-4 text-center">{currentAlbum?.title}</h1>
          <div className="w-10 flex-shrink-0" />
        </div>
        
        {loadingAlbum ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full pt-16">
            {/* Album Header */}
            <div className="flex flex-col items-center px-4 py-6">
              <img
                src={currentAlbum?.thumbnail || "/placeholder.svg"}
                alt={currentAlbum?.title}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg object-cover shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-4 text-center">{currentAlbum?.title}</h2>
              <p className="text-slate-400 text-sm mt-1">{currentAlbum?.artist}</p>
              {currentAlbum?.year && (
                <p className="text-slate-500 text-xs mt-1">{currentAlbum.year}</p>
              )}
              
              {/* Play/Shuffle Buttons */}
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/50 text-white bg-transparent hover:bg-white/10 flex items-center gap-2 px-6"
                  onClick={() => {
                    if (albumTracks.length > 0) {
                      playTrack(albumTracks[0], albumTracks)
                    }
                  }}
                >
                  <Play className="h-4 w-4 fill-white" />
                  Play
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white h-10 w-10"
                  onClick={() => {
                    if (albumTracks.length > 0) {
                      const shuffled = [...albumTracks].sort(() => Math.random() - 0.5)
                      playTrack(shuffled[0], shuffled)
                    }
                  }}
                >
                  <Shuffle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Track List */}
            <div className="px-4 pb-32">
              <h3 className="text-lg font-bold text-white mb-3">Tracks</h3>
              <div className="space-y-1">
                {albumTracks.map((track, idx) => (
                  <button
                    key={`album-track-${idx}`}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => playTrack(track, albumTracks)}
                  >
                    <span className="w-6 text-slate-500 text-sm text-center">{idx + 1}</span>
                    <img
                      src={track.thumbnail || currentAlbum?.thumbnail || "/placeholder.svg"}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="text-white font-medium line-clamp-1">{track.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-1">{track.artist}</p>
                    </div>
                    <MoreVertical className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
              
              {albumTracks.length === 0 && !loadingAlbum && (
                <p className="text-slate-500 text-center py-8">No tracks found</p>
              )}
            </div>
          </div>
        )}
      </div>,
      document.body
    )}
    
    {/* Full Screen Player - Rendered outside main container for proper fixed positioning */}
    {showFullPlayer && currentTrack && (
      <div 
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex flex-col overscroll-none"
        style={{ 
          backgroundColor: dynamicThemeEnabled ? secondaryColor : '#000000',
          minHeight: '100vh',
          minHeight: '100dvh',
          touchAction: 'pan-x pinch-zoom',
          transform: isDragging && dragOffset > 0 
            ? `translateY(${dragOffset}px) scale(${1 - dragOffset * 0.0002})` 
            : 'translateY(0) scale(1)',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          borderRadius: isDragging && dragOffset > 0 ? `${Math.min(dragOffset * 0.1, 20)}px` : '0',
        }}
        onTouchStart={onTouchStartFull}
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
          
          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 ${isDownloaded(currentTrack.videoId) ? "text-emerald-400" : "text-white/70 hover:text-white"}`}
            onClick={() => {
              if (isDownloaded(currentTrack.videoId)) {
                deleteTrack(currentTrack.videoId)
              } else {
                downloadTrack(currentTrack)
              }
            }}
          >
            {downloadProgress.get(currentTrack.videoId)?.status === "downloading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isDownloaded(currentTrack.videoId) ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span className="text-xs">
              {downloadProgress.get(currentTrack.videoId)?.status === "downloading" 
                ? `${downloadProgress.get(currentTrack.videoId)?.progress}%`
                : isDownloaded(currentTrack.videoId) ? "Saved" : "Download"}
            </span>
          </Button>
          
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
    
    {/* Loading overlay for playlist fetch */}
    {loadingPlaylist && (
      <div className="fixed inset-0 z-[75] bg-black/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          <p className="text-white text-sm">Loading playlist...</p>
        </div>
      </div>
    )}

    {/* Expanded Shelf View (Playlist/Album Detail Page) */}
    {expandedShelf && (
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-black flex flex-col" style={{ height: '100dvh' }}>
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setExpandedShelf(null)}
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{expandedShelf.shelfTitle}</h2>
            <p className="text-sm text-slate-400">{expandedShelf.items.length} songs</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => {
              if (expandedShelf.items.length > 0) {
                playTrack(expandedShelf.items[0], expandedShelf.items)
              }
            }}
          >
            <Play className="h-5 w-5 text-white fill-white" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => {
              const shuffled = [...expandedShelf.items].sort(() => Math.random() - 0.5)
              if (shuffled.length > 0) {
                setIsShuffle(true)
                playTrack(shuffled[0], shuffled)
              }
            }}
          >
            <Shuffle className="h-5 w-5 text-white" />
          </Button>
        </div>
        
        {/* Cover Art Banner */}
        {expandedShelf.items[0]?.thumbnail && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={expandedShelf.items[0].thumbnail || "/placeholder.svg"}
              alt={expandedShelf.shelfTitle}
              className="w-full h-full object-cover blur-xl opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-end gap-4">
              <img
                src={expandedShelf.items[0].thumbnail || "/placeholder.svg"}
                alt={expandedShelf.shelfTitle}
                className="w-24 h-24 rounded-lg shadow-2xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-slate-400 text-sm">Playlist</p>
                <h3 className="text-2xl font-bold text-white">{expandedShelf.shelfTitle}</h3>
              </div>
            </div>
          </div>
        )}
        
        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {expandedShelf.items.map((track, idx) => (
              <button
                key={`expanded-${track.videoId || track.id}-${idx}`}
                onClick={() => playTrack(track, expandedShelf.items)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentTrack?.videoId === track.videoId 
                    ? "bg-white/20" 
                    : "hover:bg-white/10"
                }`}
              >
                <span className="text-slate-500 w-6 text-sm text-center">{idx + 1}</span>
                <img
                  src={track.thumbnail || "/placeholder.svg"}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-left min-w-0">
                  <h4 className={`font-medium line-clamp-1 ${
                    currentTrack?.videoId === track.videoId ? "text-red-400" : "text-white"
                  }`}>
                    {track.title}
                  </h4>
                  <p className="text-sm text-slate-400 line-clamp-1">
                    {track.artist || track.subtitle}
                  </p>
                </div>
  <span className="text-sm text-slate-500 shrink-0">{track.duration}</span>
  <Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 shrink-0"
  onClick={(e) => {
  e.stopPropagation()
  if (isDownloaded(track.videoId)) {
    deleteTrack(track.videoId)
  } else {
    downloadTrack(track)
  }
  }}
  >
  {downloadProgress.get(track.videoId)?.status === "downloading" ? (
    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
  ) : isDownloaded(track.videoId) ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  ) : (
    <Download className="h-4 w-4 text-slate-400" />
  )}
  </Button>
  <Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 shrink-0"
  onClick={(e) => {
  e.stopPropagation()
  toggleLike(track)
  }}
  >
  <Heart className={`h-4 w-4 ${isLiked(track) ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
  </Button>
  <Button
  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    addToQueue(track)
                  }}
                >
                  <Plus className="h-4 w-4 text-slate-400" />
                </Button>
              </button>
            ))}
          </div>
        </div>
        
        {/* Bottom padding for mini player */}
        {showPlayer && <div className="h-20" />}
      </div>
    )}

    {/* Create Playlist Modal */}
    {showPlaylistModal && (
      <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4">
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
