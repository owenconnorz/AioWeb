"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Download, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FaceSwap() {
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [targetImage, setTargetImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const sourceInputRef = useRef<HTMLInputElement>(null)
  const targetInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, setImage: (image: string) => void) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSwap = async () => {
    if (!sourceImage || !targetImage) return

    setIsLoading(true)
    setResultImage(null)

    try {
      const response = await fetch("/api/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceImage, targetImage }),
      })

      const data = await response.json()

      if (data.resultImage) {
        setResultImage(data.resultImage)
      }
    } catch (error) {
      console.error("[v0] Face swap error:", error)
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
    if (sourceInputRef.current) sourceInputRef.current.value = ""
    if (targetInputRef.current) targetInputRef.current.value = ""
  }

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          For advanced face swap capabilities, consider adding the fal integration for professional-grade results.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">Source Face</Label>
          <p className="text-sm text-slate-600">Upload the face you want to use</p>

          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => sourceInputRef.current?.click()} className="w-full gap-2">
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
          </div>

          {sourceImage && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <img src={sourceImage || "/placeholder.svg"} alt="Source" className="h-auto w-full" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">Target Image</Label>
          <p className="text-sm text-slate-600">Upload the image to swap the face onto</p>

          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => targetInputRef.current?.click()} className="w-full gap-2">
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
          </div>

          {targetImage && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <img src={targetImage || "/placeholder.svg"} alt="Target" className="h-auto w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSwap}
          disabled={!sourceImage || !targetImage || isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Swapping Faces...
            </>
          ) : (
            "Swap Faces"
          )}
        </Button>

        {(sourceImage || targetImage || resultImage) && (
          <Button onClick={handleReset} variant="outline" size="lg">
            Reset
          </Button>
        )}
      </div>

      {resultImage && (
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">Result</Label>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
