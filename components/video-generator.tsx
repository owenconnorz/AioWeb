"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Download, ThumbsUp, ThumbsDown, Play } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-video")

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

    try {
      const positivePrompts = history
        .filter((h) => h.feedback === "positive")
        .slice(-5)
        .map((h) => h.prompt)

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          learningContext: positivePrompts.join(", "),
          model: selectedModel,
        }),
      })

      const data = await response.json()

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)

        const newEntry: VideoGenerationHistory = {
          prompt,
          videoData: data.videoUrl,
          feedback: null,
          timestamp: Date.now(),
        }
        setHistory((prev) => [...prev, newEntry])
      }
    } catch (error) {
      console.error("[v0] Video generation error:", error)
    } finally {
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Label htmlFor="video-prompt" className="text-base font-semibold text-slate-900">
          Describe your video
        </Label>
        <p className="mt-1 text-sm text-slate-600">
          Be specific about the scenes, actions, and style you want in your video
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-model-select" className="text-sm font-medium text-slate-700">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="video-model-select" className="w-full">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai/gpt-4o-video">GPT-4o Video (Recommended)</SelectItem>
            <SelectItem value="google/gemini-3-pro-video">Gemini 3 Pro Video</SelectItem>
            <SelectItem value="anthropic/claude-3-5-video">Claude 3.5 Video</SelectItem>
            <SelectItem value="darlink/darlink-video">Darlink Video</SelectItem>
            <SelectItem value="lustorys/wan-2.5-video">Lustorys Wan 2.5 Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        id="video-prompt"
        placeholder="A cinematic shot of a sunset over the ocean with waves gently crashing on the shore, camera slowly panning right..."
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
            Generating Video...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Generate Video
          </>
        )}
      </Button>

      {videoUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-slate-900">Generated Video</Label>
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
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-black shadow-lg">
            <video src={videoUrl} controls className="h-auto w-full" poster="/placeholder.svg?height=400&width=600">
              Your browser does not support the video tag.
            </video>
          </div>
          <Button onClick={handleDownload} variant="outline" className="w-full gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Video
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
