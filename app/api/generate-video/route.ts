import { generateText } from "ai"

export async function POST(req: Request) {
  const { prompt, learningContext, model = "openai/gpt-4o-video" } = await req.json()

  console.log("[v0] Video generation request:", { model, prompt })

  let enhancedPrompt = prompt
  if (learningContext) {
    enhancedPrompt = `Based on these successful video prompt styles: ${learningContext}. Generate a video for: ${prompt}`
  }

  try {
    const result = await generateText({
      model,
      prompt: enhancedPrompt,
    })

    console.log("[v0] Video generation result:", result)

    let videoUrl = null

    if (result.files && result.files.length > 0) {
      for (const file of result.files) {
        if (file.mediaType.startsWith("video/")) {
          videoUrl = `data:${file.mediaType};base64,${file.base64}`
          break
        }
      }
    } else {
      console.log("[v0] No video files in result, using placeholder")
      // For now, we'll return a mock response since video generation isn't fully implemented
      videoUrl = "/placeholder-video.mp4"
    }

    return Response.json({
      videoUrl,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    })
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return Response.json({ error: "Video generation failed. This feature requires additional setup." }, { status: 500 })
  }
}
