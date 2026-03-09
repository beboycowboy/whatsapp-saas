import { Router, Request, Response } from 'express'
import { getAIResponse } from '../services/ai'
import prisma from '../services/database'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { From, Body, To } = req.body

  console.log(`Mensaje de ${From} para ${To}: ${Body}`)

  // Responder inmediatamente a Twilio
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`
  res.type('text/xml')
  res.send(twiml)

  try {
    // Buscar empresa por número
    const company = await prisma.company.findUnique({
      where: { phone: To, active: true }
    })

    if (!company) {
      console.log(`No se encontró empresa activa para el número ${To}`)
      return
    }

    console.log(`Empresa encontrada: ${company.name}`)

    // Generar respuesta con IA usando el prompt de la empresa
    const aiResponse = await getAIResponse(Body, From, company.prompt)

    // Guardar conversación en DB
    await prisma.conversation.create({
      data: {
        companyId: company.id,
        from: From,
        message: Body,
        response: aiResponse
      }
    })

    // Enviar respuesta por Twilio
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    await twilio.messages.create({
      from: To,
      to: From,
      body: aiResponse
    })

    console.log(`Respuesta enviada a ${From}: ${aiResponse}`)
  } catch (error) {
    console.error('Error procesando mensaje:', error)
  }
})

export default router