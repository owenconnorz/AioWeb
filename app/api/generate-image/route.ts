// Convert base64 to Blob (orientation handled client-side)
function base64ToBlob(base64Data: string): Blob {
  const imageBuffer = Buffer.from(base64Data, "base64")
  return new Blob([imageBuffer], { type: "image/jpeg" })
}

// Function to normalize image orientation
async function normalizeImageOrientation(base64Data: string): Promise<Blob> {
  // Placeholder implementation for normalization
  // In a real scenario, this function would handle orientation normalization
  const imageBuffer = Buffer.from(base64Data, "base64")
  return new Blob([imageBuffer], { type: "image/jpeg" })
}

export async function POST(req: Request) {
  try {
    const { prompt, learningContext, nsfwFilter = true, uploadedImage } = await req.json()

    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      return Response.json(
        { error: "Hugging Face API key not configured. Please add HUGGINGFACE_API_KEY to environment variables.", images: [] },
        { status: 400 }
      )
    }

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    // Only add SFW modifier when filter is ON
    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, family-friendly content only"
    }

    const { Client } = await import("@gradio/client")

    // Image editing with uploaded image
    if (uploadedImage) {
      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage
      
      const imageBlob = base64ToBlob(base64Data)

      // HuggingFace Spaces for image editing
      const editSpaces = [
        { 
          name: "prithivMLmods/Qwen-Image-Edit-2511-LoRAs-Fast",
          endpoint: "/infer",
          args: (blob: Blob, prompt: string) => [
            [{ image: blob }],  // Gallery format
            prompt,
            "Hyper-Realistic-Portrait",
            0, true, 1, 4
          ]
        },
        {
          name: "diffusers/stable-diffusion-xl-inpainting",
          endpoint: "/inpaint",
          args: (blob: Blob, prompt: string) => [blob, prompt]
        },
      ]

      for (const space of editSpaces) {
        try {
          const client = await Client.connect(space.name, { hf_token: hfApiKey })
          
          const result = await client.predict(space.endpoint, space.args(imageBlob, enhancedPrompt))
          
          if (result?.data?.[0]) {
            const resultImage = result.data[0]
            
            if (typeof resultImage === "string" && resultImage.startsWith("http")) {
              const imgResponse = await fetch(resultImage)
              const imgBuffer = await imgResponse.arrayBuffer()
              const base64Result = Buffer.from(imgBuffer).toString("base64")
              return Response.json({
                images: [{ base64: base64Result, mediaType: "image/png" }],
                prompt: enhancedPrompt,
              })
            }
            
            if (resultImage?.url) {
              const imgResponse = await fetch(resultImage.url)
              const imgBuffer = await imgResponse.arrayBuffer()
              const base64Result = Buffer.from(imgBuffer).toString("base64")
              return Response.json({
                images: [{ base64: base64Result, mediaType: "image/png" }],
                prompt: enhancedPrompt,
              })
            }
            
            if (typeof resultImage === "string") {
              const base64Part = resultImage.includes(",") ? resultImage.split(",")[1] : resultImage
              return Response.json({
                images: [{ base64: base64Part, mediaType: "image/png" }],
                prompt: enhancedPrompt,
              })
            }
          }
        } catch (spaceError) {
          continue
        }
      }
    }

    // Text-to-image generation (no uploaded image)
    // NSFW-capable spaces (used when nsfwFilter is OFF)
    const nsfwSpaces = [
      {
        name: "Heartsync/NSFW-Uncensored-image",
        endpoint: "/infer",
        args: (prompt: string) => [prompt, "low quality, blurry, distorted", 0, true, 1024, 1024, 7.5, 30],
      },
      {
        name: "Heartsync/NSFW-Uncensored",
        endpoint: "/infer", 
        args: (prompt: string) => [prompt, "low quality, blurry", 0, true, 1024, 1024, 7.5, 30],
      },
      {
        name: "Heartsync/NSFW-image",
        endpoint: "/infer",
        args: (prompt: string) => [prompt, "low quality, blurry", 0, true, 1024, 1024, 7.5, 30],
      },
      {
        name: "grayscale1/nsfw-generator",
        endpoint: "/predict",
        args: (prompt: string) => [prompt, "low quality", 0, true, 1024, 1024],
      },
    ]
    
    // SFW spaces (used when nsfwFilter is ON)
    const sfwSpaces = [
      { 
        name: "black-forest-labs/FLUX.1-schnell",
        endpoint: "/infer",
        args: (prompt: string) => [prompt, 0, true, 1024, 1024, 4, 1],
      },
      { 
        name: "stabilityai/stable-diffusion-3-medium",
        endpoint: "/infer",
        args: (prompt: string) => [prompt, "low quality, blurry", 0, true, 1024, 1024, 4.5, 28],
      },
      {
        name: "multimodalart/FLUX.1-merged",
        endpoint: "/predict",
        args: (prompt: string) => [prompt, 0, true, 1024, 1024, 4],
      },
    ]
    
    // Choose spaces based on NSFW filter setting
    const t2iSpaces = nsfwFilter ? sfwSpaces : [...nsfwSpaces, ...sfwSpaces]

    console.log("[v0] Starting image generation with prompt:", enhancedPrompt.substring(0, 100), "NSFW filter:", nsfwFilter)

    for (const space of t2iSpaces) {
      try {
        console.log("[v0] Trying space:", space.name)
        
        const client = await Client.connect(space.name, { hf_token: hfApiKey })
        
        console.log("[v0] Connected to space:", space.name)
        
        // Try to get API info to find correct endpoint
        let endpoint = space.endpoint
        let args = space.args(enhancedPrompt)
        
        try {
          const apiInfo = await client.view_api()
          console.log("[v0] API endpoints:", Object.keys(apiInfo.named_endpoints || {}))
          const endpoints = Object.keys(apiInfo.named_endpoints || {})
          if (endpoints.length > 0 && !endpoints.includes(endpoint)) {
            endpoint = endpoints.find(e => 
              e.includes("infer") || e.includes("generate") || e.includes("query") || e.includes("predict")
            ) || endpoints[0]
            console.log("[v0] Using endpoint:", endpoint)
          }
        } catch (apiErr) {
          console.log("[v0] Could not get API info, using default endpoint")
        }
        
        console.log("[v0] Calling predict with endpoint:", endpoint)
        const result = await client.predict(endpoint, args)
        
        console.log("[v0] Result received:", JSON.stringify(result?.data?.[0]).substring(0, 200))
        
        if (result?.data?.[0]) {
          const resultImage = result.data[0]
          
          if (typeof resultImage === "string" && resultImage.startsWith("http")) {
            const imgResponse = await fetch(resultImage)
            const imgBuffer = await imgResponse.arrayBuffer()
            const base64Result = Buffer.from(imgBuffer).toString("base64")
            console.log("[v0] Success from space:", space.name)
            return Response.json({
              images: [{ base64: base64Result, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
          
          if (resultImage?.url) {
            const imgResponse = await fetch(resultImage.url)
            const imgBuffer = await imgResponse.arrayBuffer()
            const base64Result = Buffer.from(imgBuffer).toString("base64")
            console.log("[v0] Success from space:", space.name)
            return Response.json({
              images: [{ base64: base64Result, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
          
          // Handle base64 directly in result
          if (typeof resultImage === "string" && resultImage.length > 100) {
            const base64Part = resultImage.includes(",") ? resultImage.split(",")[1] : resultImage
            console.log("[v0] Success (base64) from space:", space.name)
            return Response.json({
              images: [{ base64: base64Part, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
        }
      } catch (spaceError) {
        console.log("[v0] Space error:", space.name, spaceError instanceof Error ? spaceError.message : String(spaceError))
        continue
      }
    }

    return Response.json({
      error: "All HuggingFace image Spaces are currently unavailable. Please try again later.",
      images: [],
    }, { status: 500 })

  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate image",
        images: [],
      },
      { status: 500 },
    )
  }
}
