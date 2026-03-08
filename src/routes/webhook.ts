import { Router, Request, Response } from 'express'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const { From, Body } = req.body

  console.log(`Mensaje de ${From}: ${Body}`)

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Recibí tu mensaje: "${Body}" 👋</Message>
</Response>`

  res.type('text/xml')
  res.send(twiml)
})

export default router