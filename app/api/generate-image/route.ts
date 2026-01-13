import { generateText } from "ai"

export async function POST(req: Request) {
  const { prompt, learningContext, model = "google/gemini-3-pro-image-preview" } = await req.json()

  let enhancedPrompt = prompt
  if (learningContext) {
    enhancedPrompt = `Based on these successful prompt styles: ${learningContext}. Generate an image for: ${prompt}`
  }

  const result = await generateText({
    model,
    prompt: enhancedPrompt,
  })

  const images = []
  for (const file of result.files) {
    if (file.mediaType.startsWith("image/")) {
      images.push({
        base64: file.base64,
        mediaType: file.mediaType,
      })
    }
  }

  return Response.json({
    text: result.text,
    images,
    usage: result.usage,
    finishReason: result.finishReason,
  })
}
