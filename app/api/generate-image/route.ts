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
    // Use public spaces that don't require authentication first
    const t2iSpaces = [
      { 
        name: "stabilityai/stable-diffusion-3.5-large",
        endpoint: "/infer",
        requiresAuth: true,
      },
      { 
        name: "black-forest-labs/FLUX.1-schnell",
        endpoint: "/infer",
        requiresAuth: true,
      },
      {
        name: "prodia/sdxl-stable-diffusion-xl",
        endpoint: "/predict",
        requiresAuth: false,
      },
      {
        name: "hysts/SD-XL",
        endpoint: "/run",
        requiresAuth: false,
      },
    ]

    for (const space of t2iSpaces) {
      try {
        // Try without auth first for public spaces, then with auth
        let client;
        try {
          if (space.requiresAuth) {
            client = await Client.connect(space.name, { hf_token: hfApiKey })
          } else {
            client = await Client.connect(space.name)
          }
        } catch (connectError) {
          // If connection fails, try the opposite auth approach
          try {
            if (space.requiresAuth) {
              client = await Client.connect(space.name)
            } else {
              client = await Client.connect(space.name, { hf_token: hfApiKey })
            }
          } catch {
            throw connectError
          }
        }
        
        // Try to get API info to find correct endpoint
        let endpoint = space.endpoint
        try {
          const apiInfo = await client.view_api()
          const endpoints = Object.keys(apiInfo.named_endpoints || {})
          endpoint = endpoints.find(e => 
            e.includes("infer") || e.includes("generate") || e.includes("run") || e.includes("predict")
          ) || space.endpoint || endpoints[0]
        } catch {
          // Use default endpoint if view_api fails
        }
        
        const result = await client.predict(endpoint, [
          enhancedPrompt,
          "blurry, low quality, distorted", // negative prompt
          Math.floor(Math.random() * 1000000), // seed
        ])
        
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
        }
      } catch (spaceError) {
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
