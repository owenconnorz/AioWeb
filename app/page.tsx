"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ImageGenerator } from "@/components/image-generator"
import { FaceSwap } from "@/components/face-swap"
import { VideoGenerator } from "@/components/video-generator"
import { PornVideos } from "@/components/porn-videos"
import { Sparkles, ImageIcon, Users, Settings, Video, Film } from "lucide-react"

export default function Home() {
  const [activeTab, setActiveTab] = useState("image")
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
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 flex flex-col items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Powered by AI
            </div>
          </div>
          <h1 className="mb-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:mb-4 sm:text-5xl">
            Naughty AI
          </h1>
          <p className="text-pretty text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Generate stunning images, craft compelling text, create videos, and transform faces with cutting-edge AI
          </p>
        </div>

        <div className="w-full">
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

          {activeTab === "porn" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800/50">
              <CardContent className="p-4 sm:p-6">
                <PornVideos />
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
            onClick={() => setActiveTab("porn")}
            className={`nav-item ${activeTab === "porn" ? "active" : ""}`}
            aria-label="Porn Videos"
          >
            <Film className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Porn</span>
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
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }, [])

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked)
    onDarkModeChange(checked)
    handleSaveSettings({ darkMode: checked })
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

  if (!mounted) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Customize your Naughty AI experience</p>
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
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">About</h3>
          <div className="space-y-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Naughty AI</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Version 1.0.0</p>
            </div>
            <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Developed by</p>
              <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">Owen Connor Z</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              An AI-powered creative suite for generating images, text, videos, and face swaps using cutting-edge
              artificial intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
