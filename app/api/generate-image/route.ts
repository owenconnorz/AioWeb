export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "perchance", nsfwFilter = true } = await req.json()

    console.log("[v0] Image generation started with model:", model, "NSFW filter:", nsfwFilter)
    console.log("[v0] Prompt:", prompt)

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, appropriate content only, no nudity or explicit material"
    }

    const imageCount = 1
    const images = []

    for (let i = 0; i < imageCount; i++) {
      const seed = Date.now() + i
      const safeParam = nsfwFilter ? "&safe=true" : ""
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=512&height=512&seed=${seed}&nologo=true${safeParam}`

      const imageResponse = await fetch(imageUrl)
      if (imageResponse.ok) {
        const arrayBuffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")

        images.push({
          base64: base64,
          mediaType: "image/jpeg",
        })
      }
    }

    console.log("[v0] Generated", images.length, "images")

    if (images.length === 0) {
      throw new Error("No images were generated")
    }

    return Response.json({
      images,
      prompt: enhancedPrompt,
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
