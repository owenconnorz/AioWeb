"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TextGenerator } from "@/components/text-generator"
import { ImageGenerator } from "@/components/image-generator"
import { FaceSwap } from "@/components/face-swap"
import { VideoGenerator } from "@/components/video-generator"
import { ImageEditor } from "@/components/image-editor"
import { Sparkles, ImageIcon, Users, Settings, Video, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const [activeTab, setActiveTab] = useState("text")

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-28">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-12">
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex-1" />
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Powered by AI
            </div>
            <div className="flex flex-1 justify-end">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
            </div>
          </div>
          <h1 className="mb-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:mb-4 sm:text-5xl">
            Naughty AI
          </h1>
          <p className="text-pretty text-base text-slate-600 sm:text-lg">
            Generate stunning images, craft compelling text, create videos, and transform faces with cutting-edge AI
          </p>
        </div>

        <div className="w-full">
          {activeTab === "text" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <TextGenerator />
              </CardContent>
            </Card>
          )}

          {activeTab === "image" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <ImageGenerator />
              </CardContent>
            </Card>
          )}

          {activeTab === "edit" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <ImageEditor />
              </CardContent>
            </Card>
          )}

          {activeTab === "video" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <VideoGenerator />
              </CardContent>
            </Card>
          )}

          {activeTab === "faceswap" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <FaceSwap />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="glass-nav-pill flex items-center gap-1 rounded-full border border-white/20 bg-white/80 p-2 shadow-2xl backdrop-blur-xl sm:gap-2 sm:p-2.5">
          <button
            onClick={() => setActiveTab("text")}
            className={`nav-item ${activeTab === "text" ? "active" : ""}`}
            aria-label="Text Generator"
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Text</span>
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
            onClick={() => setActiveTab("edit")}
            className={`nav-item ${activeTab === "edit" ? "active" : ""}`}
            aria-label="Image Editor"
          >
            <Wand2 className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="nav-label">Edit</span>
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
        </div>
      </nav>
    </main>
  )
}
