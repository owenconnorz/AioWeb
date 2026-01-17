"use client"
import { useState, useEffect } from "react"
import type React from "react"
import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import { ImageGenerator } from "@/components/image-generator"
import { FaceSwap } from "@/components/face-swap"
import { VideoGenerator } from "@/components/video-generator"
import { PornVideos, PornLibrary } from "@/components/porn-videos"
import { Sparkles, ImageIcon, Users, Settings, Video, Film, Download, GripVertical, BookmarkIcon } from "lucide-react"

export default function Home() {
  const [activeTab, setActiveTab] = useState("porn")
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setIsDarkMode(settings.darkMode ?? true)
      }
    } catch (error) {
      console.error("Error loading dark mode setting:", error)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode, mounted])

  if (!mounted) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-28 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-12">
        {activeTab !== "porn" && activeTab !== "library" && (
          <div className="mb-8 text-center sm:mb-12">
            <div className="mb-4 flex flex-col items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 sm:px-4 sm:py-2 sm:text-sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                Powered by AI
              </div>
            </div>
            <div className="mb-4 flex items-center justify-center gap-3">
              <Image src="/logo.png" alt="AioWeb Logo" width={60} height={60} className="h-12 w-12 sm:h-16 sm:w-16" />
              <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                AioWeb
              </h1>
            </div>
            <p className="text-pretty text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              Generate stunning images, craft compelling text, create videos, and transform faces with cutting-edge AI
            </p>
          </div>
        )}

        <div className="w-full">
          {activeTab === "porn" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <PornVideos />
              </CardContent>
            </Card>
          )}

          {activeTab === "library" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <PornLibrary />
              </CardContent>
            </Card>
          )}

          {activeTab === "image" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <ImageGenerator />
              </CardContent>
            </Card>
          )}

          {activeTab === "video" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <VideoGenerator />
              </CardContent>
            </Card>
          )}

          {activeTab === "faceswap" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <FaceSwap />
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <SettingsContent onDarkModeChange={setIsDarkMode} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="glass-nav-pill flex items-center gap-1 rounded-full border border-white/20 bg-white/80 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/80 sm:gap-2 sm:p-2.5">
          <button
            onClick={() => setActiveTab("porn")}
            className={`nav-item ${activeTab === "porn" ? "active" : ""}`}
            aria-label="Porn Videos"
          >
            <Film className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Porn</span>
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`nav-item ${activeTab === "library" ? "active" : ""}`}
            aria-label="Library"
          >
            <BookmarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Library</span>
          </button>

          <button
            onClick={() => setActiveTab("image")}
            className={`nav-item ${activeTab === "image" ? "active" : ""}`}
            aria-label="Image Generator"
          >
            <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Image</span>
          </button>

          <button
            onClick={() => setActiveTab("video")}
            className={`nav-item ${activeTab === "video" ? "active" : ""}`}
            aria-label="Video Generator"
          >
            <Video className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Video</span>
          </button>

          <button
            onClick={() => setActiveTab("faceswap")}
            className={`nav-item ${activeTab === "faceswap" ? "active" : ""}`}
            aria-label="Face Swap"
          >
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Face</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Settings</span>
          </button>
        </div>
      </nav>
    </main>
  )
}

