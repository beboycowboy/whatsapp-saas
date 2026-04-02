import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../services/database'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
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
    const hash = await bcrypt.hash(password || 'cambiar123', 10)
    const company = await prisma.company.create({
      data: {
        name, type, phone, prompt,
        username: username || name.toLowerCase().replace(/\s/g, ''),
        password: hash
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
    const data: any = { name, type, phone, prompt, active, username }
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }
    const company = await prisma.company.update({
      where: { id },
      data
    })
    res.json(company)
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando empresa' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // Soft delete — no borramos, solo marcamos como eliminado
    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    res.json({ message: 'Empresa eliminada' })
  } catch (error: any) {
    console.error('Error eliminando empresa:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router