// POST: Start a new video generation (returns prediction ID immediately)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = body?.prompt || ""
    const learningContext = body?.learningContext || ""
    const uploadedImage = body?.uploadedImage || null

    const replicateToken = process.env.REPLICATE_API_TOKEN
    if (!replicateToken) {
      return Response.json(
        { error: "Replicate API token not configured. Please add REPLICATE_API_TOKEN to environment variables." },
        { status: 400 }
      )
    }

    const enhancedPrompt = learningContext ? `${prompt} (Style: ${learningContext})` : prompt

    // Use minimax/video-01 (Hailuo) - reliable text-to-video and image-to-video model
    const input: Record<string, string | number> = {
      prompt: enhancedPrompt,
    }

    // If image is uploaded, use image-to-video mode
    if (uploadedImage && typeof uploadedImage === "string" && uploadedImage.length > 0) {
      let imageDataUri = uploadedImage
      if (!uploadedImage.startsWith("data:")) {
        imageDataUri = `data:image/jpeg;base64,${uploadedImage}`
      }
      input.first_frame_image = imageDataUri
    }

    console.log("[v0] Starting video generation with model: minimax/video-01")
    console.log("[v0] Has uploaded image:", !!uploadedImage)

    const response = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input })
    })

    const prediction = await response.json()
    console.log("[v0] Replicate response:", JSON.stringify(prediction).substring(0, 500))

    if (!response.ok) {
      console.error("[v0] Replicate API error:", prediction)
      return Response.json({ error: prediction.detail || prediction.error || "Failed to start video generation" }, { status: response.status })
    }

    if (prediction.error) {
      return Response.json({ error: prediction.error }, { status: 500 })
    }

    // Return prediction ID immediately for client-side polling
    return Response.json({
      predictionId: prediction.id,
      status: prediction.status,
      message: "Video generation started. This takes 2-5 minutes.",
    })

  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Video generation failed" },
      { status: 500 },
    )
  }
}

// GET: Check status of a prediction
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const predictionId = searchParams.get("id")

    if (!predictionId) {
      return Response.json({ error: "Missing prediction ID" }, { status: 400 })
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN
    if (!replicateToken) {
      return Response.json({ error: "Replicate API token not configured" }, { status: 400 })
    }

    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { "Authorization": `Bearer ${replicateToken}` }
    })

    const result = await response.json()

    if (result.status === "succeeded" && result.output) {
      const videoUrl = typeof result.output === "string" ? result.output : result.output[0]
      
      // Fetch video and convert to base64
      const videoResponse = await fetch(videoUrl)
      const videoBuffer = await videoResponse.arrayBuffer()
      const base64Video = Buffer.from(videoBuffer).toString("base64")

      return Response.json({
        status: "succeeded",
        videoUrl: `data:video/mp4;base64,${base64Video}`,
        message: "Video generated successfully!",
      })
    }

    if (result.status === "failed") {
      return Response.json({
        status: "failed",
        error: result.error || "Video generation failed",
      })
    }

    // Still processing
    return Response.json({
      status: result.status,
      message: result.status === "starting" ? "Initializing..." : "Generating video...",
    })

  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 },
    )
  }
}
