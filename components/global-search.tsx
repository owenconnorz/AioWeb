"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, Film, Music, Wand2, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { getHistory } from "@/lib/history-service"

interface SearchResult {
  type: string
  title: string
  description?: string
  action: () => void
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tab: string, subTab?: string) => void
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentHistory, setRecentHistory] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      loadRecentHistory()
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  const loadRecentHistory = async () => {
    const history = await getHistory(undefined, 5)
    setRecentHistory(history)
  }

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const lowerQuery = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    if ("porn".includes(lowerQuery) || "videos".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "Porn Videos",
        description: "Browse adult video content",
        action: () => {
          onNavigate("porn")
          onClose()
        }
      })
    }

    if ("library".includes(lowerQuery) || "saved".includes(lowerQuery) || "favorites".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "Library",
        description: "View your saved content",
        action: () => {
          onNavigate("library")
          onClose()
        }
      })
    }

    if ("music".includes(lowerQuery) || "songs".includes(lowerQuery) || "audio".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "Music Browser",
        description: "Explore and play music",
        action: () => {
          onNavigate("music")
          onClose()
        }
      })
    }

    if ("ai".includes(lowerQuery) || "generate".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "AI Tools",
        description: "Image, video, and face generation",
        action: () => {
          onNavigate("ai")
          onClose()
        }
      })
    }

    if ("image".includes(lowerQuery) || "picture".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "AI Image Generator",
        description: "Create images with AI",
        action: () => {
          onNavigate("ai", "image")
          onClose()
        }
      })
    }

    if ("video".includes(lowerQuery) && "ai".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "AI Video Generator",
        description: "Create videos with AI",
        action: () => {
          onNavigate("ai", "video")
          onClose()
        }
      })
    }

    if ("face".includes(lowerQuery) || "swap".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "Face Swap",
        description: "Swap faces in images",
        action: () => {
          onNavigate("ai", "faceswap")
          onClose()
        }
      })
    }

    if ("settings".includes(lowerQuery) || "preferences".includes(lowerQuery)) {
      searchResults.push({
        type: "navigation",
        title: "Settings",
        description: "Customize your experience",
        action: () => {
          onNavigate("settings")
          onClose()
        }
      })
    }

    setResults(searchResults)
    setSelectedIndex(0)
  }, [onNavigate, onClose])

  useEffect(() => {
    search(query)
  }, [query, search])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1))
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault()
        results[selectedIndex].action()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  if (!isOpen) return null

  const getIcon = (type: string) => {
    if (type.includes("porn") || type.includes("video")) return <Film className="h-4 w-4" />
    if (type.includes("music")) return <Music className="h-4 w-4" />
    if (type.includes("ai") || type.includes("image") || type.includes("face")) return <Wand2 className="h-4 w-4" />
    return <Search className="h-4 w-4" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden border-0 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search features, content, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            autoFocus
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto bg-white dark:bg-slate-800">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={result.action}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-50 dark:bg-slate-700"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {getIcon(result.title.toLowerCase())}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{result.title}</div>
                    {result.description && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">{result.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No results found for "{query}"
            </div>
          ) : recentHistory.length > 0 ? (
            <div className="p-2">
              <div className="mb-2 px-3 pt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Recent Activity
              </div>
              {recentHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.content_data?.title || item.content_id}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.content_type} • {new Date(item.viewed_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Start typing to search...
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex gap-4">
            <span><kbd className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-800">↑↓</kbd> Navigate</span>
            <span><kbd className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-800">Enter</kbd> Select</span>
          </div>
          <span><kbd className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-800">Esc</kbd> Close</span>
        </div>
      </Card>
    </div>
  )
}
