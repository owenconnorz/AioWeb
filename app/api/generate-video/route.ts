export async function POST(req: Request) {
  const { prompt, learningContext, nsfwFilter = true, uploadedImage } = await req.json()

  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      return Response.json(
        { error: "Hugging Face API key not configured. Please add HUGGINGFACE_API_KEY to environment variables.", frames: [] },
        { status: 400 }
      )
    }

    let enhancedPrompt = learningContext ? `${prompt} (Style inspiration: ${learningContext})` : prompt

    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, family-friendly content only"
    }

    // Use HuggingFace Inference API directly (works better with premium accounts)
    const HF_INFERENCE_URL = "https://api-inference.huggingface.co/models"
    
    // Image-to-video using Inference API
    if (uploadedImage) {
      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage
      const imageBuffer = Buffer.from(base64Data, "base64")

      // Try Stable Video Diffusion via Inference API
      const i2vModels = [
        "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
        "stabilityai/stable-video-diffusion-img2vid-xt",
        "stabilityai/stable-video-diffusion-img2vid",
      ]

      for (const model of i2vModels) {
        try {
          const response = await fetch(`${HF_INFERENCE_URL}/${model}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: imageBuffer.toString("base64"),
              parameters: {
                num_frames: 25,
                fps: 8,
              }
            }),
          })

          if (response.ok) {
            const videoBuffer = await response.arrayBuffer()
            const base64Result = Buffer.from(videoBuffer).toString("base64")
            
            return Response.json({
              videoUrl: `data:video/mp4;base64,${base64Result}`,
              frames: [],
              message: `Video generated with ${model}`,
              isAnimated: true,
            })
          }
        } catch {
          continue
        }
      }

      // Fallback: Try public Gradio Spaces that don't require auth
      const { Client } = await import("@gradio/client")
      
      const publicSpaces = [
        "fffiloni/Image-to-GIF",
        "fffiloni/AnimateDiff-Image-to-Video",
      ]

      for (const spaceName of publicSpaces) {
        try {
          // Connect without token for public spaces
          const client = await Client.connect(spaceName)
          
          const apiInfo = await client.view_api()
          const endpoints = Object.keys(apiInfo.named_endpoints || {})
          
          if (endpoints.length === 0) continue
          
          const endpoint = endpoints.find(e => 
            e.includes("predict") || e.includes("generate") || e.includes("run")
          ) || endpoints[0]
          
          const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })
          
          // Try different parameter combinations
          let result
          try {
            result = await client.predict(endpoint, [imageBlob, enhancedPrompt])
          } catch {
            try {
              result = await client.predict(endpoint, [imageBlob])
            } catch {
              result = await client.predict(endpoint, { image: imageBlob, prompt: enhancedPrompt })
            }
          }
          
          if (result?.data?.[0]) {
            const videoResult = result.data[0]
            
            if (videoResult?.url) {
              const videoResponse = await fetch(videoResult.url)
              const videoBuffer = await videoResponse.arrayBuffer()
              const base64Result = Buffer.from(videoBuffer).toString("base64")
              
              const isGif = videoResult.url.includes(".gif") || spaceName.includes("GIF")
              
              return Response.json({
                videoUrl: `data:${isGif ? "image/gif" : "video/mp4"};base64,${base64Result}`,
                frames: [],
                message: `Animation generated with ${spaceName}`,
                isAnimated: true,
              })
            }
          }
        } catch {
          continue
        }
      }
    }

    // Text-to-video generation
    const t2vModels = [
      "ali-vilab/text-to-video-ms-1.7b",
      "damo-vilab/text-to-video-ms-1.7b",
    ]

    for (const model of t2vModels) {
      try {
        const response = await fetch(`${HF_INFERENCE_URL}/${model}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              num_frames: 16,
            }
          }),
        })

        if (response.ok) {
          const videoBuffer = await response.arrayBuffer()
          const base64Result = Buffer.from(videoBuffer).toString("base64")
          
          return Response.json({
            videoUrl: `data:video/mp4;base64,${base64Result}`,
            frames: [],
            message: `Video generated with ${model}`,
            isAnimated: true,
          })
        }
      } catch {
        continue
      }
    }

    // Final fallback: Try public T2V Spaces
    const { Client } = await import("@gradio/client")
    
    const publicT2VSpaces = [
      "fffiloni/AnimateDiff",
      "Vchitect/LaVie",
    ]

    for (const spaceName of publicT2VSpaces) {
      try {
        const client = await Client.connect(spaceName)
        
        const apiInfo = await client.view_api()
        const endpoints = Object.keys(apiInfo.named_endpoints || {})
        
        if (endpoints.length === 0) continue
        
        const endpoint = endpoints[0]
        
        const result = await client.predict(endpoint, [enhancedPrompt])
        
        if (result?.data?.[0]) {
          const videoResult = result.data[0]
          
          if (videoResult?.url) {
            const videoResponse = await fetch(videoResult.url)
            const videoBuffer = await videoResponse.arrayBuffer()
            const base64Result = Buffer.from(videoBuffer).toString("base64")
            
            return Response.json({
              videoUrl: `data:video/mp4;base64,${base64Result}`,
              frames: [],
              message: `Video generated with ${spaceName}`,
              isAnimated: true,
            })
          }
        }
      } catch {
        continue
      }
    }

    return Response.json({
      error: "Video generation is currently unavailable. Please try again later.",
      frames: [],
    }, { status: 500 })

  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Video generation failed",
        frames: [],
      },
      { status: 500 },
    )
  }
}
