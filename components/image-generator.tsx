"use client"

import { useState, useEffect, type ChangeEvent, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Download, ThumbsUp, ThumbsDown, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface ImageGenerationHistory {
  prompt: string
  imageData: Array<{ base64: string; mediaType: string }>
  feedback: "positive" | "negative" | null
  timestamp: number
}

interface ImageGeneratorProps {
  selectedModel?: string
  onModelChange?: (model: string) => void
}

// Normalize image orientation using canvas (fixes phone camera EXIF rotation)
async function normalizeImageOrientation(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Create canvas with correct dimensions
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      
      // Draw image - modern browsers auto-apply EXIF orientation when drawing to canvas
      ctx.drawImage(img, 0, 0)
      
      // Convert to base64
      resolve(canvas.toDataURL("image/jpeg", 0.95))
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

export function ImageGenerator({ selectedModel = "huggingface", onModelChange }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [images, setImages] = useState<Array<{ base64: string; mediaType: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [history, setHistory] = useState<ImageGenerationHistory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedHistory = localStorage.getItem("imageGenerationHistory")
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (err) {
      console.error("Failed to load history:", err)
    }
  }, [])

  useEffect(() => {
    if (!mounted || history.length === 0) return

    try {
      localStorage.setItem("imageGenerationHistory", JSON.stringify(history))
    } catch (err) {
      console.error("Failed to save history:", err)
    }
  }, [history, mounted])

  const positivePrompts = useMemo(() =>
    history
      .filter((h) => h.feedback === "positive")
      .slice(-5)
      .map((h) => h.prompt),
    [history]
  )

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setImages([])
    setFeedback(null)
    setError(null)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 10
      })
    }, 500)

    try {

      let nsfwFilter = true
      try {
        const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
        if (savedSettings) {
          nsfwFilter = JSON.parse(savedSettings).nsfwFilter ?? true
        }
      } catch (err) {
        console.error("Failed to parse settings:", err)
      }

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

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`)
      }

      if (data.images && data.images.length > 0) {
        setProgress(100)
        setImages(data.images)

        const newEntry: ImageGenerationHistory = {
          prompt,
          imageData: data.images,
          feedback: null,
          timestamp: Date.now(),
        }
        setHistory((prev) => [...prev, newEntry])
        toast.success("Image generated", {
          description: `${data.images.length} image${data.images.length > 1 ? "s" : ""} ready`
        })
      } else {
        throw new Error("No images were generated")
      }
    } catch (error) {
      console.error("Image generation error:", error)
      setError(error instanceof Error ? error.message : "Failed to generate image")
      setProgress(0)
      toast.error("Generation failed", {
        description: error instanceof Error ? error.message : "An error occurred"
      })
    } finally {
      clearInterval(progressInterval)
      setIsLoading(false)
    }
  }, [prompt, positivePrompts, selectedModel, uploadedImage])

  const handleFeedback = useCallback((type: "positive" | "negative") => {
    setFeedback(type)
    setHistory((prev) => {
      const updated = [...prev]
      const lastIndex = updated.length - 1
      if (lastIndex >= 0) {
        updated[lastIndex] = { ...updated[lastIndex], feedback: type }
      }
      return updated
    })
  }, [])

  const handleDownload = useCallback(async (base64: string, index: number) => {
    try {
      // Convert base64 to blob for better mobile browser compatibility
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "image/png" })
      
      // Create object URL from blob (more memory efficient)
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `generated-image-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      
      toast.success("Image downloaded", {
        description: `generated-image-${index + 1}.png saved`
      })
    } catch (err) {
      toast.error("Download failed", {
        description: "Opening image in new tab instead"
      })
      // Fallback: open image in new tab if download fails
      const newTab = window.open()
      if (newTab) {
        newTab.document.write(`<img src="data:image/png;base64,${base64}" />`)
      }
    }
  }, [])

  const handleImageUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Normalize image orientation before storing
      const normalizedImage = await normalizeImageOrientation(file)
      setUploadedImage(normalizedImage)
    } catch (err) {
      console.error("Failed to process image:", err)
      // Fallback to regular FileReader if normalization fails
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  return (
    <div className="space-y-6 m3-page-enter">
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

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Image to Edit (Optional)</Label>
        {uploadedImage ? (
          <div className="relative">
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded"
              className="max-h-64 w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700"
              style={{ imageOrientation: "from-image" }}
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

      <Textarea
        id="image-prompt"
        placeholder={
          uploadedImage
            ? "Add a sunset background, change the colors to blue and gold..."
            : "A serene mountain landscape at sunset with a crystal clear lake..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-32 resize-none"
        disabled={isLoading}
      />

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 m3-button m3-ripple"
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
          <div className="grid gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 m3-card m3-scale-pop"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={`data:${image.mediaType};base64,${image.base64}`}
                  alt={`Generated image ${index + 1}`}
                  className="h-auto w-full object-contain"
                  style={{ imageOrientation: "from-image" }}
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
