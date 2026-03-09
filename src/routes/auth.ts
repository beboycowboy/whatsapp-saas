import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'secreto123'

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

export default router