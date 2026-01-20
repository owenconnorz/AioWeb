"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Download, ThumbsUp, ThumbsDown, Play, Upload, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"


interface VideoGenerationHistory {
  prompt: string
  videoData: string
  feedback: "positive" | "negative" | null
  timestamp: number
}

interface VideoGeneratorProps {
  selectedModel?: string
  onModelChange?: (model: string) => void
}

// Normalize image orientation using canvas (fixes phone camera EXIF rotation)
async function normalizeImageOrientation(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/jpeg", 0.95))
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

export function VideoGenerator({ selectedModel = "huggingface", onModelChange }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [frames, setFrames] = useState<string[]>([])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [history, setHistory] = useState<VideoGenerationHistory[]>([])
  const [progress, setProgress] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedHistory = localStorage.getItem("videoGenerationHistory")
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (err) {
      console.error("Failed to load video history:", err)
    }
  }, [])

  useEffect(() => {
    if (!mounted || history.length === 0) return

    try {
      localStorage.setItem("videoGenerationHistory", JSON.stringify(history))
    } catch (err) {
      console.error("Failed to save video history:", err)
    }
  }, [history, mounted])

  useEffect(() => {
    if (frames.length > 0 && isPlaying) {
      const interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length)
      }, 500)
      return () => clearInterval(interval)
    }
  }, [frames, isPlaying])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setVideoUrl(null)
    setFrames([])
    setCurrentFrame(0)
    setFeedback(null)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev
        return prev + 5
      })
    }, 500)

    try {
      const positivePrompts = history
        .filter((h) => h.feedback === "positive")
        .slice(-5)
        .map((h) => h.prompt)

      const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
      const nsfwFilter = savedSettings ? (JSON.parse(savedSettings).nsfwFilter ?? true) : true

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          learningContext: positivePrompts.join(", "),
          nsfwFilter,
          uploadedImage,
          model: selectedModel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`Error: ${data.error || "Failed to generate video"}`)
        setProgress(0)
        return
      }

      if (data.videoUrl) {
        setProgress(100)
        setVideoUrl(data.videoUrl)

        if (data.frames && data.frames.length > 0) {
          setFrames(data.frames)
          setIsPlaying(true)
        }

        const newEntry: VideoGenerationHistory = {
          prompt,
          videoData: data.videoUrl,
          feedback: null,
          timestamp: Date.now(),
        }
        setHistory((prev) => [...prev, newEntry])
      } else {
        alert("No video was generated. Please try again.")
        setProgress(0)
      }
    } catch (error) {
      console.error("Video generation error:", error)
      alert(`Failed to generate video: ${error instanceof Error ? error.message : "Unknown error"}`)
      setProgress(0)
    } finally {
      clearInterval(progressInterval)
      setIsLoading(false)
    }
  }

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type)
    setHistory((prev) => {
      const updated = [...prev]
      const lastIndex = updated.length - 1
      if (lastIndex >= 0) {
        updated[lastIndex] = { ...updated[lastIndex], feedback: type }
      }
      return updated
    })
  }

  const handleDownload = () => {
    if (!videoUrl) return

    const link = document.createElement("a")
    link.href = videoUrl
    link.download = "generated-video.png"
    link.click()
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const normalizedImage = await normalizeImageOrientation(file)
        setUploadedImage(normalizedImage)
      } catch (err) {
        console.error("Failed to process image:", err)
        const reader = new FileReader()
        reader.onloadend = () => {
          setUploadedImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Label htmlFor="video-prompt" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Describe your video
        </Label>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {uploadedImage
            ? "Describe how to animate or transform this image"
            : "Be specific about the scenes, actions, and style you want"}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Image (Optional)</Label>
        {!uploadedImage ? (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-6 transition-colors hover:border-indigo-500">
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Click to upload an image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isLoading} />
          </label>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
            <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" className="w-full h-48 object-cover" />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setUploadedImage(null)}
              disabled={isLoading}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Textarea
        id="video-prompt"
        placeholder={
          uploadedImage
            ? "Animate this image with smooth transitions..."
            : "A cinematic shot of a sunset over the ocean with waves crashing..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-32 resize-none"
        disabled={isLoading}
      />

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Animation...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Generate Animation
          </>
        )}
      </Button>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-700 dark:text-slate-300">Generating frames...</Label>
            <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {frames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Generated Animation</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("positive")}
                className={feedback === "positive" ? "text-green-600" : ""}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("negative")}
                className={feedback === "negative" ? "text-red-600" : ""}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-black">
            <img
              src={frames[currentFrame] || "/placeholder.svg"}
              alt={`Frame ${currentFrame + 1}`}
              className="w-full h-auto"
            />

            {/* Frame navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFrame((prev) => (prev - 1 + frames.length) % frames.length)}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <span className="text-white text-sm">
                    Frame {currentFrame + 1} / {frames.length}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFrame((prev) => (prev + 1) % frames.length)}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleDownload} variant="outline" className="w-full gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Current Frame
          </Button>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20 p-4">
          <p className="text-sm text-indigo-900 dark:text-indigo-300">
            AI Learning: {history.filter((h) => h.feedback === "positive").length} positive examples saved
          </p>
        </div>
      )}
    </div>
  )
}
