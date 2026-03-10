import { Router, Request, Response } from 'express'
import { getAIResponse } from '../services/ai'
import prisma from '../services/database'
import { detectAppointmentIntent, extractAppointmentData, getAvailableSlots, createAppointment, getClientAppointments } from '../services/appointments'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { From, Body, To } = req.body

  console.log(`Mensaje de ${From} para ${To}: ${Body}`)

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`
  res.type('text/xml')
  res.send(twiml)

  try {
    const company = await prisma.company.findUnique({
      where: { phone: To, active: true }
    })

    if (!company) {
      console.log(`No se encontró empresa activa para ${To}`)
      return
    }

    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Detectar intención de cita
    const intent = await detectAppointmentIntent(Body)
    console.log(`Intención detectada: ${intent}`)

    let responseMessage = ''

    if (intent === 'AGENDAR') {
      const data = await extractAppointmentData(Body, company.type)
      
      if (data.date && data.time) {
        const slots = await getAvailableSlots(company.id, data.date)
        
        if (slots.includes(data.time)) {
          await createAppointment(
            company.id,
            From,
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
      const citas = await getClientAppointments(company.id, From)
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
      const citas = await getClientAppointments(company.id, From)
      if (citas.length === 0) {
        responseMessage = 'No tienes citas próximas agendadas.'
      } else {
        const lista = citas.map(c => `📅 ${c.date.toISOString().split('T')[0]} a las ${c.time} - ${c.service}`).join('\n')
        responseMessage = `Tus próximas citas:\n\n${lista}`
      }

    } else {
      responseMessage = await getAIResponse(Body, From, company.prompt)
    }

    await prisma.conversation.create({
      data: {
        companyId: company.id,
        from: From,
        message: Body,
        response: responseMessage
      }
    })

    await twilio.messages.create({
      from: To,
      to: From,
      body: responseMessage
    })

    console.log(`Respuesta enviada: ${responseMessage}`)
  } catch (error) {
    console.error('Error:', error)
  }
})

export default router