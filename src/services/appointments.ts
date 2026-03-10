import prisma from './database'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function detectAppointmentIntent(message: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analiza el mensaje y responde SOLO con una de estas palabras:
        AGENDAR - si quiere hacer una cita
        CANCELAR - si quiere cancelar una cita
        CONSULTAR - si quiere ver sus citas
        NINGUNA - si no tiene que ver con citas`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 10
  })
  return response.choices[0].message.content?.trim() || 'NINGUNA'
}

export async function extractAppointmentData(message: string, companyType: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extrae los datos de la cita del mensaje y responde SOLO en JSON válido con este formato exacto:
        {
          "clientName": "nombre del cliente o null",
          "date": "fecha en formato YYYY-MM-DD o null",
          "time": "hora en formato HH:MM o null",
          "service": "tipo de servicio o null"
        }
        Hoy es ${new Date().toISOString().split('T')[0]}.
        Tipo de negocio: ${companyType}`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 150
  })

  try {
    const text = response.choices[0].message.content || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {}
  }
}

export async function getAvailableSlots(companyId: string, date: string): Promise<string[]> {
  const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                     '12:00', '12:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
  
  const citas = await prisma.appointment.findMany({
    where: {
      companyId,
      date: new Date(date),
      status: 'confirmed'
    },
    select: { time: true }
  })

  const ocupados = citas.map(c => c.time)
  return allSlots.filter(slot => !ocupados.includes(slot))
}

export async function createAppointment(
  companyId: string,
  clientPhone: string,
  clientName: string,
  date: string,
  time: string,
  service: string
) {
  return await prisma.appointment.create({
    data: {
      companyId,
      clientPhone,
      clientName: clientName || 'Cliente',
      date: new Date(date),
      time,
      service: service || 'Consulta general',
      status: 'confirmed'
    }
  })
}

export async function getClientAppointments(companyId: string, clientPhone: string) {
  return await prisma.appointment.findMany({
    where: {
      companyId,
      clientPhone,
      status: 'confirmed',
      date: { gte: new Date() }
    },
    orderBy: { date: 'asc' }
  })
}