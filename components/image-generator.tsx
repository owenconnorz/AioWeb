"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Download, ThumbsUp, ThumbsDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ImageGenerationHistory {
  prompt: string
  imageData: Array<{ base64: string; mediaType: string }>
  feedback: "positive" | "negative" | null
  timestamp: number
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [images, setImages] = useState<Array<{ base64: string; mediaType: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [history, setHistory] = useState<ImageGenerationHistory[]>([])
  const [selectedModel, setSelectedModel] = useState("perchance")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem("imageGenerationHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("imageGenerationHistory", JSON.stringify(history))
    }
  }, [history])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setImages([])
    setFeedback(null)
    setError(null)

    console.log("[v0] Starting image generation...")

    try {
      const positivePrompts = history
        .filter((h) => h.feedback === "positive")
        .slice(-5)
        .map((h) => h.prompt)

      console.log("[v0] Sending request to API...")

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          learningContext: positivePrompts.join(", "),
          model: selectedModel,
        }),
      })

      const data = await response.json()
      console.log("[v0] Response received:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      if (data.images && data.images.length > 0) {
        console.log("[v0] Images generated successfully:", data.images.length)
        setImages(data.images)

        const newEntry: ImageGenerationHistory = {
          prompt,
          imageData: data.images,
          feedback: null,
          timestamp: Date.now(),
        }
        setHistory((prev) => [...prev, newEntry])
      } else {
        throw new Error("No images were generated")
      }
    } catch (error) {
      console.error("[v0] Image generation error:", error)
      setError(error instanceof Error ? error.message : "Failed to generate image")
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

  const handleDownload = (base64: string, index: number) => {
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${base64}`
    link.download = `generated-image-${index + 1}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="image-prompt" className="text-base font-semibold text-slate-900">
          Describe your image
        </Label>
        <p className="mt-1 text-sm text-slate-600">Be specific about what you want to see in your generated image</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image-model-select" className="text-sm font-medium text-slate-700">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="image-model-select" className="w-full">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perchance">Perchance AI - Free & Unlimited (Recommended)</SelectItem>
            <SelectItem value="google/gemini-3-pro-image-preview">Gemini 3 Pro</SelectItem>
            <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="anthropic/claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
            <SelectItem value="darlink/darlink-1">Darlink (Specialized)</SelectItem>
            <SelectItem value="lustorys/wan-2.5">Lustorys' Wan 2.5 AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        id="image-prompt"
        placeholder="A serene mountain landscape at sunset with a crystal clear lake reflecting the colorful sky..."
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
            Generating Image...
          </>
        ) : (
          "Generate Image"
        )}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-slate-900">Generated Images</Label>
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
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <img
                  src={`data:${image.mediaType};base64,${image.base64}`}
                  alt={`Generated image ${index + 1}`}
                  className="h-auto w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(image.base64, index)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {feedback === "positive" && (
            <p className="text-xs text-green-600">Thanks! The AI will learn from this example.</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-900">
            AI Learning: {history.filter((h) => h.feedback === "positive").length} positive examples saved
          </p>
        </div>
      )}
    </div>
  )
}
