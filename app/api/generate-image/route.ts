export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "perchance" } = await req.json()

    console.log("[v0] Image generation started with model:", model)
    console.log("[v0] Prompt:", prompt)

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    if (model === "perchance") {
      // Perchance AI uses a specific format
      const perchancePayload = {
        prompt: enhancedPrompt,
        negativePrompt: "nsfw, nudity, text, watermark, blurry, low quality",
        resolution: "512x768",
        guidanceScale: 7,
      }

      console.log("[v0] Using Perchance AI with payload:", perchancePayload)

      // Call Perchance's image generation endpoint
      const response = await fetch("https://image-generation.perchance.org/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(perchancePayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Perchance API error:", response.status, errorText)
        throw new Error(`Perchance API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Perchance response received")

      // Perchance returns base64 image data
      const images = [
        {
          base64: data.image || data.base64,
          mediaType: "image/png",
        },
      ]

      return Response.json({
        images,
        prompt: enhancedPrompt,
      })
    }

    // Fallback to AI SDK for other models
    const { generateText } = await import("ai")

    const result = await generateText({
      model,
      prompt: enhancedPrompt,
    })

    const images = []
    if (result.files) {
      for (const file of result.files) {
        if (file.mediaType.startsWith("image/")) {
          images.push({
            base64: file.base64,
            mediaType: file.mediaType,
          })
        }
      }
    }

    return Response.json({
      text: result.text,
      images,
      usage: result.usage,
      finishReason: result.finishReason,
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate image",
        images: [],
      },
      { status: 500 },
    )
  }
}
