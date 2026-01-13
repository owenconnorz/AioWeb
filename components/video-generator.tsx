"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Download, ThumbsUp, ThumbsDown, Play, Upload, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface VideoGenerationHistory {
  prompt: string
  videoData: string
  feedback: "positive" | "negative" | null
  timestamp: number
}

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [history, setHistory] = useState<VideoGenerationHistory[]>([])
  const [selectedModel, setSelectedModel] = useState("promptchan-video")
  const [progress, setProgress] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem("videoGenerationHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("videoGenerationHistory", JSON.stringify(history))
    }
  }, [history])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setVideoUrl(null)
    setFeedback(null)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev
        return prev + 5
      })
    }, 800)

    try {
      const positivePrompts = history
        .filter((h) => h.feedback === "positive")
        .slice(-5)
        .map((h) => h.prompt)

      const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
      const nsfwFilter = savedSettings ? (JSON.parse(savedSettings).nsfwFilter ?? true) : true

      console.log("[v0] Sending video generation request with NSFW filter:", nsfwFilter)

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          learningContext: positivePrompts.join(", "),
          model: selectedModel,
          nsfwFilter,
          uploadedImage,
        }),
      })

      console.log("[v0] Response status:", response.status)

      const data = await response.json()

      console.log("[v0] Response data:", data)

      if (!response.ok) {
        console.error("[v0] Error response:", data)
        alert(`Error: ${data.error || "Failed to generate video"}`)
        setProgress(0)
        return
      }

      if (data.videoUrl) {
        console.log("[v0] Setting video URL:", data.videoUrl)
        setProgress(100)
        setVideoUrl(data.videoUrl)

        const newEntry: VideoGenerationHistory = {
          prompt,
          videoData: data.videoUrl,
          feedback: null,
          timestamp: Date.now(),
        }
        setHistory((prev) => [...prev, newEntry])
      } else {
        console.error("[v0] No video URL in response")
        alert("No video was generated. Please try again.")
        setProgress(0)
      }
    } catch (error) {
      console.error("[v0] Video generation error:", error)
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
    link.download = "generated-video.mp4"
    link.click()
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
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
            : "Be specific about the scenes, actions, and style you want in your video"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-image-upload" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Upload Image (Optional)
        </Label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload an image to animate or create a video from it
        </p>
        {!uploadedImage ? (
          <label
            htmlFor="video-image-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-6 transition-colors hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Click to upload an image</span>
            <input
              id="video-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
            <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" className="w-full h-48 object-cover" />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              disabled={isLoading}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-model-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="video-model-select" className="w-full">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="promptchan-video">PromptChan AI Video - NSFW Specialist</SelectItem>
            <SelectItem value="perchance-ai-video">Perchance AI Video (Free)</SelectItem>
            <SelectItem value="openai/gpt-4o-video">GPT-4o Video</SelectItem>
            <SelectItem value="google/gemini-3-pro-video">Gemini 3 Pro Video</SelectItem>
            <SelectItem value="anthropic/claude-3-5-video">Claude 3.5 Video</SelectItem>
            <SelectItem value="darlink/darlink-video">Darlink Video</SelectItem>
            <SelectItem value="lustorys/wan-2.5-video">Lustorys Wan 2.5 Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        id="video-prompt"
        placeholder={
          uploadedImage
            ? "Animate this image with smooth transitions, add motion to make it come alive..."
            : "A cinematic shot of a sunset over the ocean with waves gently crashing on the shore, camera slowly panning right..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-32 resize-none text-sm sm:text-base"
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
            {uploadedImage ? "Animating Image..." : "Generating Video..."}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {uploadedImage ? "Animate Image" : "Generate Video"}
          </>
        )}
      </Button>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-700 dark:text-slate-300">Generating video...</Label>
            <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-500 text-center">
            {progress < 25 && "Preparing your video request..."}
            {progress >= 25 && progress < 50 && "AI is processing scenes..."}
            {progress >= 50 && progress < 75 && "Rendering video frames..."}
            {progress >= 75 && progress < 90 && "Finalizing video..."}
            {progress >= 90 && "Almost ready..."}
          </p>
        </div>
      )}

      {videoUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Generated Video</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("positive")}
                className={`gap-2 ${feedback === "positive" ? "text-green-600" : ""}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("negative")}
                className={`gap-2 ${feedback === "negative" ? "text-red-600" : ""}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-lg">
            <img
              src={videoUrl || "/placeholder.svg"}
              alt="Generated video preview"
              className="h-auto w-full object-cover"
            />
            <div className="bg-indigo-50 border-t border-indigo-200 p-3">
              <p className="text-xs sm:text-sm text-indigo-900">
                Video preview mode - Connect a video AI integration for full video generation
              </p>
            </div>
          </div>
          <Button onClick={handleDownload} variant="outline" className="w-full gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Preview
          </Button>
          {feedback === "positive" && (
            <p className="text-xs text-green-600">Thanks! The AI will learn from this example.</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-indigo-900">
            AI Learning: {history.filter((h) => h.feedback === "positive").length} positive examples saved
          </p>
        </div>
      )}
    </div>
  )
}
