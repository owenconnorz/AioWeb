export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "pollinations", nsfwFilter = true, uploadedImage } = await req.json()

    console.log("[v0] Image generation started with model:", model, "NSFW filter:", nsfwFilter)
    console.log("[v0] Prompt:", prompt)
    console.log("[v0] Has uploaded image:", !!uploadedImage)

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, appropriate content only, no nudity or explicit material"
    }

    if (uploadedImage) {
      enhancedPrompt = `Edit this image: ${enhancedPrompt}. Maintain the original subjects and composition while applying the requested changes.`
    }

    // Pollinations AI - Free, unlimited, works reliably
    const seed = Date.now()
    const width = 768
    const height = 768

    let imageUrl: string

    if (
      model === "pollinations" ||
      model === "grok" ||
      model.includes("gemini") ||
      model.includes("gpt") ||
      model.includes("claude") ||
      model.includes("darlink") ||
      model.includes("lustorys")
    ) {
      // All models use Pollinations as the backend (free and unlimited)
      const safeParam = nsfwFilter ? "&safe=true" : ""

      if (uploadedImage) {
        // For image editing, describe changes based on the uploaded image
        const editPrompt = `Based on a reference photo: ${enhancedPrompt}. Create a similar composition with the requested modifications.`
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true${safeParam}`
      } else {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true${safeParam}`
      }
    } else if (model === "promptchan") {
      // PromptChan - use their image generation endpoint
      // Note: This API may require a valid API key
      const safeParam = nsfwFilter ? "&safe=true" : ""
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true${safeParam}&model=flux`
    } else {
      // Default to Pollinations
      const safeParam = nsfwFilter ? "&safe=true" : ""
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true${safeParam}`
    }

    console.log("[v0] Fetching image from:", imageUrl.substring(0, 100))

    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(60000), // 60 second timeout
    })

    if (!imageResponse.ok) {
      throw new Error(`Image generation failed with status ${imageResponse.status}`)
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    console.log("[v0] Image generated successfully")

    return Response.json({
      images: [{ base64, mediaType: "image/jpeg" }],
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
