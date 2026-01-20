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

    if (uploadedImage) {
      enhancedPrompt = `Animate this image: ${enhancedPrompt}`
    }

    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, family-friendly content only"
    }

    const { Client } = await import("@gradio/client")

    // Image-to-video generation
    if (uploadedImage) {
      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage
      const imageBuffer = Buffer.from(base64Data, "base64")
      const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })

      // HuggingFace Premium Spaces for image-to-video
      const i2vSpaces = [
        { name: "Wan-AI/Wan2.1-I2V-14B-720P-Diffusers" },
        { name: "multimodalart/stable-video-diffusion" },
        { name: "KwaiVGI/LivePortrait" },
      ]

      for (const space of i2vSpaces) {
        try {
          const client = await Client.connect(space.name, { hf_token: hfApiKey })
          
          const apiInfo = await client.view_api()
          const endpoints = Object.keys(apiInfo.named_endpoints || {})
          
          if (endpoints.length === 0) continue
          
          const endpoint = endpoints.find(e => 
            e.includes("generate") || e.includes("video") || e.includes("infer") || e.includes("run")
          ) || endpoints[0]
          
          const result = await client.predict(endpoint, [imageBlob, enhancedPrompt])
          
          if (result?.data?.[0]) {
            const videoResult = result.data[0]
            
            if (videoResult?.url) {
              const videoResponse = await fetch(videoResult.url)
              const videoBuffer = await videoResponse.arrayBuffer()
              const base64Result = Buffer.from(videoBuffer).toString("base64")
              
              return Response.json({
                videoUrl: `data:video/mp4;base64,${base64Result}`,
                frames: [],
                message: `Video generated with HuggingFace (${space.name})`,
                isAnimated: true,
              })
            }
            
            if (typeof videoResult === "string" && videoResult.startsWith("http")) {
              const videoResponse = await fetch(videoResult)
              const videoBuffer = await videoResponse.arrayBuffer()
              const base64Result = Buffer.from(videoBuffer).toString("base64")
              
              return Response.json({
                videoUrl: `data:video/mp4;base64,${base64Result}`,
                frames: [],
                message: `Video generated with HuggingFace (${space.name})`,
                isAnimated: true,
              })
            }
          }
        } catch (spaceError) {
          console.log(`[v0] Space ${space.name} failed:`, spaceError)
          continue
        }
      }
    }

    // Text-to-video generation (no uploaded image)
    const t2vSpaces = [
      { name: "hpcai-tech/Open-Sora" },
      { name: "ali-vilab/VGen" },
    ]

    for (const space of t2vSpaces) {
      try {
        const client = await Client.connect(space.name, { hf_token: hfApiKey })
        
        const apiInfo = await client.view_api()
        const endpoints = Object.keys(apiInfo.named_endpoints || {})
        
        if (endpoints.length === 0) continue
        
        const endpoint = endpoints.find(e => 
          e.includes("generate") || e.includes("video") || e.includes("infer")
        ) || endpoints[0]
        
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
              message: `Video generated with HuggingFace (${space.name})`,
              isAnimated: true,
            })
          }
        }
      } catch (spaceError) {
        console.log(`[v0] Space ${space.name} failed:`, spaceError)
        continue
      }
    }

    return Response.json({
      error: "All HuggingFace video Spaces are currently unavailable. Please try again later.",
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
