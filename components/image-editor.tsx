"use client"
import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2, Download, Wand2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ImageEditor() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("perchance-ai-edit")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
        setEditedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = async () => {
    if (!uploadedImage || !editPrompt.trim()) return

    setIsLoading(true)
    setEditedImage(null)

    try {
      const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
      const nsfwFilter = savedSettings ? (JSON.parse(savedSettings).nsfwFilter ?? true) : true

      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: uploadedImage,
          editPrompt,
          model: selectedModel,
          nsfwFilter, // Pass NSFW filter to API
        }),
      })

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const image = data.images[0]
        setEditedImage(`data:${image.mediaType};base64,${image.base64}`)
      }
    } catch (error) {
      console.error("[v0] Image editing error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!editedImage) return

    const link = document.createElement("a")
    link.href = editedImage
    link.download = "edited-image.png"
    link.click()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Label className="text-base font-semibold text-slate-900">Upload & Edit Images</Label>
        <p className="mt-1 text-sm text-slate-600">
          Upload an image from your device and describe how you want to edit it
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-model-select" className="text-sm font-medium text-slate-700">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="edit-model-select" className="w-full">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perchance-ai-edit">Perchance AI (Free)</SelectItem>
            <SelectItem value="google/gemini-3-pro-image-preview">Gemini 3 Pro</SelectItem>
            <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="anthropic/claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
            <SelectItem value="darlink/darlink-1">Darlink (Specialized)</SelectItem>
            <SelectItem value="lustorys/wan-2.5">Lustorys' Wan 2.5 AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100"
          size="lg"
        >
          <Upload className="mr-2 h-5 w-5" />
          {uploadedImage ? "Change Image" : "Upload Image"}
        </Button>

        {uploadedImage && (
          <div className="rounded-lg border-2 border-slate-200 bg-white p-3 sm:p-4">
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded"
              className="h-auto w-full rounded-lg object-contain"
              style={{ maxHeight: "300px" }}
            />
          </div>
        )}
      </div>

      {uploadedImage && (
        <>
          <div className="space-y-2">
            <Label htmlFor="edit-prompt" className="text-sm font-medium text-slate-700">
              How do you want to edit this image?
            </Label>
            <Textarea
              id="edit-prompt"
              placeholder="Make the background blue, add a sunset, remove the person, enhance colors, apply vintage filter..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="min-h-24 resize-none text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleEdit}
            disabled={!editPrompt.trim() || isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Editing Image...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Edit Image
              </>
            )}
          </Button>
        </>
      )}

      {editedImage && (
        <div className="space-y-4">
          <Label className="text-base font-semibold text-slate-900">Edited Result</Label>
          <div className="overflow-hidden rounded-lg border-2 border-indigo-200 bg-white shadow-lg">
            <img src={editedImage || "/placeholder.svg"} alt="Edited result" className="h-auto w-full object-contain" />
          </div>
          <Button onClick={handleDownload} variant="outline" className="w-full gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Edited Image
          </Button>
        </div>
      )}
    </div>
  )
}
