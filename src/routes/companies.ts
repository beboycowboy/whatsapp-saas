import { Router, Request, Response } from 'express'
import prisma from '../services/database'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(companies)
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo empresas' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, phone, prompt, username, password } = req.body
    const company = await prisma.company.create({
      data: { 
        name, type, phone, prompt,
        username: username || name.toLowerCase().replace(/\s/g, ''),
        password: password || 'cambiar123'
      }
    })
    res.json(company)
  } catch (error) {
    res.status(500).json({ error: 'Error creando empresa' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, type, phone, prompt, active, username, password } = req.body
    const company = await prisma.company.update({
      where: { id },
      data: { name, type, phone, prompt, active, username, password }
    })
    res.json(company)
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando empresa' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.company.delete({ where: { id } })
    res.json({ message: 'Empresa eliminada' })
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando empresa' })
  }
})

export default router