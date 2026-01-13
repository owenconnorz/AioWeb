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

    if (model === "grok") {
      try {
        if (uploadedImage) {
          throw new Error(
            "Grok AI does not support image editing. Please use PromptChan AI for editing uploaded images.",
          )
        }

        console.log("[v0] Using Grok AI for image generation")

        const response = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.XAI_API_KEY || ""}`,
          },
          body: JSON.stringify({
            model: "grok-2-image",
            prompt: enhancedPrompt,
            n: 1,
            response_format: "b64_json",
          }),
        })

        const responseText = await response.text()
        console.log("[v0] Grok response status:", response.status)

        if (!response.ok) {
          throw new Error(
            `Grok API error (${response.status}): ${responseText}. You may need to add XAI_API_KEY to environment variables.`,
          )
        }

        const data = JSON.parse(responseText)

        if (data.data && data.data.length > 0) {
          return Response.json({
            images: data.data.map((img: any) => ({
              base64: img.b64_json,
              mediaType: "image/jpeg",
            })),
            prompt: data.data[0]?.revised_prompt || enhancedPrompt,
          })
        } else {
          throw new Error("Grok did not return any images")
        }
      } catch (error) {
        console.error("[v0] Grok error:", error)
        return Response.json(
          {
            error: error instanceof Error ? error.message : "Grok generation failed",
            images: [],
          },
          { status: 500 },
        )
      }
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
        console.log("[v0] API Key (first 10 chars):", apiKey.substring(0, 10))

        const requestBody: any = {
          prompt: nsfwFilter ? enhancedPrompt : prompt,
          negative_prompt: nsfwFilter ? "nsfw, nude, explicit, inappropriate" : "",
          model: "flux-realism",
          num_images: 1,
          width: 512,
          height: 512,
          guidance_scale: 7.5,
          num_inference_steps: 30,
        }

        if (uploadedImage) {
          const base64Data = uploadedImage.replace(/^data:image\/\w+;base64,/, "")
          requestBody.image = base64Data
          requestBody.strength = 0.75
          console.log("[v0] PromptChan: Image-to-image editing request")
          console.log("[v0] Uploaded image length:", base64Data.length)
        } else {
          console.log("[v0] PromptChan: Text-to-image generation")
        }

        console.log("[v0] Request body keys:", Object.keys(requestBody))

        const response = await fetch("https://api.promptchan.ai/v2/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(requestBody),
        })

        const responseText = await response.text()
        console.log("[v0] PromptChan response status:", response.status)
        console.log("[v0] PromptChan response (first 500 chars):", responseText.substring(0, 500))

        if (!response.ok) {
          console.error("[v0] PromptChan full error:", responseText)
          throw new Error(`PromptChan API error (${response.status}): ${responseText}`)
        }

        const data = JSON.parse(responseText)
        console.log("[v0] Parsed response keys:", Object.keys(data))

        const imageUrl = data.images?.[0]?.url || data.image_url || data.url || data.output?.[0]

        if (imageUrl) {
          console.log("[v0] Fetching image from URL:", imageUrl.substring(0, 50))
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
          console.error("[v0] No image URL in PromptChan response. Full data:", JSON.stringify(data, null, 2))
          throw new Error(
            "PromptChan did not return an image URL. The API might have changed or there's an authentication issue.",
          )
        }
      } catch (error) {
        console.error("[v0] PromptChan detailed error:", error)
        return Response.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "PromptChan generation failed. Check console for details or verify your API key.",
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
