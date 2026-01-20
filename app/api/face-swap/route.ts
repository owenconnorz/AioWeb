// Convert base64 to Blob (orientation handled client-side)
function base64ToBlob(base64Data: string): Blob {
  const imageBuffer = Buffer.from(base64Data, "base64")
  return new Blob([imageBuffer], { type: "image/jpeg" })
}

async function normalizeImageOrientation(base64Data: string): Promise<Blob> {
  // Placeholder function to simulate image orientation normalization
  // In a real scenario, this function would handle orientation normalization
  return base64ToBlob(base64Data);
}

export async function POST(req: Request) {
  const { sourceImage, targetImage } = await req.json()

  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      return Response.json(
        { error: "Hugging Face API key not configured. Please add HUGGINGFACE_API_KEY to environment variables." },
        { status: 400 }
      )
    }

    const sourceBase64 = sourceImage.includes(",") ? sourceImage.split(",")[1] : sourceImage
    const targetBase64 = targetImage.includes(",") ? targetImage.split(",")[1] : targetImage

    const { Client } = await import("@gradio/client")
    
    const sourceBlob = base64ToBlob(sourceBase64)
    const targetBlob = base64ToBlob(targetBase64)

    // HuggingFace Spaces for face swapping
    const faceSwapSpaces = [
      { 
        name: "felixrosberg/face-swap",
        endpoint: "/run_inference",
        args: (source: Blob, target: Blob) => [source, target]
      },
      { 
        name: "insightface/insightface",
        endpoint: "/swap",
        args: (source: Blob, target: Blob) => [source, target]
      },
    ]

    for (const space of faceSwapSpaces) {
      try {
        const client = await Client.connect(space.name, { hf_token: hfApiKey })
        
        // Try to discover endpoints
        const apiInfo = await client.view_api()
        const endpoints = Object.keys(apiInfo.named_endpoints || {})
        const endpoint = endpoints.find(e => 
          e.includes("swap") || e.includes("inference") || e.includes("run")
        ) || space.endpoint || endpoints[0]
        
        const result = await client.predict(endpoint, space.args(sourceBlob, targetBlob))
        
        if (result?.data?.[0]) {
          const resultImage = result.data[0]
          
          if (resultImage?.url) {
            const imgResponse = await fetch(resultImage.url)
            const imgBuffer = await imgResponse.arrayBuffer()
            const base64Result = Buffer.from(imgBuffer).toString("base64")
            
            return Response.json({
              resultImage: `data:image/png;base64,${base64Result}`,
              message: `Face swap completed with HuggingFace (${space.name})`,
            })
          }
          
          if (typeof resultImage === "string" && resultImage.startsWith("http")) {
            const imgResponse = await fetch(resultImage)
            const imgBuffer = await imgResponse.arrayBuffer()
            const base64Result = Buffer.from(imgBuffer).toString("base64")
            
            return Response.json({
              resultImage: `data:image/png;base64,${base64Result}`,
              message: `Face swap completed with HuggingFace (${space.name})`,
            })
          }
        }
      } catch (spaceError) {
        console.log(`[v0] Space ${space.name} failed:`, spaceError)
        continue
      }
    }

    return Response.json({
      error: "All HuggingFace face swap Spaces are currently unavailable. Please try again later.",
    }, { status: 500 })

  } catch (error) {
    console.error("[v0] Face swap error:", error)
    return Response.json({
      error: error instanceof Error ? error.message : "Face swap failed",
    }, { status: 500 })
  }
}
