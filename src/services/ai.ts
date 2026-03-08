import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function getAIResponse(message: string, from: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de atención al cliente amable y profesional. 
          Responde siempre en español de forma concisa y útil.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500
    })

    return response.choices[0].message.content || 'No pude procesar tu mensaje.'
  } catch (error) {
    console.error('Error con OpenAI:', error)
    return 'Lo siento, hubo un error. Intenta de nuevo.'
  }
}