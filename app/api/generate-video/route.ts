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

    // Hugging Face image-to-video model
    if (model === "huggingface" && uploadedImage) {
      const hfApiKey = process.env.HUGGINGFACE_API_KEY
      if (!hfApiKey) {
        return Response.json(
          { error: "Hugging Face API key not configured", frames: [] },
          { status: 400 }
        )
      }

      const base64Data = uploadedImage.includes(",") ? uploadedImage.split(",")[1] : uploadedImage

      // Use Stable Video Diffusion for image-to-video
      const hfResponse = await fetch(
        "https://router.huggingface.co/hf-inference/models/stabilityai/stable-video-diffusion-img2vid-xt",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: base64Data,
            parameters: {
              num_frames: 8,
              fps: 4,
            }
          }),
          signal: AbortSignal.timeout(180000), // 3 minute timeout
        }
      )

      if (hfResponse.ok) {
        const contentType = hfResponse.headers.get("content-type")
        
        if (contentType?.includes("video") || contentType?.includes("image")) {
          const arrayBuffer = await hfResponse.arrayBuffer()
          const base64Result = Buffer.from(arrayBuffer).toString("base64")
          
          return Response.json({
            videoUrl: `data:video/mp4;base64,${base64Result}`,
            frames: [`data:image/png;base64,${base64Result}`],
            message: "Video generated with Hugging Face",
            isAnimated: true,
          })
        }
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
