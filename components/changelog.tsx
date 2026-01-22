"use client"
import { useState, useEffect } from "react"
import { X, Sparkles, ChevronDown, ChevronUp } from "lucide-react"

// Changelog data - Update this when you publish new versions
export const CHANGELOG = [
  {
    version: "1.2.0",
    date: "2026-01-22",
    title: "Ad Blocker & UI Improvements",
    changes: [
      "Added built-in ad blocker for video playback",
      "Fixed video modal to display fullscreen properly",
      "Removed deprecated Rule34 and JSONPorn APIs",
      "Improved video loading experience",
      "Added changelog system",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-01-21",
    title: "New Sources & Features",
    changes: [
      "Added Anime/Waifu image source",
      "Added RedTube video source",
      "Added Chaturbate live cams",
      "Improved API source reordering in Settings",
      "Added video sharing functionality",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-20",
    title: "Initial Release",
    changes: [
      "AI Image Generator with multiple models",
      "AI Video Generator",
      "Face Swap feature",
      "Porn video browser with multiple sources",
      "Video library with playlists",
      "Dark/Light mode support",
    ],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version

interface ChangelogModalProps {
  isOpen: boolean
  onClose: () => void
  showAllVersions?: boolean
}

export function ChangelogModal({ isOpen, onClose, showAllVersions = false }: ChangelogModalProps) {
  const [expandedVersions, setExpandedVersions] = useState<string[]>([CURRENT_VERSION])

  if (!isOpen) return null

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => 
      prev.includes(version) 
        ? prev.filter(v => v !== version)
        : [...prev, version]
    )
  }

  const versionsToShow = showAllVersions ? CHANGELOG : [CHANGELOG[0]]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {showAllVersions ? "Changelog" : "What's New"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Version {CURRENT_VERSION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 max-h-[60vh]">
          {versionsToShow.map((release, index) => (
            <div key={release.version} className="mb-4 last:mb-0">
              <button
                onClick={() => toggleVersion(release.version)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                    v{release.version}
                  </span>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">{release.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{release.date}</p>
                  </div>
                </div>
                {expandedVersions.includes(release.version) ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              
              {expandedVersions.includes(release.version) && (
                <ul className="mt-2 ml-4 space-y-2">
                  {release.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{change}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            {showAllVersions ? "Close" : "Got it!"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to manage changelog popup display
export function useChangelog() {
  const [showChangelog, setShowChangelog] = useState(false)
  const [hasNewUpdate, setHasNewUpdate] = useState(false)

  useEffect(() => {
    try {
      const lastSeenVersion = localStorage.getItem("lastSeenVersion")
      if (lastSeenVersion !== CURRENT_VERSION) {
        // New version available, show popup
        setShowChangelog(true)
        setHasNewUpdate(true)
      }
    } catch (e) {
      // localStorage not available
    }
  }, [])

  const dismissChangelog = () => {
    setShowChangelog(false)
    setHasNewUpdate(false)
    try {
      localStorage.setItem("lastSeenVersion", CURRENT_VERSION)
    } catch (e) {
      // localStorage not available
    }
  }

  const openChangelog = () => {
    setShowChangelog(true)
  }

  return {
    showChangelog,
    hasNewUpdate,
    dismissChangelog,
    openChangelog,
  }
}
