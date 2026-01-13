import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "openai/gpt-5-mini" } = await req.json()

    console.log("[v0] Text generation request:", { model, promptLength: prompt.length })

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `Here are some examples of responses the user liked:\n\n${learningContext}\n\nNow, using a similar style and quality, respond to this request:\n${prompt}`
    }

    let actualModel = model

    // Map model names to correct AI SDK format
    const modelMap: Record<string, string> = {
      "openai/gpt-5-mini": "openai/gpt-4o-mini",
      "openai/gpt-4o": "openai/gpt-4o",
      "xai/grok-beta": "xai/grok-beta",
      "anthropic/claude-3-5-sonnet-20241022": "anthropic/claude-3-5-sonnet-20241022",
      "anthropic/claude-3-5-haiku-20241022": "anthropic/claude-3-5-haiku-20241022",
      "darlink/darlink-1": "openai/gpt-4o-mini", // Fallback for custom models
      "lustorys/wan-2.5": "openai/gpt-4o-mini", // Fallback for custom models
    }

    actualModel = modelMap[model] || model

    console.log("[v0] Using model:", actualModel)

    const { text, usage, finishReason } = await generateText({
      model: actualModel,
      prompt: enhancedPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    console.log("[v0] Text generation successful")

    return Response.json({
      text,
      usage,
      finishReason,
    })
  } catch (error) {
    console.error("[v0] Text generation error:", error)
    return Response.json(
      {
        error: "Failed to generate text. Please try a different model or check your connection.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