function SettingsContent({ onDarkModeChange }: { onDarkModeChange: (value: boolean) => void }) {
  const [nsfwFilter, setNsfwFilter] = useState(true)
  const [autoSave, setAutoSave] = useState(false)
  const [highQuality, setHighQuality] = useState(true)
  const [showWatermark, setShowWatermark] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [apiOrder, setApiOrder] = useState<string[]>([
    "xvidapi",
    "eporner",
    "redgifs",
    "cam4",
    "chaturbate",
    "pornpics",
  ])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setNsfwFilter(settings.nsfwFilter ?? true)
        setAutoSave(settings.autoSave ?? false)
        setHighQuality(settings.highQuality ?? true)
        setShowWatermark(settings.showWatermark ?? false)
        setDarkMode(settings.darkMode ?? true)
      } else {
        const defaultSettings = {
          nsfwFilter: true,
          autoSave: false,
          highQuality: true,
          showWatermark: false,
          darkMode: true,
        }
        localStorage.setItem("aiCreativeSuiteSettings", JSON.stringify(defaultSettings))
      }

      const savedApiOrder = localStorage.getItem("porn_api_order")
      if (savedApiOrder) {
        const parsed = JSON.parse(savedApiOrder)
        if (!parsed.includes("chaturbate")) {
          parsed.push("chaturbate")
        }
        setApiOrder(parsed)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked)
    onDarkModeChange(checked)
    handleSaveSettings({ darkMode: checked })
  }

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("App is already installed or installation is not available")
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("User accepted the install prompt")
    } else {
      console.log("User dismissed the install prompt")
    }

    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  const handleSaveSettings = (overrides = {}) => {
    if (!mounted) return

    try {
      const settings = {
        nsfwFilter,
        autoSave,
        highQuality,
        showWatermark,
        darkMode,
        ...overrides,
      }
      localStorage.setItem("aiCreativeSuiteSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  const handleDragStart = (api: string) => {
    setDraggedItem(api)
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent, api: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === api) return

    const newOrder = [...apiOrder]
    const draggedIndex = newOrder.indexOf(draggedItem)
    const targetIndex = newOrder.indexOf(api)

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)

    setApiOrder(newOrder)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setIsDragging(false)
    saveApiOrder()
  }

  const handleTouchStart = (e: React.TouchEvent, api: string) => {
    const touch = e.touches[0]
    setTouchStartY(touch.clientY)

    const timer = setTimeout(() => {
      setDraggedItem(api)
      setIsDragging(true)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)

    setLongPressTimer(timer)
  }

  const handleTouchMove = (e: React.TouchEvent, api: string) => {
    if (!isDragging || !draggedItem) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      return
    }

    e.preventDefault()
    const touch = e.touches[0]
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)

    for (const el of elements) {
      const targetApi = el.getAttribute("data-api")
      if (targetApi && targetApi !== draggedItem) {
        const newOrder = [...apiOrder]
        const draggedIndex = newOrder.indexOf(draggedItem)
        const targetIndex = newOrder.indexOf(targetApi)

        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedItem)

        setApiOrder(newOrder)
        break
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    if (isDragging) {
      saveApiOrder()
    }

    setDraggedItem(null)
    setIsDragging(false)
    setTouchStartY(null)
  }

  const saveApiOrder = () => {
    try {
      localStorage.setItem("porn_api_order", JSON.stringify(apiOrder))
    } catch (error) {
      console.error("Error saving API order:", error)
    }
  }

  const moveItem = (api: string, direction: "up" | "down") => {
    const newOrder = [...apiOrder]
    const currentIndex = newOrder.indexOf(api)
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= newOrder.length) return

    newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, api)

    setApiOrder(newOrder)
    try {
      localStorage.setItem("porn_api_order", JSON.stringify(newOrder))
    } catch (error) {
      console.error("Error saving API order:", error)
    }
  }

  const getApiDisplayName = (api: string) => {
    switch (api) {
      case "redgifs":
        return "RedGifs"
      case "eporner":
        return "EPorner"
      case "xvidapi":
        return "XvidAPI"
      case "cam4":
        return "Cam4"
      case "pornpics":
        return "PornPics"
      case "chaturbate":
        return "Chaturbate"
      default:
        return api
    }
  }

  if (!mounted) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Customize your AioWeb experience</p>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">API Bar Order</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Long press and drag to reorder, or use the arrow buttons
        </p>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          {apiOrder.map((api, index) => (
            <div
              key={api}
              data-api={api}
              draggable
              onDragStart={() => handleDragStart(api)}
              onDragOver={(e) => handleDragOver(e, api)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, api)}
              onTouchMove={(e) => handleTouchMove(e, api)}
              onTouchEnd={handleTouchEnd}
              className={`flex cursor-move items-center gap-3 rounded-lg border p-3 transition-all select-none ${
                draggedItem === api
                  ? "border-indigo-500 bg-indigo-100 scale-105 shadow-lg dark:bg-indigo-900/40"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              }`}
            >
              <GripVertical className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-900 dark:text-white flex-1">{getApiDisplayName(api)}</span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    moveItem(api, "up")
                  }}
                  disabled={index === 0}
                  className={`p-1.5 rounded-md transition-colors ${
                    index === 0
                      ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                  aria-label="Move up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    moveItem(api, "down")
                  }}
                  disabled={index === apiOrder.length - 1}
                  className={`p-1.5 rounded-md transition-colors ${
                    index === apiOrder.length - 1
                      ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                  aria-label="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Content Safety</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">NSFW Filter</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Block adult or inappropriate content</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={nsfwFilter}
                onChange={(e) => {
                  setNsfwFilter(e.target.checked)
                  handleSaveSettings({ nsfwFilter: e.target.checked })
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-600 dark:after:border-slate-600 dark:peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Generation Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">High Quality Mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Generate higher quality content</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={highQuality}
                  onChange={(e) => {
                    setHighQuality(e.target.checked)
                    handleSaveSettings({ highQuality: e.target.checked })
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-600 dark:after:border-slate-600 dark:peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Application</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Auto-save Results</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Automatically save generated content</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => {
                    setAutoSave(e.target.checked)
                    handleSaveSettings({ autoSave: e.target.checked })
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-600 dark:after:border-slate-600 dark:peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Switch to a darker color scheme</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => handleDarkModeToggle(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-600 dark:after:border-slate-600 dark:peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Install App</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isInstalled
                    ? "App is installed"
                    : isInstallable
                      ? "Add AioWeb to your home screen"
                      : "Install option not available"}
                </p>
              </div>
              {isInstalled ? (
                <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Installed
                </div>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallApp}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <Download className="h-4 w-4" />
                  Install
                </button>
              ) : (
                <div className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  Not Available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">About</h3>
          <div className="space-y-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">AioWeb</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Version 2.0.0</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              AI-powered creative suite for generating images, text, videos, and performing face swaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
