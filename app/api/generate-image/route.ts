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
        const apiKey = process.env.PROMPTCHAN_API_KEY || "VBp5UK7A2CUBztsY4SUUHw"

        if (!apiKey) {
          throw new Error(
            "PromptChan API key not configured. Please add your API key in the Vars section of v0 settings.",
          )
        }

        console.log("[v0] Using PromptChan API")

        const requestBody: any = {
          prompt: nsfwFilter ? enhancedPrompt : prompt,
          model: "realistic-v1",
          width: 512,
          height: 512,
          steps: 30,
          guidance_scale: 7.5,
        }

        if (uploadedImage) {
          // Remove data URL prefix if present
          const base64Data = uploadedImage.replace(/^data:image\/\w+;base64,/, "")
          requestBody.init_image = base64Data
          requestBody.strength = 0.65 // Balance between preserving original and making changes
          console.log("[v0] PromptChan: Sending image-to-image request")
        } else {
          console.log("[v0] PromptChan: Sending text-to-image request")
        }

        const response = await fetch("https://api.promptchan.ai/v1/images/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        })

        const responseText = await response.text()
        console.log("[v0] PromptChan response status:", response.status)
        console.log("[v0] PromptChan response:", responseText.substring(0, 200))

        if (!response.ok) {
          throw new Error(`PromptChan API error (${response.status}): ${responseText}`)
        }

        const data = JSON.parse(responseText)

        // Handle different response formats
        const imageUrl = data.image_url || data.images?.[0]?.url || data.url

        if (imageUrl) {
          const imageResponse = await fetch(imageUrl)
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
        } else {
          console.error("[v0] No image URL in PromptChan response:", data)
          throw new Error("PromptChan did not return an image URL")
        }
      } catch (error) {
        console.error("[v0] PromptChan error:", error)
        return Response.json(
          {
            error: error instanceof Error ? error.message : "PromptChan generation failed. Please check your API key.",
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
