export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "pollinations", nsfwFilter = true, uploadedImage } = await req.json()

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    // Hugging Face with Qwen Image Edit Space for TRUE image editing
    if (uploadedImage && model === "huggingface") {
      const hfApiKey = process.env.HUGGINGFACE_API_KEY
      if (!hfApiKey) {
        return Response.json(
          { error: "Hugging Face API key not configured. Please add HUGGINGFACE_API_KEY to environment variables.", images: [] },
          { status: 400 }
        )
      }

      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage

      // Use Qwen Image Edit Space via @gradio/client pattern
      // Space: prithivMLmods/Qwen-Image-Edit-2511-LoRAs-Fast
      const spaceUrl = "https://prithivmlmods-qwen-image-edit-2511-loras-fast.hf.space"
      
      try {
        // Import and use @gradio/client
        const { Client } = await import("@gradio/client")
        
        const client = await Client.connect("prithivMLmods/Qwen-Image-Edit-2511-LoRAs-Fast", {
          hf_token: hfApiKey,
        })
        
        // Create image in the Gallery format required by the Space
        // The API expects: images (Gallery), prompt, lora_adapter, seed, randomize_seed, guidance_scale, steps
        const imageBuffer = Buffer.from(base64Data, "base64")
        const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })
        
        // Call /infer endpoint with Gallery format for images parameter
        // Gallery expects: [{image: blob}] format
        const result = await client.predict("/infer", [
          [{ image: imageBlob }],  // Gallery format: array of {image: blob}
          enhancedPrompt,           // Edit prompt
          "Hyper-Realistic-Portrait", // LoRA - best for realistic edits
          0,                        // Seed
          true,                     // Randomize seed
          1,                        // Guidance scale
          4,                        // Inference steps
        ])
        
        if (result?.data?.[0]) {
          const resultImage = result.data[0]
          
          // If result is a URL, fetch it
          if (typeof resultImage === "string" && resultImage.startsWith("http")) {
            const imgResponse = await fetch(resultImage)
            const imgBuffer = await imgResponse.arrayBuffer()
            const base64Result = Buffer.from(imgBuffer).toString("base64")
            return Response.json({
              images: [{ base64: base64Result, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
          
          // If result has url property
          if (resultImage?.url) {
            const imgResponse = await fetch(resultImage.url)
            const imgBuffer = await imgResponse.arrayBuffer()
            const base64Result = Buffer.from(imgBuffer).toString("base64")
            return Response.json({
              images: [{ base64: base64Result, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
          
          // If result is already base64
          if (typeof resultImage === "string") {
            const base64Part = resultImage.includes(",") ? resultImage.split(",")[1] : resultImage
            return Response.json({
              images: [{ base64: base64Part, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
        }
      } catch (spaceError) {
        console.log("[v0] Qwen Image Edit Space error:", spaceError)
      }
      
      // Fall through to vision-based editing if Space fails
    }

    // If user uploaded an image AND selected image-editing model, use Vision API to analyze then generate modified version
    if (uploadedImage && model === "image-editing") {
      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage

      // Use Pollinations Vision API to get detailed description of the image
      const visionPayload = {
        model: "openai",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image in extreme detail. Describe:
1. The main subject: exact appearance, age estimate, gender, ethnicity, body type, height estimate
2. Face: hair color/style/length, eye color, facial features, makeup if any
3. Clothing: exact items, colors, style, fit
4. Pose: body position, hand placement, facial expression
5. Background: setting, objects, colors, atmosphere
6. Photography: lighting, camera angle, distance, style

Be extremely specific and detailed. This description will be used to recreate a similar image with modifications.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }

      try {
        const visionResponse = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(visionPayload),
          signal: AbortSignal.timeout(45000),
        })

        if (visionResponse.ok) {
          const visionData = await visionResponse.json()
          const imageDescription = visionData.choices?.[0]?.message?.content || ""

          // Create a detailed prompt that preserves the original image while applying edits
          enhancedPrompt = `RECREATE THIS EXACT IMAGE with one modification:

ORIGINAL IMAGE DESCRIPTION:
${imageDescription}

REQUIRED MODIFICATION: ${prompt}

Generate an image that looks exactly like the original description above, but with the modification applied. Keep ALL other details identical - same person, same pose, same background, same lighting, same camera angle. Only change what was specifically requested.`
        }
      } catch (e) {
        // If vision fails, use basic prompt
        enhancedPrompt = `Photo of a person. Apply this edit: ${prompt}. Photorealistic, high quality.`
      }
    }

    // Generate image using Pollinations (for new images or as fallback)
    const seed = Date.now()
    const width = 768
    const height = 768
    const safeParam = nsfwFilter ? "&safe=true" : ""
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true${safeParam}&model=flux`

    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(60000),
    })

    if (!imageResponse.ok) {
      throw new Error(`Image generation failed with status ${imageResponse.status}`)
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

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
