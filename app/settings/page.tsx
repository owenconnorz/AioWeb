"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, Zap, ImageIcon, Palette, ChevronRight, ArrowLeft, Info } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

type SettingsView = "list" | "safety" | "generation" | "appearance" | "application" | "about"

export default function SettingsPage() {
  const [currentView, setCurrentView] = useState<SettingsView>("list")
  const [nsfwFilter, setNsfwFilter] = useState(true)
  const [autoSave, setAutoSave] = useState(false)
  const [highQuality, setHighQuality] = useState(true)
  const [showWatermark, setShowWatermark] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setNsfwFilter(settings.nsfwFilter ?? true)
      setAutoSave(settings.autoSave ?? false)
      setHighQuality(settings.highQuality ?? true)
      setShowWatermark(settings.showWatermark ?? false)
    }
  }, [])

  const handleSaveSettings = useCallback(() => {
    const settings = {
      nsfwFilter,
      autoSave,
      highQuality,
      showWatermark,
    }
    localStorage.setItem("aiCreativeSuiteSettings", JSON.stringify(settings))
    alert("Settings saved successfully!")
  }, [nsfwFilter, autoSave, highQuality, showWatermark])

  const handleThemeToggle = useCallback((checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }, [setTheme])

  const CategoryButton = ({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-lg border-0 shadow-sm"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </div>
      <span className="flex-1 text-left text-base font-medium text-slate-900 dark:text-slate-100">{title}</span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  )

  const renderListView = () => (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <CategoryButton icon={Shield} title="Content Safety" onClick={() => setCurrentView("safety")} />
          <CategoryButton icon={ImageIcon} title="Generation Settings" onClick={() => setCurrentView("generation")} />
        </div>

        <div className="space-y-2">
          <CategoryButton icon={Palette} title="Appearance" onClick={() => setCurrentView("appearance")} />
        </div>

        <div className="space-y-2">
          <CategoryButton icon={Zap} title="Application" onClick={() => setCurrentView("application")} />
        </div>

        <div className="space-y-2">
          <CategoryButton icon={Info} title="About" onClick={() => setCurrentView("about")} />
        </div>
      </div>
    </>
  )

  const renderDetailView = () => {
    const backButton = (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => setCurrentView("list")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    )

    if (currentView === "safety") {
      return (
        <>
          <div className="mb-6 flex items-center gap-3">
            {backButton}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Content Safety</h1>
          </div>
          <Card className="border-0 shadow-lg dark:bg-slate-800/50">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="nsfw-filter" className="text-base font-medium">
                    NSFW Filter
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Block adult or inappropriate content from being generated
                  </p>
                </div>
                <Switch id="nsfw-filter" checked={nsfwFilter} onCheckedChange={setNsfwFilter} />
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    if (currentView === "generation") {
      return (
        <>
          <div className="mb-6 flex items-center gap-3">
            {backButton}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Generation Settings</h1>
          </div>
          <Card className="border-0 shadow-lg dark:bg-slate-800/50">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="high-quality" className="text-base font-medium">
                    High Quality Mode
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Generate higher quality images and text (may take longer)
                  </p>
                </div>
                <Switch id="high-quality" checked={highQuality} onCheckedChange={setHighQuality} />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="watermark" className="text-base font-medium">
                    Add Watermark
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Include a small watermark on generated images
                  </p>
                </div>
                <Switch id="watermark" checked={showWatermark} onCheckedChange={setShowWatermark} />
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    if (currentView === "appearance") {
      return (
        <>
          <div className="mb-6 flex items-center gap-3">
            {backButton}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Appearance</h1>
          </div>
          <Card className="border-0 shadow-lg dark:bg-slate-800/50">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Switch to a darker color scheme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={mounted ? theme === "dark" : false}
                  onCheckedChange={handleThemeToggle}
                  disabled={!mounted}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    if (currentView === "application") {
      return (
        <>
          <div className="mb-6 flex items-center gap-3">
            {backButton}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Application</h1>
          </div>
          <Card className="border-0 shadow-lg dark:bg-slate-800/50">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="auto-save" className="text-base font-medium">
                    Auto-save Results
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Automatically save generated content to your history
                  </p>
                </div>
                <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    if (currentView === "about") {
      return (
        <>
          <div className="mb-6 flex items-center gap-3">
            {backButton}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">About</h1>
          </div>
          <Card className="border-0 shadow-lg dark:bg-slate-800/50">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Naughty AI</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Version 1.0.0</p>
              </div>
              <Separator />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                An AI-powered creative suite for generating images, videos, text, and more.
              </p>
            </CardContent>
          </Card>
        </>
      )
    }

    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {currentView === "list" ? renderListView() : renderDetailView()}

        {currentView !== "list" && currentView !== "about" && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 sm:w-auto">
              Save Settings
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
