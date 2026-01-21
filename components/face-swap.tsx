"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Download, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FaceSwapProps {
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

export function FaceSwap({ selectedModel = "huggingface", onModelChange }: FaceSwapProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [targetImage, setTargetImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sourceInputRef = useRef<HTMLInputElement>(null)
  const targetInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, setImage: (image: string) => void) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const normalizedImage = await normalizeImageOrientation(file)
        setImage(normalizedImage)
      } catch (err) {
        console.error("Failed to process image:", err)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSwap = async () => {
    if (!sourceImage || !targetImage) return

    setIsLoading(true)
    setResultImage(null)
    setError(null)

    try {
      const response = await fetch("/api/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceImage, targetImage, model: selectedModel }),
      })

      const data = await response.json()

      if (data.resultImage) {
        setResultImage(data.resultImage)
      } else {
        setError("Failed to generate face swap result")
      }
    } catch (error) {
      console.error("Face swap error:", error)
      setError("Face swap failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultImage) return

    const link = document.createElement("a")
    link.href = resultImage
    link.download = "face-swap-result.png"
    link.click()
  }

  const handleReset = () => {
    setSourceImage(null)
    setTargetImage(null)
    setResultImage(null)
    setError(null)
    if (sourceInputRef.current) sourceInputRef.current.value = ""
    if (targetInputRef.current) targetInputRef.current.value = ""
  }

  return (
    <div className="space-y-6 m3-page-enter">
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 m3-expand">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          Face swap uses AI to generate a new portrait. Results may vary based on image quality and lighting.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900 dark:text-white">Source Face</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">Upload the face you want to use</p>

          <Button
            variant="outline"
            onClick={() => sourceInputRef.current?.click()}
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Upload className="h-4 w-4" />
            Upload Source Image
          </Button>
          <input
            ref={sourceInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setSourceImage)}
            className="hidden"
          />

          {sourceImage && (
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <img src={sourceImage || "/placeholder.svg"} alt="Source" className="h-auto w-full" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900 dark:text-white">Target Image</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">Upload the image to swap the face onto</p>

          <Button
            variant="outline"
            onClick={() => targetInputRef.current?.click()}
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Upload className="h-4 w-4" />
            Upload Target Image
          </Button>
          <input
            ref={targetInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setTargetImage)}
            className="hidden"
          />

          {targetImage && (
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <img src={targetImage || "/placeholder.svg"} alt="Target" className="h-auto w-full" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSwap}
          disabled={!sourceImage || !targetImage || isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 m3-button m3-ripple"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Swap Faces"
          )}
        </Button>

        {(sourceImage || targetImage || resultImage) && (
          <Button onClick={handleReset} variant="outline" size="lg" disabled={isLoading}>
            Reset
          </Button>
        )}
      </div>

      {resultImage && (
        <div className="space-y-3 m3-scale-pop">
          <Label className="text-base font-semibold text-slate-900 dark:text-white">Result</Label>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 m3-card">
            <img src={resultImage || "/placeholder.svg"} alt="Result" className="h-auto w-full" />
          </div>
          <Button onClick={handleDownload} variant="outline" className="w-full gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Result
          </Button>
        </div>
      )}
    </div>
  )
}
