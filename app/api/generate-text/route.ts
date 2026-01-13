import { generateText } from "ai"

export async function POST(req: Request) {
  const { prompt, learningContext, model = "openai/gpt-5-mini" } = await req.json()

  let enhancedPrompt = prompt
  if (learningContext) {
    enhancedPrompt = `Here are some examples of responses the user liked:\n\n${learningContext}\n\nNow, using a similar style and quality, respond to this request:\n${prompt}`
  }

  const { text, usage, finishReason } = await generateText({
    model,
    prompt: enhancedPrompt,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  return Response.json({
    text,
    usage,
    finishReason,
  })
}
