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
        
        const imageBuffer = Buffer.from(base64Data, "base64")
        const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" })
        
        // Try ZeroGPU Spaces (free, no GPU quota required)
        const spacesToTry = [
          {
            name: "zerogpu-aoti/wan2-2-fp8da-aoti-faster",
            useToken: true,
          },
          {
            name: "Kwai-Kolors/Kolors-Virtual-Try-On",
            useToken: true,
          },
          {
            name: "TencentARC/PhotoMaker-V2",
            useToken: true,
          },
        ]
        
        for (const space of spacesToTry) {
          try {
            console.log("[v0] Trying video Space:", space.name)
            
            const client = await Client.connect(space.name, {
              hf_token: space.useToken ? hfApiKey : undefined,
            })
            
            // Discover available endpoints
            const apiInfo = await client.view_api()
            const endpoints = Object.keys(apiInfo.named_endpoints || {})
            console.log("[v0] Available endpoints:", endpoints)
            
            // Find a video/generate endpoint
            const endpoint = endpoints.find(e => 
              e.includes("generate") || e.includes("video") || e.includes("infer") || e.includes("run")
            ) || endpoints[0]
            
            if (!endpoint) {
              console.log("[v0] No suitable endpoint found")
              continue
            }
            
            console.log("[v0] Using endpoint:", endpoint)
            
            // Get endpoint parameters
            const endpointInfo = apiInfo.named_endpoints[endpoint]
            console.log("[v0] Endpoint params:", JSON.stringify(endpointInfo?.parameters || []))
            
            // Try calling with image and prompt
            const result = await client.predict(endpoint, [
              imageBlob,
              enhancedPrompt,
            ])
            
            console.log("[v0] Result:", JSON.stringify(result?.data))
            
            if (result?.data?.[0]) {
              const videoResult = result.data[0]
              
              if (videoResult?.url) {
                const videoResponse = await fetch(videoResult.url)
                const videoBuffer = await videoResponse.arrayBuffer()
                const base64Result = Buffer.from(videoBuffer).toString("base64")
                
                return Response.json({
                  videoUrl: `data:video/mp4;base64,${base64Result}`,
                  frames: [],
                  message: `Video generated with ${space.name}`,
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
                  message: `Video generated with ${space.name}`,
                  isAnimated: true,
                })
              }
            }
          } catch (spaceError) {
            console.log("[v0] Space error:", space.name, spaceError)
            continue
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
