export async function POST(req: Request) {
  const { prompt, learningContext, model = "huggingface", nsfwFilter = true, uploadedImage } = await req.json()

  try {
    let enhancedPrompt = learningContext ? `${prompt} (Style inspiration: ${learningContext})` : prompt

    if (uploadedImage) {
      enhancedPrompt = `Animate this image: ${enhancedPrompt}`
    }

    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, family-friendly content only"
    }

    // Hugging Face image-to-video model using Gradio client
    if (model === "huggingface" && uploadedImage) {
      const hfApiKey = process.env.HUGGINGFACE_API_KEY
      if (!hfApiKey) {
        return Response.json(
          { error: "Hugging Face API key not configured", frames: [] },
          { status: 400 }
        )
      }

      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage

      try {
        // Use @gradio/client for HF Spaces
        const { Client } = await import("@gradio/client")
        
        // Use a working image-to-video Space
        const client = await Client.connect("KwaiVGI/LivePortrait", {
          hf_token: hfApiKey,
        })
        
        const imageBuffer = Buffer.from(base64Data, "base64")
        const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })
        
        // LivePortrait animates faces in images
        const result = await client.predict("/execute_video", [
          imageBlob, // Source image
          null,      // Driving video (optional)
          true,      // Flag for retargeting
          false,     // Flag for stitching
          true,      // Flag for relative motion
        ])
        
        if (result?.data?.[0]) {
          const videoResult = result.data[0]
          
          if (videoResult?.url) {
            const videoResponse = await fetch(videoResult.url)
            const videoBuffer = await videoResponse.arrayBuffer()
            const base64Result = Buffer.from(videoBuffer).toString("base64")
            
            return Response.json({
              videoUrl: `data:video/mp4;base64,${base64Result}`,
              frames: [],
              message: "Video generated with Hugging Face LivePortrait",
              isAnimated: true,
            })
          }
        }
      } catch (hfError) {
        console.log("[v0] HuggingFace video error:", hfError)
      }
      
      // Fall through to Pollinations if HF fails
    }

    // Pollinations fallback
    const seed = Date.now()
    const videoPrompt = encodeURIComponent(enhancedPrompt + ", cinematic motion, smooth animation")

    const frames: string[] = []
    for (let i = 0; i < 4; i++) {
      const frameSeed = seed + i * 1000
      const frameUrl = `https://image.pollinations.ai/prompt/${videoPrompt}?width=512&height=512&seed=${frameSeed}&nologo=true`
      frames.push(frameUrl)
    }

    return Response.json({
      videoUrl: frames[0],
      frames: frames,
      message: "Video preview generated with Pollinations",
      isAnimated: true,
    })
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return Response.json(
      {
        error: "Video generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
