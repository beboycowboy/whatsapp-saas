import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const MAX_MESSAGES = 10 // recordar últimos 10 mensajes

export async function getHistory(from: string): Promise<{role: string, content: string}[]> {
  try {
    const data = await redis.get(`chat:${from}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export async function saveHistory(from: string, history: {role: string, content: string}[]): Promise<void> {
  try {
    // solo guardamos los últimos MAX_MESSAGES mensajes
    const trimmed = history.slice(-MAX_MESSAGES)
    await redis.setex(`chat:${from}`, 60 * 60 * 24, JSON.stringify(trimmed)) // expira en 24 horas
  } catch (error) {
    console.error('Error guardando historial:', error)
  }
}

export async function clearHistory(from: string): Promise<void> {
  try {
    await redis.del(`chat:${from}`)
  } catch (error) {
    console.error('Error borrando historial:', error)
  }
}