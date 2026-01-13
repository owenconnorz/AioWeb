"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Download, ThumbsUp, ThumbsDown, Upload, X, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

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
  const [progress, setProgress] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("imageGenerationHistory")
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (err) {
      console.error("[v0] Failed to load history:", err)
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem("imageGenerationHistory", JSON.stringify(history))
      } catch (err) {
        console.error("[v0] Failed to save history:", err)
      }
    }
  }, [history])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setImages([])
    setFeedback(null)
    setError(null)
    setProgress(0)

    console.log("[v0] Starting image generation...")
    console.log("[v0] Has uploaded image:", !!uploadedImage)
    console.log("[v0] Model:", selectedModel)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 15
      })
    }, 300)

    try {
      const positivePrompts = history
        .filter((h) => h.feedback === "positive")
        .slice(-5)
        .map((h) => h.prompt)

      let nsfwFilter = true
      try {
        const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
        if (savedSettings) {
          nsfwFilter = JSON.parse(savedSettings).nsfwFilter ?? true
        }
      } catch (err) {
        console.error("[v0] Failed to parse settings:", err)
      }

      console.log("[v0] Sending request to API with NSFW filter:", nsfwFilter)

      const response = await fetch("/api/generate-image", {
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

      const data = await response.json()
      console.log("[v0] Response received:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      if (data.images && data.images.length > 0) {
        console.log("[v0] Images generated successfully:", data.images.length)
        setProgress(100)
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

  const handleDownload = (base64: string, index: number) => {
    try {
      const link = document.createElement("a")
      link.href = `data:image/png;base64,${base64}`
      link.download = `generated-image-${index + 1}.png`
      link.click()
    } catch (err) {
      console.error("[v0] Download failed:", err)
    }
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
      // Automatically switch to PromptChan for image editing
      if (selectedModel !== "promptchan") {
        setSelectedModel("promptchan")
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="image-prompt" className="text-base font-semibold text-slate-900 dark:text-white">
          {uploadedImage ? "Describe your edits" : "Describe your image"}
        </Label>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {uploadedImage
            ? "Tell the AI what changes to make to your uploaded image"
            : "Be specific about what you want to see in your generated image"}
        </p>
      </div>

      {uploadedImage && selectedModel !== "promptchan" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Image editing not supported with this model
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
                The selected model will generate a NEW image based on your description, not edit your uploaded photo.
                Switch to <strong>PromptChan AI</strong> for true image-to-image editing.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-900/50 bg-transparent"
                onClick={() => setSelectedModel("promptchan")}
              >
                Switch to PromptChan AI
              </Button>
            </div>
          </div>
        </div>
      )}

      {uploadedImage && selectedModel === "promptchan" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-900 dark:text-green-300">
            ✓ Ready for image editing! PromptChan AI will modify your uploaded photo based on your instructions.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Image (Optional)</Label>
        {uploadedImage ? (
          <div className="relative">
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded"
              className="h-48 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-500 dark:hover:bg-slate-800"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => setUploadedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-indigo-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-500 dark:hover:bg-slate-800">
            <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            <span className="mt-2 text-sm text-slate-600 dark:text-slate-400">Click to upload an image</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG up to 10MB</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image-model-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="image-model-select" className="w-full">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perchance">Perchance AI - Free & Unlimited (Recommended)</SelectItem>
            <SelectItem value="grok">Grok AI - xAI's Image Generator</SelectItem>
            <SelectItem value="promptchan">PromptChan AI - NSFW & Image Editing Specialist ⭐</SelectItem>
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
        placeholder={
          uploadedImage
            ? "Add a sunset background, change the colors to blue and gold, enhance details..."
            : "A serene mountain landscape at sunset with a crystal clear lake reflecting the colorful sky..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-32 resize-none"
        disabled={isLoading}
      />

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {uploadedImage ? "Editing Image..." : "Generating Image..."}
          </>
        ) : uploadedImage ? (
          "Edit Image"
        ) : (
          "Generate Image"
        )}
      </Button>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-700 dark:text-slate-300">Generating...</Label>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-500">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-500 text-center dark:text-slate-400">
            {progress < 30 && "Preparing your request..."}
            {progress >= 30 && progress < 60 && "AI is creating your image..."}
            {progress >= 60 && progress < 90 && "Finalizing details..."}
            {progress >= 90 && "Almost done..."}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-slate-900 dark:text-white">Generated Images</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("positive")}
                className={`gap-2 ${feedback === "positive" ? "text-green-600 dark:text-green-400" : ""}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("negative")}
                className={`gap-2 ${feedback === "negative" ? "text-red-600 dark:text-red-400" : ""}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
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
            <p className="text-xs text-green-600 dark:text-green-400">Thanks! The AI will learn from this example.</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
          <p className="text-sm text-indigo-900 dark:text-indigo-300">
            AI Learning: {history.filter((h) => h.feedback === "positive").length} positive examples saved
          </p>
        </div>
      )}
    </div>
  )
}
