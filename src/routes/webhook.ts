import { Router, Request, Response } from 'express'
import { getAIResponse } from '../services/ai'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { From, Body } = req.body

  console.log(`Mensaje de ${From}: ${Body}`)

  const aiResponse = await getAIResponse(Body, From)

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${aiResponse}</Message>
</Response>`

  res.type('text/xml')
  res.send(twiml)
})

export default router