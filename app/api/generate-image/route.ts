export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "perchance", nsfwFilter = true, uploadedImage } = await req.json()

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

    if (model === "promptchan") {
      try {
        const apiKey = process.env.PROMPTCHAN_API_KEY

        if (!apiKey) {
          throw new Error("PromptChan API key not found. Please add PROMPTCHAN_API_KEY to your environment variables.")
        }

        const requestBody: any = {
          prompt: nsfwFilter ? enhancedPrompt : prompt,
          style: "realistic",
          width: 512,
          height: 512,
        }

        if (uploadedImage) {
          requestBody.init_image = uploadedImage
          requestBody.strength = 0.75 // How much to modify the original (0-1)
        }

        const response = await fetch("https://api.promptchan.ai/v1/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`PromptChan API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.image_url) {
          const imageResponse = await fetch(data.image_url)
          const arrayBuffer = await imageResponse.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString("base64")

          return Response.json({
            images: [
              {
                base64: base64,
                mediaType: "image/jpeg",
              },
            ],
            prompt: enhancedPrompt,
          })
        }
      } catch (error) {
        console.error("[v0] PromptChan error:", error)
        return Response.json(
          {
            error: error instanceof Error ? error.message : "PromptChan generation failed",
            images: [],
          },
          { status: 500 },
        )
      }
    }

    const imageCount = 1
    const images = []

    for (let i = 0; i < imageCount; i++) {
      const seed = Date.now() + i
      const safeParam = nsfwFilter ? "&safe=true" : ""

      if (uploadedImage) {
        // For image editing, we'll use a combination approach
        // Note: Pollinations doesn't support direct image-to-image, so we enhance the prompt
        const editPrompt = `Based on a photo: ${enhancedPrompt}. Keep similar composition, lighting, and style as the original reference.`
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=512&height=512&seed=${seed}&nologo=true${safeParam}`

        const imageResponse = await fetch(imageUrl)
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString("base64")

          images.push({
            base64: base64,
            mediaType: "image/jpeg",
          })
        }
      } else {
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
