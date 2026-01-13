export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "perchance" } = await req.json()

    console.log("[v0] Image generation started with model:", model)
    console.log("[v0] Prompt:", prompt)

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    // Generate multiple images for better user experience
    const imageCount = 2
    const images = []

    for (let i = 0; i < imageCount; i++) {
      // Use a reliable image placeholder service with the prompt as a query
      const seed = Date.now() + i
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=768&height=768&seed=${seed}&nologo=true`

      // Fetch the image and convert to base64
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
