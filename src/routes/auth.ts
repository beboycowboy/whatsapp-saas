import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../services/database'

const router = Router()

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'secreto123'

// Login admin
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

// Login cliente
router.post('/client-login', async (req: Request, res: Response) => {
  const { username, password } = req.body

  try {
    const company = await prisma.company.findUnique({
      where: { username }
    })

    if (!company || company.password !== password || !company.active) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    const token = jwt.sign({ companyId: company.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, company: { id: company.id, name: company.name, type: company.type } })
  } catch (error) {
    res.status(500).json({ error: 'Error en login' })
  }
})

export default router