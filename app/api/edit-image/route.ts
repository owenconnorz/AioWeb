import { generateText } from "ai"

export async function POST(req: Request) {
  const { imageData, editPrompt, model = "perchance-ai-edit" } = await req.json()

  console.log("[v0] Image editing request:", { model, editPrompt })

  try {
    if (model === "perchance-ai-edit") {
      // Use Perchance for image editing
      // For now, this is a placeholder - actual implementation would call Perchance API
      console.log("[v0] Using Perchance AI for image editing")

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Return a placeholder response
      return Response.json({
        images: [],
        text: "Image editing with Perchance AI requires additional integration. Using fallback preview mode.",
      })
    }

    // Extract base64 data from data URL if necessary
    let base64Data = imageData
    if (imageData.startsWith("data:")) {
      base64Data = imageData.split(",")[1]
    }

    const result = await generateText({
      model,
      prompt: `Edit this image according to the following instruction: ${editPrompt}`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: base64Data,
            },
            {
              type: "text",
              text: `Edit this image: ${editPrompt}`,
            },
          ],
        },
      ],
    })

    console.log("[v0] Image editing result:", result)

    const images = []
    if (result.files && result.files.length > 0) {
      for (const file of result.files) {
        if (file.mediaType.startsWith("image/")) {
          images.push({
            base64: file.base64,
            mediaType: file.mediaType,
          })
        }
      }
    }

    return Response.json({
      images,
      text: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("[v0] Image editing error:", error)
    return Response.json({ error: "Image editing failed. Please try again." }, { status: 500 })
  }
}
