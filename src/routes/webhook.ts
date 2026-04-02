import { Router, Request, Response } from 'express'
import { getAIResponse } from '../services/ai'
import prisma from '../services/database'
import { detectAppointmentIntent, extractAppointmentData, getAvailableSlots, createAppointment, getClientAppointments } from '../services/appointments'

const router = Router()

async function sendWhatsAppMessage(to: string, message: string) {
  const apiKey = process.env.WASENDER_API_KEY
  const url = 'https://wasenderapi.com/api/send-message'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      to: to,
      text: message
    })
  })

  const data = await response.json()
  console.log('WasenderAPI response:', data)
  return data
}

router.post('/', async (req: Request, res: Response) => {
  // Responder inmediatamente a WasenderAPI
  res.status(200).json({ status: 'ok' })

  try {
    const body = req.body
    console.log('Webhook recibido:', JSON.stringify(body))

    // Extraer datos del formato WasenderAPI
    const message = body?.data?.message
    const from = body?.data?.from || body?.data?.sender
    const text = body?.data?.text?.body || body?.data?.message?.conversation || body?.data?.body || ''
    const type = body?.data?.type || body?.type

    // Solo procesar mensajes de texto entrantes
    if (!text || !from) {
      console.log('Mensaje sin texto o sin remitente, ignorando')
      return
    }

    // Ignorar mensajes enviados por nosotros
    if (body?.data?.fromMe === true) {
      console.log('Mensaje propio, ignorando')
      return
    }

    console.log(`Mensaje de ${from}: ${text}`)

    // Buscar empresa activa — como WasenderAPI no tiene multi-número por webhook
    // usamos la primera empresa activa o buscamos por número de sesión
    const company = await prisma.company.findFirst({
      where: { active: true }
    })

    if (!company) {
      console.log('No se encontró empresa activa')
      return
    }

    // Detectar intención
    const intent = await detectAppointmentIntent(text)
    console.log(`Intención detectada: ${intent}`)

    let responseMessage = ''

    if (intent === 'AGENDAR') {
      const data = await extractAppointmentData(text, company.type)

      if (data.date && data.time) {
        const slots = await getAvailableSlots(company.id, data.date)

        if (slots.includes(data.time)) {
          await createAppointment(
            company.id,
            from,
            data.clientName || 'Cliente',
            data.date,
            data.time,
            data.service || 'Consulta'
          )
          responseMessage = `✅ ¡Cita confirmada!\n\n📅 Fecha: ${data.date}\n⏰ Hora: ${data.time}\n💼 Servicio: ${data.service || 'Consulta'}\n\nTe esperamos. ¡Recuerda llegar 5 minutos antes!`
        } else {
          const disponibles = slots.slice(0, 5).join(', ')
          responseMessage = `Lo siento, ese horario no está disponible. Los horarios disponibles para ${data.date} son: ${disponibles}`
        }
      } else {
        const hoy = new Date().toISOString().split('T')[0]
        const slots = await getAvailableSlots(company.id, hoy)
        const disponibles = slots.slice(0, 5).join(', ')
        responseMessage = `Con gusto te agendo una cita. ¿Qué fecha y hora prefieres? Horarios disponibles hoy: ${disponibles}`
      }

    } else if (intent === 'CANCELAR') {
      const citas = await getClientAppointments(company.id, from)
      if (citas.length === 0) {
        responseMessage = 'No encontré citas activas para cancelar.'
      } else {
        const cita = citas[0]
        await prisma.appointment.update({
          where: { id: cita.id },
          data: { status: 'cancelled' }
        })
        responseMessage = `✅ Tu cita del ${cita.date.toISOString().split('T')[0]} a las ${cita.time} ha sido cancelada.`
      }

    } else if (intent === 'CONSULTAR') {
      const citas = await getClientAppointments(company.id, from)
      if (citas.length === 0) {
        responseMessage = 'No tienes citas próximas agendadas.'
      } else {
        const lista = citas.map(c => `📅 ${c.date.toISOString().split('T')[0]} a las ${c.time} - ${c.service}`).join('\n')
        responseMessage = `Tus próximas citas:\n\n${lista}`
      }

    } else {
      responseMessage = await getAIResponse(text, from, company.prompt)
    }

    // Guardar conversación
    await prisma.conversation.create({
      data: {
        companyId: company.id,
        from: from,
        message: text,
        response: responseMessage
      }
    })

    // Enviar respuesta
    await sendWhatsAppMessage(from, responseMessage)
    console.log(`Respuesta enviada a ${from}: ${responseMessage}`)

  } catch (error) {
    console.error('Error en webhook:', error)
  }
})

export default router