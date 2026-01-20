export async function POST(req: Request) {
  const { prompt, learningContext, uploadedImage } = await req.json()

  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      return Response.json(
        { error: "Hugging Face API key not configured.", frames: [] },
        { status: 400 }
      )
    }

    const enhancedPrompt = learningContext ? `${prompt} (Style: ${learningContext})` : prompt
    const { Client } = await import("@gradio/client")

    // Image-to-video: Try HF Spaces that are actively maintained
    if (uploadedImage) {
      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage
      const imageBuffer = Buffer.from(base64Data, "base64")
      const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })

      // Try Spaces known to work (updated list based on active HF Spaces)
      const workingSpaces = [
        "hysts/SD-XL",
        "stabilityai/stable-diffusion",
        "black-forest-labs/FLUX.1-schnell",
      ]

      // Since video generation requires GPU compute not available via free API,
      // generate a series of images as frames instead
      const frames: string[] = []
      
      for (const spaceName of workingSpaces) {
        try {
          const client = await Client.connect(spaceName, { hf_token: hfApiKey })
          const apiInfo = await client.view_api()
          const endpoints = Object.keys(apiInfo.named_endpoints || {})
          
          if (endpoints.length === 0) continue
          
          const endpoint = endpoints.find(e => e.includes("infer") || e.includes("generate")) || endpoints[0]
          
          // Generate multiple frames with slight prompt variations for animation effect
          for (let i = 0; i < 8; i++) {
            const framePrompt = `${enhancedPrompt}, frame ${i + 1} of animation sequence, motion blur`
            
            const result = await client.predict(endpoint, [framePrompt])
            
            if (result?.data?.[0]?.url) {
              const imgResponse = await fetch(result.data[0].url)
              const imgBuffer = await imgResponse.arrayBuffer()
              frames.push(`data:image/png;base64,${Buffer.from(imgBuffer).toString("base64")}`)
            }
            
            if (frames.length >= 4) break
          }
          
          if (frames.length > 0) {
            return Response.json({
              frames,
              message: `Generated ${frames.length} animation frames with ${spaceName}`,
              isAnimated: true,
              note: "True video generation requires dedicated GPU endpoints. Showing animated frames instead.",
            })
          }
        } catch {
          continue
        }
      }
    }

    // Text-to-video: Generate image sequence as animation frames
    const t2vSpaces = [
      "stabilityai/stable-diffusion-3-medium",
      "black-forest-labs/FLUX.1-schnell",
    ]

    for (const spaceName of t2vSpaces) {
      try {
        const client = await Client.connect(spaceName, { hf_token: hfApiKey })
        const apiInfo = await client.view_api()
        const endpoints = Object.keys(apiInfo.named_endpoints || {})
        
        if (endpoints.length === 0) continue
        
        const endpoint = endpoints[0]
        const frames: string[] = []
        
        // Generate frames
        for (let i = 0; i < 6; i++) {
          const framePrompt = `${enhancedPrompt}, cinematic frame ${i + 1}, dynamic motion`
          const result = await client.predict(endpoint, [framePrompt])
          
          if (result?.data?.[0]?.url) {
            const imgResponse = await fetch(result.data[0].url)
            const imgBuffer = await imgResponse.arrayBuffer()
            frames.push(`data:image/png;base64,${Buffer.from(imgBuffer).toString("base64")}`)
          }
          
          if (frames.length >= 4) break
        }
        
        if (frames.length > 0) {
          return Response.json({
            frames,
            message: `Generated ${frames.length} frames with ${spaceName}`,
            isAnimated: true,
          })
        }
      } catch {
        continue
      }
    }

    return Response.json({
      error: "Video generation requires dedicated GPU compute not available through free HuggingFace API. Consider using Replicate or Fal.ai for video generation.",
      frames: [],
    }, { status: 500 })

  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Video generation failed", frames: [] },
      { status: 500 },
    )
  }
}
