"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import React from "react"

import { Search, Play, Pause, SkipForward, SkipBack, Heart, Repeat, Home, Compass, Library, X, ChevronLeft, ChevronRight, Loader2, ListMusic, ArrowLeft, Shuffle, Clock, Share2, Volume2, Plus, Trash2, GripVertical, Music, Download, CheckCircle2, WifiOff, HardDrive, MoreVertical, Radio, Link2, User, Disc, Pencil, ListPlus, PlayCircle, Info, RefreshCw } from "lucide-react"
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

// All YouTube Music Genres
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
  const [accentColor, setAccentColor] = useState<string>("#7dd3c0") // default teal for buttons/seekbar
  const [lightColor, setLightColor] = useState<string>("#334155") // lighter theme color for backgrounds
  
  // Playback time tracking
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // New feature states
  const [showQueuePanel, setShowQueuePanel] = useState(false)
  const [playlists, setPlaylists] = useState<{id: string, name: string, tracks: Track[]}[]>([])
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false)
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false)
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null)
  const [playlistSortBy, setPlaylistSortBy] = useState<"name" | "recent">("name")
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [equalizer, setEqualizer] = useState("normal")
  const [showEqualizerMenu, setShowEqualizerMenu] = useState(false)
  const [showPlayerMenu, setShowPlayerMenu] = useState(false)
  const [playerMenuVisible, setPlayerMenuVisible] = useState(false)
  const [showTrackMenu, setShowTrackMenu] = useState(false)
  const [trackMenuVisible, setTrackMenuVisible] = useState(false)
  const [trackMenuExpanded, setTrackMenuExpanded] = useState(false)
  const [selectedTrackForMenu, setSelectedTrackForMenu] = useState<Track | null>(null)
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
      setAccentColor("#7dd3c0")
      setLightColor("#334155")
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
          
          // Create lighter/more vibrant accent color for buttons and seek bar
          const accentR = Math.min(255, Math.round(r * 1.3 + 50))
          const accentG = Math.min(255, Math.round(g * 1.3 + 50))
          const accentB = Math.min(255, Math.round(b * 1.3 + 50))
          
          // Create lighter background color for cards/surfaces
          const lightR = Math.min(255, Math.round(r * 0.6 + 40))
          const lightG = Math.min(255, Math.round(g * 0.6 + 40))
          const lightB = Math.min(255, Math.round(b * 0.6 + 40))
          
          setDominantColor(`rgb(${r}, ${g}, ${b})`)
          setSecondaryColor(`rgb(${darkerR}, ${darkerG}, ${darkerB})`)
          setAccentColor(`rgb(${accentR}, ${accentG}, ${accentB})`)
          setLightColor(`rgb(${lightR}, ${lightG}, ${lightB})`)
        }
      } catch (e) {
        // CORS error or other issue, use defaults
        setDominantColor("#1e293b")
        setSecondaryColor("#0f172a")
        setAccentColor("#7dd3c0")
        setLightColor("#334155")
      }
    }
    
    img.onerror = () => {
      setDominantColor("#1e293b")
      setSecondaryColor("#0f172a")
      setAccentColor("#7dd3c0")
      setLightColor("#334155")
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
  
  // Media Session API for Bluetooth/system media controls - handlers only
  useEffect(() => {
  if (!mounted || !currentTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  
  // Set metadata
  navigator.mediaSession.metadata = new MediaMetadata({
  title: currentTrack.title,
  artist: currentTrack.artist || currentTrack.subtitle || 'Unknown Artist',
  album: currentTrack.album || 'Unknown Album',
  artwork: currentTrack.thumbnail ? [
  { src: currentTrack.thumbnail, sizes: '320x320', type: 'image/jpeg' },
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
  
  // Seek handler - uses functional setState to get current values
  navigator.mediaSession.setActionHandler('seekto', (details) => {
  if (details.seekTime !== undefined && details.seekTime !== null) {
  const seekTime = details.seekTime
  setCurrentTime(seekTime)
  if (offlineAudioRef.current) {
  offlineAudioRef.current.currentTime = seekTime
  }
  if (playerRef.current?.contentWindow) {
  playerRef.current.contentWindow.postMessage(
  JSON.stringify({ event: 'command', func: 'seekTo', args: [seekTime, true] }),
  '*'
  )
  }
  }
  })
  
  return () => {
  // Cleanup handlers on unmount
  try {
  navigator.mediaSession.setActionHandler('play', null)
  navigator.mediaSession.setActionHandler('pause', null)
  navigator.mediaSession.setActionHandler('previoustrack', null)
  navigator.mediaSession.setActionHandler('nexttrack', null)
  navigator.mediaSession.setActionHandler('seekto', null)
  } catch (e) {
  // Some browsers may not support null handlers
  }
  }
  }, [mounted, currentTrack]) // Only re-run when track changes
  
  // Separate effect for playback state updates (runs when play/pause changes)
  useEffect(() => {
  if (!mounted || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [mounted, isPlaying])
  
  // YouTube iframe message listener for continuous playback
  useEffect(() => {
  if (!mounted) return
  
  const handleYouTubeMessage = (event: MessageEvent) => {
  // Only process YouTube messages
  if (!event.origin.includes('youtube.com')) return
  
  try {
  const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
  
  // YouTube player state: 0 = ended, 1 = playing, 2 = paused
  if (data.event === 'onStateChange') {
  if (data.info === 0) {
  // Video ended - play next track
  playNext()
  } else if (data.info === 1) {
  setIsPlaying(true)
  } else if (data.info === 2) {
  setIsPlaying(false)
  }
  }
  
  // Handle player info for time updates
  if (data.event === 'infoDelivery' && data.info) {
  if (data.info.currentTime !== undefined && !isSeeking) {
  setCurrentTime(Math.floor(data.info.currentTime))
  }
  if (data.info.duration !== undefined && data.info.duration > 0) {
  setDuration(Math.floor(data.info.duration))
  }
  }
  } catch (e) {
  // Not a JSON message, ignore
  }
  }
  
  window.addEventListener('message', handleYouTubeMessage)
  return () => window.removeEventListener('message', handleYouTubeMessage)
  }, [mounted, isSeeking])
  
  // Separate effect for position state updates (runs periodically but doesn't re-register handlers)
  useEffect(() => {
  if (!mounted || !currentTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  if (!('setPositionState' in navigator.mediaSession)) return
  
  // Only update if we have valid duration
  const trackDuration = parseDuration(currentTrack.duration)
  if (trackDuration <= 0) return
  
  try {
  navigator.mediaSession.setPositionState({
  duration: trackDuration,
  playbackRate: playbackSpeed,
  position: Math.max(0, Math.min(currentTime, trackDuration))
  })
  } catch (e) {
  // Some browsers may throw if values are invalid
  }
  }, [mounted, currentTrack, currentTime, playbackSpeed])

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

  const playNext = useCallback(() => {
  if (queue.length === 0) return
  
  let nextIndex = queueIndex + 1
  if (isShuffle) {
  // In shuffle mode, pick a random track that's not the current one
  const availableIndices = queue.map((_, i) => i).filter(i => i !== queueIndex)
  if (availableIndices.length > 0) {
  nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
  } else {
  nextIndex = 0
  }
  } else if (nextIndex >= queue.length) {
  // Reached end of queue
  if (isRepeat) {
  nextIndex = 0 // Loop back to start
  } else {
  // Stop playback at end of queue (don't stay on last track)
  setIsPlaying(false)
  return
  }
  }
  
  const nextTrack = queue[nextIndex]
  if (nextTrack) {
  // Reset time before changing track
  setCurrentTime(0)
  setDuration(0)
  setQueueIndex(nextIndex)
  setCurrentTrack(nextTrack)
  setIsPlaying(true) // Auto-play on skip
  
  // Force iframe reload by updating showPlayer
  if (!isOfflinePlayback) {
  setShowPlayer(true)
  }
  }
  }, [queue, queueIndex, isShuffle, isRepeat, isOfflinePlayback])

  const playPrev = useCallback(() => {
  if (queue.length === 0) return
  
  // If more than 3 seconds into the song, restart it instead of going to previous
  if (currentTime > 3) {
  setCurrentTime(0)
  if (offlineAudioRef.current) {
  offlineAudioRef.current.currentTime = 0
  }
  if (playerRef.current?.contentWindow) {
  playerRef.current.contentWindow.postMessage(
  JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
  '*'
  )
  }
  return
  }
  
  let prevIndex = queueIndex - 1
  if (prevIndex < 0) {
  prevIndex = isRepeat ? queue.length - 1 : 0
  }
  
  const prevTrack = queue[prevIndex]
  if (prevTrack) {
  // Reset time before changing track
  setCurrentTime(0)
  setDuration(0)
  setQueueIndex(prevIndex)
  setCurrentTrack(prevTrack)
  setIsPlaying(true) // Auto-play on skip
  }
  }, [queue, queueIndex, isRepeat, currentTime])

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
  
  // Open playlist picker for a track
  const openPlaylistPicker = (track: Track) => {
  setTrackForPlaylist(track)
  setShowPlaylistPicker(true)
  }
  
  // Close playlist picker
  const closePlaylistPicker = () => {
  setPlaylistPickerVisible(false)
  setTimeout(() => {
  setShowPlaylistPicker(false)
  setTrackForPlaylist(null)
  }, 300)
  }
  
  // Add track to playlist from picker
  const addToPlaylistFromPicker = (playlistId: string) => {
  if (trackForPlaylist) {
  addToPlaylist(playlistId, trackForPlaylist)
  closePlaylistPicker()
  }
  }
  
  // Get playlist cover art (first 4 track thumbnails in a grid)
  const getPlaylistCoverArt = (playlist: {tracks: Track[]}) => {
  return playlist.tracks.slice(0, 4).map(t => t.thumbnail)
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
    
    // Seek in offline audio
    if (isOfflinePlayback && offlineAudioRef.current) {
      offlineAudioRef.current.currentTime = newTime
    }
    
    // Seek in YouTube iframe using postMessage API
    if (!isOfflinePlayback && playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }),
        '*'
      )
    }
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
  
  // Open track context menu
  const openTrackMenu = (track: Track, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setSelectedTrackForMenu(track)
    setTrackMenuExpanded(false)
    setShowTrackMenu(true)
  }
  
  // Close track context menu
  const closeTrackMenu = () => {
    setTrackMenuVisible(false)
    setTrackMenuExpanded(false)
    setTimeout(() => {
      setShowTrackMenu(false)
      setSelectedTrackForMenu(null)
    }, 300)
  }
  
  // Share a specific track
  const shareTrack = async (track: Track) => {
    const shareUrl = `https://www.youtube.com/watch?v=${track.videoId}`
    const shareText = `${track.title} - ${track.artist || ''}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: shareText,
          url: shareUrl
        })
      } catch (e) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
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
      <div 
      className={`flex flex-col min-h-screen h-screen w-full overflow-hidden transition-colors duration-700 ${showFullPlayer ? 'invisible' : ''}`}
      style={{
      background: dynamicThemeEnabled && showPlayer && currentTrack
      ? `linear-gradient(to bottom, ${lightColor}, ${secondaryColor})`
      : 'linear-gradient(to bottom, #0f172a, #000000)'
      }}
      >
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
  {songSuggestions.map((song, index) => {
  const track: Track = {
  id: song.videoId,
  videoId: song.videoId,
  title: song.title,
  artist: song.artist,
  thumbnail: song.thumbnail,
  }
  return (
  <div
  key={`song-${index}`}
  className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => {
  setShowSuggestions(false)
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
  <button
  className="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
  onClick={(e) => {
  setShowSuggestions(false)
  openTrackMenu(track, e)
  }}
  >
  <MoreVertical className="h-5 w-5 text-slate-400" />
  </button>
  </div>
  )
  })}
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

            {/* Padding at bottom for mini player */}
            {showPlayer && <div className="h-20" />}
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
          src={`https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&widget_referrer=${typeof window !== 'undefined' ? window.location.origin : ''}&playsinline=1`}
          className="w-0 h-0 absolute"
          allow="autoplay; encrypted-media"
          style={{ height: 0, width: 0, border: 0, position: 'absolute', left: -9999 }}
          onLoad={() => {
            // Request player state updates from YouTube
            if (playerRef.current?.contentWindow) {
              playerRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'listening', id: 1 }),
                '*'
              )
            }
          }}
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
  {shelf.items?.slice(0, 5).map((item: any, idx: number) => {
  const track: Track = {
  id: item.videoId,
  videoId: item.videoId,
  title: item.title,
  artist: item.artist || currentArtist?.name,
  thumbnail: item.thumbnail,
  }
  return (
  <div
  key={`song-${idx}`}
  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
  onClick={() => {
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
  <button
  className="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors"
  onClick={(e) => openTrackMenu(track, e)}
  >
  <MoreVertical className="h-5 w-5 text-slate-400" />
  </button>
  </div>
  )
  })}
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
  
  {/* Mini Player */}
  {showPlayer && currentTrack && !showFullPlayer && (
  <div
  className="absolute bottom-14 left-0 right-0 border-t border-white/10"
  style={{
  background: dynamicThemeEnabled
  ? `linear-gradient(to right, ${secondaryColor}, ${dominantColor})`
  : 'linear-gradient(to right, #0f172a, #1e293b)',
  }}
  onClick={() => setShowFullPlayer(true)}
  >
  <div className="flex items-center gap-3 p-3">
  <img src={currentTrack.thumbnail || "/placeholder.svg"} alt={currentTrack.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
  <div className="flex-1 min-w-0">
  <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
  <p className="text-white/60 text-xs truncate">{currentTrack.artist}</p>
  </div>
  <div className="flex items-center gap-1">
  <Button variant="ghost" size="icon" className="h-10 w-10 text-white" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
  </Button>
  <Button variant="ghost" size="icon" className="h-10 w-10 text-white" onClick={(e) => { e.stopPropagation(); playNext(); }}>
  <SkipForward className="h-5 w-5" />
  </Button>
  </div>
  </div>
  </div>
  )}
  
  {/* Bottom Navigation */}
  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around p-2 bg-black/90 border-t border-white/10">
  <button onClick={() => { setShowArtistPage(false); setActiveTab("home"); }} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white">
  <Home className="h-5 w-5" />
  <span className="text-xs">Home</span>
  </button>
  <button onClick={() => { setShowArtistPage(false); setActiveTab("explore"); }} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white">
  <Compass className="h-5 w-5" />
  <span className="text-xs">Explore</span>
  </button>
  <button onClick={() => { setShowArtistPage(false); setActiveTab("library"); }} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white">
  <Library className="h-5 w-5" />
  <span className="text-xs">Library</span>
  </button>
  </div>
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
  <button
  className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors"
  onClick={(e) => openTrackMenu(track, e)}
  >
  <MoreVertical className="h-5 w-5 text-slate-400" />
  </button>
  </button>
                ))}
              </div>
              
              {albumTracks.length === 0 && !loadingAlbum && (
                <p className="text-slate-500 text-center py-8">No tracks found</p>
              )}
  </div>
  </div>
  )}
  
  {/* Mini Player */}
  {showPlayer && currentTrack && !showFullPlayer && (
  <div
  className="absolute bottom-14 left-0 right-0 border-t border-white/10"
  style={{
  background: dynamicThemeEnabled
  ? `linear-gradient(to right, ${secondaryColor}, ${dominantColor})`
  : 'linear-gradient(to right, #0f172a, #1e293b)',
  }}
  onClick={() => setShowFullPlayer(true)}
  >
  <div className="flex items-center gap-3 p-3">
  <img src={currentTrack.thumbnail || "/placeholder.svg"} alt={currentTrack.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
  <div className="flex-1 min-w-0">
  <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
  <p className="text-white/60 text-xs truncate">{currentTrack.artist}</p>
  </div>
  <div className="flex items-center gap-1">
  <Button variant="ghost" size="icon" className="h-10 w-10 text-white" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
  </Button>
  <Button variant="ghost" size="icon" className="h-10 w-10 text-white" onClick={(e) => { e.stopPropagation(); playNext(); }}>
  <SkipForward className="h-5 w-5" />
  </Button>
  </div>
  </div>
  </div>
  )}
  
  {/* Bottom Navigation */}
  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around p-2 bg-black/90 border-t border-white/10">
  <button onClick={() => { setShowAlbumPage(false); setActiveTab("home"); }} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white">
  <Home className="h-5 w-5" />
  <span className="text-xs">Home</span>
  </button>
  <button onClick={() => { setShowAlbumPage(false); setActiveTab("explore"); }} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white">
  <Compass className="h-5 w-5" />
  <span className="text-xs">Explore</span>
  </button>
  <button onClick={() => { setShowAlbumPage(false); setActiveTab("library"); }} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white">
  <Library className="h-5 w-5" />
  <span className="text-xs">Library</span>
  </button>
  </div>
  </div>,
  document.body
  )}
  
  {/* Full Screen Player - Metrolist Style with Dynamic Theme */}
    {showFullPlayer && currentTrack && (
    <div
    className="fixed inset-0 z-[9999] flex flex-col overscroll-none transition-colors duration-700"
    style={{
    backgroundColor: dynamicThemeEnabled ? secondaryColor : '#1e2738',
    minHeight: '100dvh',
    touchAction: 'pan-x pinch-zoom',
    transform: isDragging && dragOffset > 0
    ? `translateY(${dragOffset}px) scale(${1 - dragOffset * 0.0002})`
    : 'translateY(0) scale(1)',
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.7s ease-out',
    borderRadius: isDragging && dragOffset > 0 ? `${Math.min(dragOffset * 0.1, 20)}px` : '0',
    }}
    onTouchStart={onTouchStartFull}
    onTouchMove={onTouchMoveFull}
    onTouchEnd={onTouchEndFull}
    >
    {/* Gradient overlay for dynamic theme */}
    <div 
    className="absolute inset-0 transition-all duration-700 pointer-events-none"
    style={{
    background: dynamicThemeEnabled 
    ? `linear-gradient(180deg, ${dominantColor}40 0%, ${secondaryColor} 40%, ${secondaryColor} 100%)`
    : 'transparent'
    }}
    />
    
    {/* Header - Now Playing */}
    <div className="relative z-10 flex flex-col items-center pt-6 pb-4 shrink-0">
    <p className="text-white/60 text-sm font-medium">Now Playing</p>
    </div>

    {/* Album Art - Large with rounded corners */}
    <div className="relative z-10 flex-1 flex items-center justify-center px-8 min-h-0">
          <img
            src={currentTrack.thumbnail?.replace('mqdefault', 'maxresdefault') || currentTrack.thumbnail || "/placeholder.svg"}
            alt={currentTrack.title}
            className="w-full max-w-[340px] aspect-square rounded-2xl shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

    {/* Track Info with Share & Like buttons */}
    <div className="relative z-10 px-8 py-4 shrink-0">
    <div className="flex items-center justify-between">
    <div className="flex-1 min-w-0 pr-4 overflow-hidden">
    <div className="overflow-hidden">
    <h2 
    className={`text-xl font-semibold text-white whitespace-nowrap ${currentTrack.title.length > 25 ? 'animate-marquee' : ''}`}
    style={{
    animation: currentTrack.title.length > 25 ? 'marquee 10s linear infinite' : 'none',
    }}
    >
    {currentTrack.title}
    {currentTrack.title.length > 25 && <span className="px-12">{currentTrack.title}</span>}
    </h2>
    </div>
    <p className="text-white/60 truncate">{currentTrack.artist || currentTrack.subtitle}</p>
    </div>
    <div className="flex items-center gap-2">
    <Button
    variant="ghost"
    size="icon"
    className="h-11 w-11 rounded-lg transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? `${accentColor}30` : 'rgba(168, 213, 216, 0.2)',
    color: dynamicThemeEnabled ? accentColor : '#a8d5d8'
    }}
    onClick={shareSong}
    >
    <Share2 className="h-5 w-5" />
    </Button>
    <Button
    variant="ghost"
    size="icon"
    className="h-11 w-11 rounded-lg transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? `${accentColor}30` : 'rgba(168, 213, 216, 0.2)',
    color: dynamicThemeEnabled ? accentColor : '#a8d5d8'
    }}
    onClick={() => toggleLike(currentTrack)}
    >
    <Heart className={`h-5 w-5 ${isLiked(currentTrack) ? "fill-current" : ""}`} style={{ color: dynamicThemeEnabled ? accentColor : '#a8d5d8' }} />
    </Button>
    </div>
          </div>
        </div>

    {/* Progress Bar */}
    <div className="relative z-10 px-8 py-2 shrink-0">
    <div
    ref={progressBarRef}
    className="w-full h-1 rounded-full overflow-hidden cursor-pointer touch-none transition-colors duration-500"
    style={{ backgroundColor: dynamicThemeEnabled ? `${dominantColor}40` : '#3a4556' }}
    onClick={handleSeek}
    onTouchStart={handleSeek}
    onTouchMove={handleSeek}
    onTouchEnd={handleSeekEnd}
    >
    <div
    className="h-full rounded-full transition-colors duration-500"
    style={{
    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
    transition: isSeeking ? 'background-color 0.5s' : 'width 0.3s, background-color 0.5s',
    backgroundColor: dynamicThemeEnabled ? accentColor : '#7dd3c0'
    }}
    />
    </div>
    <div className="flex justify-between mt-2 text-xs text-white/50">
    <span>{formatTime(currentTime)}</span>
    <span>{formatTime(duration)}</span>
    </div>
    </div>

    {/* Main Controls - Large rounded buttons */}
    <div className="relative z-10 flex items-center justify-center gap-4 py-4 px-8 shrink-0">
    <Button
    variant="ghost"
    size="icon"
    className="h-16 w-16 rounded-2xl text-white transition-colors duration-500"
    style={{ backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545' }}
    onClick={playPrev}
    >
    <SkipBack className="h-6 w-6" />
    </Button>
    <Button
    variant="ghost"
    className="h-16 flex-1 max-w-[200px] rounded-2xl font-medium flex items-center justify-center gap-2 transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? accentColor : '#a8d5d8',
    color: dynamicThemeEnabled ? secondaryColor : '#1e2738'
    }}
    onClick={togglePlay}
    >
    {isPlaying ? (
    <>
    <Pause className="h-6 w-6" />
    <span>Pause</span>
    </>
    ) : (
    <>
    <Play className="h-6 w-6 ml-1" />
    <span>Play</span>
    </>
    )}
    </Button>
    <Button
    variant="ghost"
    size="icon"
    className="h-16 w-16 rounded-2xl text-white transition-colors duration-500"
    style={{ backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545' }}
    onClick={playNext}
    >
    <SkipForward className="h-6 w-6" />
    </Button>
    </div>
        
    {/* Bottom Controls Row */}
    <div className="relative z-10 flex items-center justify-between px-6 py-4 shrink-0">
    <div className="flex items-center gap-2">
    {/* Queue */}
    <Button
    variant="ghost"
    size="icon"
    className="h-12 w-12 rounded-xl text-[#7a8599] hover:text-white transition-colors duration-500"
    style={{ backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545' }}
    onClick={() => setShowQueuePanel(true)}
    >
    <ListMusic className="h-5 w-5" />
    </Button>
    
    {/* Sleep Timer */}
    <Button
    variant="ghost"
    size="icon"
    className="h-12 w-12 rounded-xl transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545',
    color: sleepTimer ? (dynamicThemeEnabled ? accentColor : '#7dd3c0') : '#7a8599'
    }}
    onClick={() => {
    const nextIndex = SLEEP_TIMER_OPTIONS.findIndex(o => o.value === sleepTimer) + 1
    const nextOption = SLEEP_TIMER_OPTIONS[nextIndex % SLEEP_TIMER_OPTIONS.length]
    setSleepTimerMinutes(nextOption.value)
    }}
    >
    <Clock className="h-5 w-5" />
    </Button>
    
    {/* Shuffle */}
    <Button
    variant="ghost"
    size="icon"
    className="h-12 w-12 rounded-xl transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545',
    color: isShuffle ? (dynamicThemeEnabled ? accentColor : '#7dd3c0') : '#7a8599'
    }}
    onClick={() => setIsShuffle(!isShuffle)}
    >
    <Shuffle className="h-5 w-5" />
    </Button>
    
    {/* Equalizer / Sort */}
    <Button
    variant="ghost"
    size="icon"
    className="h-12 w-12 rounded-xl transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545',
    color: equalizer !== "normal" ? (dynamicThemeEnabled ? accentColor : '#7dd3c0') : '#7a8599'
    }}
    onClick={() => setShowEqualizerMenu(!showEqualizerMenu)}
    >
    <Volume2 className="h-5 w-5" />
    </Button>
    
    {/* Repeat */}
    <Button
    variant="ghost"
    size="icon"
    className="h-12 w-12 rounded-xl transition-colors duration-500"
    style={{ 
    backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545',
    color: isRepeat ? (dynamicThemeEnabled ? accentColor : '#7dd3c0') : '#7a8599'
    }}
    onClick={() => setIsRepeat(!isRepeat)}
    >
    <Repeat className="h-5 w-5" />
    </Button>
    </div>
    
    {/* 3-dot Menu */}
    <Button
    variant="ghost"
    size="icon"
    className="h-12 w-12 rounded-xl text-[#7a8599] hover:text-white transition-colors duration-500"
    style={{ backgroundColor: dynamicThemeEnabled ? `${dominantColor}60` : '#2a3545' }}
    onClick={() => setShowPlayerMenu(true)}
    >
    <MoreVertical className="h-5 w-5" />
    </Button>
    </div>
        
        {/* Equalizer Menu Popup */}
        {showEqualizerMenu && (
          <div className="absolute bottom-24 left-6 bg-[#2a3545] rounded-xl shadow-xl border border-white/10 overflow-hidden min-w-[140px] z-50">
            {EQUALIZER_PRESETS.map(preset => (
              <button
                key={preset.id}
                className={`block w-full px-4 py-3 text-sm text-left hover:bg-[#3a4556] ${equalizer === preset.id ? "text-[#7dd3c0]" : "text-white"}`}
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
        
        {/* Bottom Sheet Player Menu - Metrolist Style */}
        {showPlayerMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 z-50"
              onClick={() => {
                setPlayerMenuVisible(false)
                setTimeout(() => setShowPlayerMenu(false), 300)
              }}
            />
            
            {/* Bottom Sheet */}
            <div 
              className={`absolute bottom-0 left-0 right-0 z-50 bg-[#1e2738] rounded-t-3xl transition-transform duration-300 ease-out ${playerMenuVisible ? 'translate-y-0' : 'translate-y-full'}`}
              style={{ maxHeight: '80vh' }}
              ref={(el) => {
                if (el && showPlayerMenu && !playerMenuVisible) {
                  setTimeout(() => setPlayerMenuVisible(true), 10)
                }
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-[#3a4556] rounded-full" />
              </div>
              
              {/* Album Art (smaller) */}
              <div className="flex justify-center pb-4">
                <img
                  src={currentTrack.thumbnail || "/placeholder.svg"}
                  alt={currentTrack.title}
                  className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Volume Slider */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 bg-[#2a3545] rounded-xl p-3">
                  <Volume2 className="h-5 w-5 text-[#7dd3c0]" />
                  <div className="flex-1 h-2 bg-[#3a4556] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7dd3c0] rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="mx-6 border-t border-[#3a4556]" />
              
              {/* Action Buttons Row */}
              <div className="flex items-center justify-center gap-3 px-6 py-4">
                <Button
                  variant="ghost"
                  className="flex-1 h-16 rounded-xl bg-[#2a3545] text-[#7a8599] hover:bg-[#3a4556] hover:text-white flex flex-col items-center justify-center gap-1"
                >
                  <Radio className="h-5 w-5" />
                  <span className="text-xs">Start radio</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 h-16 rounded-xl bg-[#2a3545] text-[#7a8599] hover:bg-[#3a4556] hover:text-white flex flex-col items-center justify-center gap-1"
                  onClick={() => {
                    setPlayerMenuVisible(false)
                    setTimeout(() => {
                      setShowPlayerMenu(false)
                      openPlaylistPicker(currentTrack)
                    }, 300)
                  }}
                >
                  <ListPlus className="h-5 w-5" />
                  <span className="text-xs">Add to playlist</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 h-16 rounded-xl bg-[#2a3545] text-[#7a8599] hover:bg-[#3a4556] hover:text-white flex flex-col items-center justify-center gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://music.youtube.com/watch?v=${currentTrack.videoId}`)
                    setPlayerMenuVisible(false)
                    setTimeout(() => setShowPlayerMenu(false), 300)
                  }}
                >
                  <Link2 className="h-5 w-5" />
                  <span className="text-xs">Copy link</span>
                </Button>
              </div>
              
              {/* View Artist */}
              <button
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#2a3545] transition-colors"
                onClick={() => {
                  setPlayerMenuVisible(false)
                  setTimeout(() => {
                    setShowPlayerMenu(false)
                    // Would navigate to artist page here
                  }, 300)
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#2a3545] flex items-center justify-center">
                  <User className="h-5 w-5 text-[#7a8599]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">View artist</p>
                  <p className="text-[#7a8599] text-sm">{currentTrack.artist || "Unknown Artist"}</p>
                </div>
              </button>
              
              {/* View Album */}
              <button
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#2a3545] transition-colors pb-8"
                onClick={() => {
                  setPlayerMenuVisible(false)
                  setTimeout(() => {
                    setShowPlayerMenu(false)
                    // Would navigate to album page here
                  }, 300)
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#2a3545] flex items-center justify-center">
                  <Disc className="h-5 w-5 text-[#7a8599]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">View album</p>
                  <p className="text-[#7a8599] text-sm">{currentTrack.album || currentTrack.title}</p>
                </div>
              </button>
            </div>
          </>
        )}
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
  
  {/* Track Context Menu - Bottom Sheet */}
  {showTrackMenu && selectedTrackForMenu && isMounted && createPortal(
    <div className="fixed inset-0 z-[99999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: trackMenuVisible ? 1 : 0 }}
        onClick={closeTrackMenu}
      />
      
      {/* Bottom Sheet */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-[#1a2332] rounded-t-3xl transition-all duration-300 ease-out overflow-hidden`}
        style={{ 
          transform: trackMenuVisible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: trackMenuExpanded ? '85vh' : '50vh',
        }}
        ref={(el) => {
          if (el && showTrackMenu && !trackMenuVisible) {
            setTimeout(() => setTrackMenuVisible(true), 10)
          }
        }}
      >
        {/* Drag Handle */}
        <div 
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={(e) => {
            const startY = e.touches[0].clientY
            const handleMove = (moveE: TouchEvent) => {
              const deltaY = startY - moveE.touches[0].clientY
              if (deltaY > 50) {
                setTrackMenuExpanded(true)
              } else if (deltaY < -50) {
                if (trackMenuExpanded) {
                  setTrackMenuExpanded(false)
                } else {
                  closeTrackMenu()
                }
              }
            }
            const handleEnd = () => {
              document.removeEventListener('touchmove', handleMove)
              document.removeEventListener('touchend', handleEnd)
            }
            document.addEventListener('touchmove', handleMove)
            document.addEventListener('touchend', handleEnd)
          }}
        >
          <div className="w-10 h-1 bg-[#3a4556] rounded-full" />
        </div>
        
        {/* Track Header */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <img
            src={selectedTrackForMenu.thumbnail || "/placeholder.svg"}
            alt={selectedTrackForMenu.title}
            className="w-14 h-14 rounded-lg object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{selectedTrackForMenu.title}</h3>
            <p className="text-[#7a8599] text-sm truncate">{selectedTrackForMenu.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-[#7a8599] hover:text-white"
            onClick={() => {
              toggleLike(selectedTrackForMenu)
            }}
          >
            <Heart className={`h-5 w-5 ${isLiked(selectedTrackForMenu) ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
        
        {/* Divider */}
        <div className="mx-4 border-t border-[#3a4556]" />
        
        {/* Action Buttons Row */}
        <div className="flex items-center justify-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            className="flex-1 h-16 rounded-xl bg-[#2a3545] text-[#7a8599] hover:bg-[#3a4556] hover:text-white flex flex-col items-center justify-center gap-1"
          >
            <Pencil className="h-5 w-5" />
            <span className="text-xs">Edit</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-16 rounded-xl bg-[#2a3545] text-[#7a8599] hover:bg-[#3a4556] hover:text-white flex flex-col items-center justify-center gap-1"
            onClick={() => {
              openPlaylistPicker(selectedTrackForMenu)
              closeTrackMenu()
            }}
          >
            <ListPlus className="h-5 w-5" />
            <span className="text-xs">Add to playlist</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-16 rounded-xl bg-[#2a3545] text-[#7a8599] hover:bg-[#3a4556] hover:text-white flex flex-col items-center justify-center gap-1"
            onClick={() => {
              shareTrack(selectedTrackForMenu)
              closeTrackMenu()
            }}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
        
        {/* Scrollable Menu Options */}
        <div className="overflow-y-auto" style={{ maxHeight: trackMenuExpanded ? 'calc(85vh - 200px)' : 'calc(50vh - 200px)' }}>
          {/* Start Radio */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              // Start radio based on track
              closeTrackMenu()
            }}
          >
            <Radio className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">Start radio</p>
              <p className="text-[#7a8599] text-sm">Create a station based on this item</p>
            </div>
          </button>
          
          {/* Play Next */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              // Add to front of queue
              if (selectedTrackForMenu) {
                const newQueue = [selectedTrackForMenu, ...queue.filter(t => t.videoId !== selectedTrackForMenu.videoId)]
                // This would need a setQueue function
              }
              closeTrackMenu()
            }}
          >
            <PlayCircle className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">Play next</p>
              <p className="text-[#7a8599] text-sm">Add to the top of your queue</p>
            </div>
          </button>
          
          {/* Add to Queue */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              addToQueue(selectedTrackForMenu)
              closeTrackMenu()
            }}
          >
            <ListMusic className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">Add to queue</p>
              <p className="text-[#7a8599] text-sm">Add to the bottom of your queue</p>
            </div>
          </button>
          
          {/* Add to Library */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              toggleLike(selectedTrackForMenu)
              closeTrackMenu()
            }}
          >
            <Plus className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">Add to library</p>
              <p className="text-[#7a8599] text-sm">Save to your library</p>
            </div>
          </button>
          
          {/* Download */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              if (isDownloaded(selectedTrackForMenu.videoId)) {
                deleteTrack(selectedTrackForMenu.videoId)
              } else {
                downloadTrack(selectedTrackForMenu)
              }
              closeTrackMenu()
            }}
          >
            {isDownloaded(selectedTrackForMenu.videoId) ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Download className="h-5 w-5 text-[#7a8599]" />
            )}
            <div className="text-left">
              <p className="text-white font-medium">
                {isDownloaded(selectedTrackForMenu.videoId) ? "Downloaded" : "Download"}
              </p>
              <p className="text-[#7a8599] text-sm">Make available for offline playback</p>
            </div>
          </button>
          
          {/* View Artist */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              // Navigate to artist
              closeTrackMenu()
            }}
          >
            <User className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">View artist</p>
              <p className="text-[#7a8599] text-sm">{selectedTrackForMenu.artist || "Unknown Artist"}</p>
            </div>
          </button>
          
          {/* View Album */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              // Navigate to album
              closeTrackMenu()
            }}
          >
            <Disc className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">View album</p>
              <p className="text-[#7a8599] text-sm">{selectedTrackForMenu.album || selectedTrackForMenu.title}</p>
            </div>
          </button>
          
          {/* Refetch */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors"
            onClick={() => {
              closeTrackMenu()
            }}
          >
            <RefreshCw className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">Refetch</p>
              <p className="text-[#7a8599] text-sm">Fetch the latest metadata from YouTube Music</p>
            </div>
          </button>
          
          {/* Details */}
          <button
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#2a3545] transition-colors pb-8"
            onClick={() => {
              closeTrackMenu()
            }}
          >
            <Info className="h-5 w-5 text-[#7a8599]" />
            <div className="text-left">
              <p className="text-white font-medium">Details</p>
              <p className="text-[#7a8599] text-sm">View the song's information</p>
            </div>
          </button>
  </div>
  </div>
  </div>,
  document.body
  )}
  
  {/* Playlist Picker Modal */}
  {showPlaylistPicker && trackForPlaylist && isMounted && createPortal(
    <div className="fixed inset-0 z-[999999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-300"
        style={{ opacity: playlistPickerVisible ? 1 : 0 }}
        onClick={closePlaylistPicker}
      />
      
      {/* Modal */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-[#1a2332] rounded-t-3xl transition-transform duration-300 ease-out max-h-[70vh] flex flex-col"
        style={{ 
          transform: playlistPickerVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
        ref={(el) => {
          if (el && showPlaylistPicker && !playlistPickerVisible) {
            setTimeout(() => setPlaylistPickerVisible(true), 10)
          }
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 shrink-0">
          <div className="w-10 h-1 bg-[#3a4556] rounded-full" />
        </div>
        
        {/* Create Playlist Button */}
        <button
          className="flex items-center gap-4 px-6 py-4 hover:bg-[#2a3545] transition-colors shrink-0"
          onClick={() => {
            setShowPlaylistModal(true)
          }}
        >
          <div className="w-12 h-12 rounded-lg bg-[#2a3545] flex items-center justify-center">
            <Plus className="h-6 w-6 text-[#7dd3c0]" />
          </div>
          <span className="text-[#7dd3c0] font-medium text-lg">Create playlist</span>
        </button>
        
        {/* Sort Header */}
        <div className="px-6 py-2 shrink-0">
          <button 
            className="flex items-center gap-2 text-[#7dd3c0] text-sm font-medium"
            onClick={() => setPlaylistSortBy(playlistSortBy === "name" ? "recent" : "name")}
          >
            <span>Name</span>
            <ChevronRight className={`h-4 w-4 transition-transform ${playlistSortBy === "name" ? "rotate-90" : "-rotate-90"}`} />
          </button>
        </div>
        
        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto pb-8">
          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <ListMusic className="h-16 w-16 text-[#3a4556] mb-4" />
              <p className="text-[#7a8599] text-center">No playlists yet</p>
              <p className="text-[#5a6579] text-sm text-center mt-1">Create a playlist to add songs</p>
            </div>
          ) : (
            [...playlists]
              .sort((a, b) => playlistSortBy === "name" ? a.name.localeCompare(b.name) : 0)
              .map((playlist) => {
                const coverArts = getPlaylistCoverArt(playlist)
                return (
                  <button
                    key={playlist.id}
                    className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#2a3545] transition-colors"
                    onClick={() => addToPlaylistFromPicker(playlist.id)}
                  >
                    {/* Playlist Cover Art Grid */}
                    <div className="w-12 h-12 rounded-lg bg-[#2a3545] overflow-hidden flex-shrink-0 grid grid-cols-2 grid-rows-2">
                      {coverArts.length > 0 ? (
                        coverArts.map((art, idx) => (
                          <img
                            key={idx}
                            src={art || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ))
                      ) : (
                        <div className="col-span-2 row-span-2 flex items-center justify-center">
                          <Music className="h-6 w-6 text-[#5a6579]" />
                        </div>
                      )}
                      {coverArts.length > 0 && coverArts.length < 4 && (
                        Array(4 - coverArts.length).fill(0).map((_, idx) => (
                          <div key={`empty-${idx}`} className="bg-[#3a4556]" />
                        ))
                      )}
                    </div>
                    
                    {/* Playlist Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white font-medium truncate">{playlist.name}</p>
                      <p className="text-[#7a8599] text-sm">{playlist.tracks.length} songs</p>
                    </div>
                  </button>
                )
              })
          )}
        </div>
      </div>
      
      {/* Create Playlist Sub-Modal */}
      {showPlaylistModal && (
        <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPlaylistModal(false)}
          />
          <div className="relative bg-[#1a2332] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-semibold mb-4">Create Playlist</h3>
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="bg-[#2a3545] border-[#3a4556] text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#3a4556] text-[#7a8599] hover:bg-[#2a3545] bg-transparent"
                onClick={() => setShowPlaylistModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#7dd3c0] text-[#1a2332] hover:bg-[#6bc3b0]"
                onClick={() => {
                  createPlaylist(newPlaylistName)
                  setShowPlaylistModal(false)
                }}
                disabled={!newPlaylistName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )}
  </>
  )
}
