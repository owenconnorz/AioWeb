export async function POST(req: Request) {
  const { prompt, learningContext, model = "promptchan-video", nsfwFilter = true } = await req.json()

  console.log("[v0] Video generation request:", { model, prompt, nsfwFilter })

  try {
    let enhancedPrompt = learningContext ? `${prompt} (Style inspiration: ${learningContext})` : prompt

    if (nsfwFilter) {
      enhancedPrompt += ". Safe for work, family-friendly content only"
    }

    if (model === "promptchan-video") {
      const apiKey = process.env.PROMPTCHAN_API_KEY

      if (!apiKey) {
        return Response.json(
          {
            error: "PromptChan API key not found. Please add PROMPTCHAN_API_KEY to your environment variables.",
          },
          { status: 400 },
        )
      }

      try {
        const response = await fetch("https://api.promptchan.ai/v1/generate-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt: nsfwFilter ? enhancedPrompt : prompt,
            style: "realistic",
            duration: 5,
          }),
        })

        if (!response.ok) {
          throw new Error(`PromptChan API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.video_url) {
          console.log("[v0] PromptChan video generated successfully")
          return Response.json({
            videoUrl: data.video_url,
            message: "Video generated successfully with PromptChan AI",
          })
        }
      } catch (error) {
        console.error("[v0] PromptChan video error:", error)
        return Response.json(
          {
            error: error instanceof Error ? error.message : "PromptChan video generation failed",
          },
          { status: 500 },
        )
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))

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
