export async function POST(req: Request) {
  const { prompt, learningContext, model = "perchance-ai-video" } = await req.json()

  console.log("[v0] Video generation request:", { model, prompt })

  try {
    const enhancedPrompt = learningContext ? `${prompt} (Style inspiration: ${learningContext})` : prompt

    // Simulate video generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate a unique video preview based on the prompt
    const videoUrl = `/placeholder.svg?height=720&width=1280&query=${encodeURIComponent(enhancedPrompt + " cinematic video")}`

    console.log("[v0] Video generated successfully:", videoUrl)

    return Response.json({
      videoUrl,
      message: "Video generation is currently in placeholder mode. Connect a video AI service for real generation.",
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
