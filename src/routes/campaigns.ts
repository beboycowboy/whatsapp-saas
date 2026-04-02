import { Router, Request, Response } from 'express'

const router = Router()

const WASENDER_API_KEY = process.env.WASENDER_API_KEY

async function sendWhatsAppMessage(to: string, message: string) {
  const response = await fetch('https://wasenderapi.com/api/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WASENDER_API_KEY}`
    },
    body: JSON.stringify({ to, text: message })
  })
  return response.json()
}

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body

    if (!to || !message) {
      res.status(400).json({ error: 'Faltan campos to y message' })
      return
    }

    // Limpiar número — WasenderAPI necesita formato 52XXXXXXXXXX@s.whatsapp.net
    let numero = to.replace(/\D/g, '')
    if (!numero.startsWith('52')) numero = '52' + numero
    const toFormatted = `${numero}@s.whatsapp.net`

    const result = await sendWhatsAppMessage(toFormatted, message)
    res.json({ success: true, result })

  } catch (error: any) {
    console.error('Error enviando mensaje:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router