export async function POST(req: Request) {
  try {
    const { prompt, learningContext, model = "pollinations", nsfwFilter = true, uploadedImage } = await req.json()

    let enhancedPrompt = prompt
    if (learningContext) {
      enhancedPrompt = `${prompt}. Style inspiration: ${learningContext}`
    }

    // If user uploaded an image, use Hugging Face's instruct-pix2pix for REAL image editing
    if (uploadedImage) {
      // Extract base64 data from data URL
      const base64Data = uploadedImage.includes(',') ? uploadedImage.split(',')[1] : uploadedImage
      
      // Convert base64 to binary buffer
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      // Use Hugging Face Inference API with instruct-pix2pix model for true image editing
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              image: base64Data,
              prompt: enhancedPrompt,
            },
            parameters: {
              num_inference_steps: 20,
              image_guidance_scale: 1.5,
              guidance_scale: 7.5,
            }
          }),
          signal: AbortSignal.timeout(120000), // 2 minute timeout for HF
        }
      )

      if (hfResponse.ok) {
        const contentType = hfResponse.headers.get('content-type')
        
        if (contentType?.includes('image')) {
          // Direct image response
          const arrayBuffer = await hfResponse.arrayBuffer()
          const base64Result = Buffer.from(arrayBuffer).toString("base64")
          
          return Response.json({
            images: [{ base64: base64Result, mediaType: "image/png" }],
            prompt: enhancedPrompt,
          })
        } else {
          // JSON response with image data
          const data = await hfResponse.json()
          if (data.error) {
            throw new Error(data.error)
          }
          // Sometimes HF returns base64 in the response
          if (data.image || data[0]) {
            const imageData = data.image || data[0]
            return Response.json({
              images: [{ base64: imageData, mediaType: "image/png" }],
              prompt: enhancedPrompt,
            })
          }
        }
      }
      
      // If HF fails, fall back to alternative method using fal.ai free tier
      const falResponse = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: `data:image/jpeg;base64,${base64Data}`,
          prompt: enhancedPrompt,
          strength: 0.75,
          num_inference_steps: 28,
        }),
        signal: AbortSignal.timeout(60000),
      })
      
      if (falResponse.ok) {
        const falData = await falResponse.json()
        if (falData.images?.[0]?.url) {
          const imgResponse = await fetch(falData.images[0].url)
          const imgBuffer = await imgResponse.arrayBuffer()
          const base64Result = Buffer.from(imgBuffer).toString("base64")
          
          return Response.json({
            images: [{ base64: base64Result, mediaType: "image/png" }],
            prompt: enhancedPrompt,
          })
        }
      }
      
      // Final fallback: Use Pollinations with detailed description
      const visionPayload = {
        model: "openai",
        messages: [{
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Describe this image in extreme detail: the exact person (age, gender, ethnicity, body type, hair color/style, facial features), their exact pose, clothing, the background, lighting, camera angle. Be very specific.`
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` }
            }
          ]
        }],
        max_tokens: 1500
      }

      const visionResponse = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visionPayload),
        signal: AbortSignal.timeout(30000),
      })

      if (visionResponse.ok) {
        const visionData = await visionResponse.json()
        const imageDescription = visionData.choices?.[0]?.message?.content || ""
        enhancedPrompt = `${imageDescription}. IMPORTANT MODIFICATION: ${prompt}. Keep everything else exactly the same.`
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
