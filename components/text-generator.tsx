"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GenerationHistory {
  prompt: string
  response: string
  feedback: "positive" | "negative" | null
  timestamp: number
}

export function TextGenerator() {
  const [prompt, setPrompt] = useState("")
  const [generatedText, setGeneratedText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [history, setHistory] = useState<GenerationHistory[]>([])
  const [selectedModel, setSelectedModel] = useState("perchance-ai")

  useEffect(() => {
    const savedHistory = localStorage.getItem("textGenerationHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("textGenerationHistory", JSON.stringify(history))
    }
  }, [history])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setGeneratedText("")
    setFeedback(null)

    try {
      const positiveExamples = history
        .filter((h) => h.feedback === "positive")
        .slice(-5) // Last 5 positive examples
        .map((h) => `User: ${h.prompt}\nAssistant: ${h.response}`)
        .join("\n\n")

      const savedSettings = localStorage.getItem("aiCreativeSuiteSettings")
      const nsfwFilter = savedSettings ? (JSON.parse(savedSettings).nsfwFilter ?? true) : true

      console.log("[v0] Sending request with model:", selectedModel, "NSFW filter:", nsfwFilter)

      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          learningContext: positiveExamples,
          model: selectedModel,
          nsfwFilter, // Pass NSFW filter to API
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        console.error("[v0] API error:", data)
        setGeneratedText(data.error || "An error occurred while generating text. Please try a different model.")
        return
      }

      console.log("[v0] Text generation successful")
      setGeneratedText(data.text)

      const newEntry: GenerationHistory = {
        prompt,
        response: data.text,
        feedback: null,
        timestamp: Date.now(),
      }
      setHistory((prev) => [...prev, newEntry])
    } catch (error) {
      console.error("[v0] Text generation error:", error)
      setGeneratedText("An error occurred while generating text. Please check your connection and try again.")
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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="text-prompt" className="text-base font-semibold text-slate-900">
          What would you like to write?
        </Label>
        <p className="mt-1 text-sm text-slate-600">
          Describe what you want to generate, like a blog post, story, or email
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-select" className="text-sm font-medium text-slate-700">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="model-select" className="w-full">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perchance-ai">Perchance AI (Free, Unlimited)</SelectItem>
            <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (Fast)</SelectItem>
            <SelectItem value="openai/gpt-4o">GPT-4o (Balanced)</SelectItem>
            <SelectItem value="xai/grok-beta">Grok Beta (Creative)</SelectItem>
            <SelectItem value="anthropic/claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Advanced)</SelectItem>
            <SelectItem value="anthropic/claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</SelectItem>
            <SelectItem value="darlink/darlink-1">Darlink (Specialized)</SelectItem>
            <SelectItem value="lustorys/wan-2.5">Lustorys' Wan 2.5 AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        id="text-prompt"
        placeholder="Write a compelling product description for eco-friendly water bottles..."
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
            Generating...
          </>
        ) : (
          "Generate Text"
        )}
      </Button>

      {generatedText && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-slate-900">Generated Text</Label>
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
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{generatedText}</p>
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
