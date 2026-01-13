import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "perchance-ai", nsfwFilter = true } = await req.json()

    console.log("[v0] Text generation request:", { model, promptLength: prompt.length, nsfwFilter })

    if (model === "perchance-ai") {
      const perchancePrompt = learningContext ? `Context: ${learningContext}\n\nTask: ${prompt}` : prompt

      const filteredPrompt = nsfwFilter
        ? `${perchancePrompt}\n\nIMPORTANT: Keep the content safe, appropriate, and free from adult or explicit material.`
        : perchancePrompt

      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: filteredPrompt,
        maxTokens: 2000,
        temperature: 0.7,
      })

      return Response.json({ text })
    }

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `Here are some examples of responses the user liked:\n\n${learningContext}\n\nNow, using a similar style and quality, respond to this request:\n${prompt}`
    }

    if (nsfwFilter) {
      enhancedPrompt += "\n\nIMPORTANT: Keep the content safe, appropriate, and free from adult or explicit material."
    }

    let actualModel = model

    const modelMap: Record<string, string> = {
      "perchance-ai": "openai/gpt-4o-mini",
      "openai/gpt-5-mini": "openai/gpt-4o-mini",
      "openai/gpt-4o": "openai/gpt-4o",
      "xai/grok-beta": "xai/grok-beta",
      "anthropic/claude-3-5-sonnet-20241022": "anthropic/claude-3-5-sonnet-20241022",
      "anthropic/claude-3-5-haiku-20241022": "anthropic/claude-3-5-haiku-20241022",
      "darlink/darlink-1": "openai/gpt-4o-mini",
      "lustorys/wan-2.5": "openai/gpt-4o-mini",
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
