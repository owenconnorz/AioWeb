import { generateText } from "ai"

export async function POST(req: Request) {
  const { imageData, editPrompt, model = "perchance-ai-edit", nsfwFilter = true } = await req.json()

  console.log("[v0] Image editing request:", { model, editPrompt, nsfwFilter })

  try {
    if (model === "perchance-ai-edit") {
      console.log("[v0] Using Perchance AI for image editing")

      await new Promise((resolve) => setTimeout(resolve, 2000))

      return Response.json({
        images: [],
        text: "Image editing with Perchance AI requires additional integration. Using fallback preview mode.",
      })
    }

    let base64Data = imageData
    if (imageData.startsWith("data:")) {
      base64Data = imageData.split(",")[1]
    }

    const filteredEditPrompt = nsfwFilter
      ? `${editPrompt}. Keep content safe, appropriate, and family-friendly.`
      : editPrompt

    const result = await generateText({
      model,
      prompt: `Edit this image according to the following instruction: ${filteredEditPrompt}`,
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
              text: `Edit this image: ${filteredEditPrompt}`,
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
