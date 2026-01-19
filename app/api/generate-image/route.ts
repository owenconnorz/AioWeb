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

      // Use Qwen Image Edit Space via Gradio API - this model actually edits images
      // Space: prithivMLmods/Qwen-Image-Edit-2511-LoRAs-Fast
      const spaceUrl = "https://prithivmlmods-qwen-image-edit-2511-loras-fast.hf.space"
      
      try {
        // Use the Gradio Client API format - call specific function by index
        // First, try to get the space config to find available API endpoints
        const configResponse = await fetch(`${spaceUrl}/config`, {
          headers: { "Authorization": `Bearer ${hfApiKey}` },
        })
        
        let apiName = "generate" // Common function name for image generation spaces
        if (configResponse.ok) {
          const config = await configResponse.json()
          // Find the first callable function
          if (config.dependencies) {
            for (const dep of config.dependencies) {
              if (dep.api_name) {
                apiName = dep.api_name.replace("/", "")
                break
              }
            }
          }
        }

        // Call the Gradio API with the correct function name
        const callResponse = await fetch(`${spaceUrl}/gradio_api/call/${apiName}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: [
              { path: `data:image/jpeg;base64,${base64Data}`, meta: { _type: "gradio.FileData" } },
              enhancedPrompt,
              "Hyper-SDXL",
            ],
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (callResponse.ok) {
          const callData = await callResponse.json()
          const eventId = callData.event_id

          if (eventId) {
            // Get result from SSE endpoint
            const resultResponse = await fetch(`${spaceUrl}/gradio_api/call/${apiName}/${eventId}`, {
              headers: { "Authorization": `Bearer ${hfApiKey}` },
              signal: AbortSignal.timeout(180000),
            })

            if (resultResponse.ok) {
              const resultText = await resultResponse.text()
              const lines = resultText.split("\n")
              
              for (const line of lines) {
                if (line.startsWith("data:")) {
                  const jsonStr = line.slice(5).trim()
                  if (jsonStr) {
                    try {
                      const data = JSON.parse(jsonStr)
                      if (data && Array.isArray(data) && data[0]) {
                        const resultImage = data[0]
                        
                        if (typeof resultImage === "string" && resultImage.startsWith("http")) {
                          const imgResponse = await fetch(resultImage)
                          const imgBuffer = await imgResponse.arrayBuffer()
                          const base64Result = Buffer.from(imgBuffer).toString("base64")
                          return Response.json({
                            images: [{ base64: base64Result, mediaType: "image/png" }],
                            prompt: enhancedPrompt,
                          })
                        }
                        if (typeof resultImage === "object" && resultImage.url) {
                          const imgUrl = resultImage.url.startsWith("http") ? resultImage.url : `${spaceUrl}/file=${resultImage.path || resultImage.url}`
                          const imgResponse = await fetch(imgUrl, {
                            headers: { "Authorization": `Bearer ${hfApiKey}` },
                          })
                          const imgBuffer = await imgResponse.arrayBuffer()
                          const base64Result = Buffer.from(imgBuffer).toString("base64")
                          return Response.json({
                            images: [{ base64: base64Result, mediaType: "image/png" }],
                            prompt: enhancedPrompt,
                          })
                        }
                      }
                    } catch {}
                  }
                }
              }
            }
          }
        } else {
          // Fallback: Try queue/push format
          const queueResponse = await fetch(`${spaceUrl}/queue/push`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: [
                `data:image/jpeg;base64,${base64Data}`,
                enhancedPrompt,
                "Hyper-SDXL",
              ],
              fn_index: 0,
              session_hash: Math.random().toString(36).substring(7),
            }),
            signal: AbortSignal.timeout(30000),
          })
          
          if (queueResponse.ok) {
            const queueData = await queueResponse.json()
            const eventId = queueData.event_id
            
            if (eventId) {
              // Poll with SSE
              const statusResponse = await fetch(`${spaceUrl}/queue/data?session_hash=${queueData.session_hash}`, {
                headers: { "Authorization": `Bearer ${hfApiKey}` },
                signal: AbortSignal.timeout(180000),
              })
              
              if (statusResponse.ok) {
                const statusText = await statusResponse.text()
                const lines = statusText.split("\n")
                
                for (const line of lines) {
                  if (line.startsWith("data:")) {
                    try {
                      const data = JSON.parse(line.slice(5).trim())
                      if (data.msg === "process_completed" && data.output?.data?.[0]) {
                        const resultImage = data.output.data[0]
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
                    } catch {}
                  }
                }
              }
            }
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
