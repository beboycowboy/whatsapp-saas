import OpenAI from 'openai'
import { getHistory, saveHistory } from './memory'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function getAIResponse(message: string, from: string): Promise<string> {
  try {
    const history = await getHistory(from)

    const messages = [
      {
        role: 'system' as const,
        content: `Eres un asistente de atención al cliente amable y profesional. 
        Responde siempre en español de forma concisa y útil.`
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500
    })

    const aiResponse = response.choices[0].message.content || 'No pude procesar tu mensaje.'

    // guardar historial actualizado
    await saveHistory(from, [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ])

    return aiResponse
  } catch (error) {
    console.error('Error con OpenAI:', error)
    return 'Lo siento, hubo un error. Intenta de nuevo.'
  }
}