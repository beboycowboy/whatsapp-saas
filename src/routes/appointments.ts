import { Router, Request, Response } from 'express'
import prisma from '../services/database'

const router = Router()

router.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params
    const appointments = await prisma.appointment.findMany({
      where: { companyId },
      orderBy: { date: 'asc' }
    })
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo citas' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId, clientPhone, clientName, date, time, service, notes } = req.body
    const appointment = await prisma.appointment.create({
      data: { companyId, clientPhone, clientName, date: new Date(date), time, service, notes }
    })
    res.json(appointment)
  } catch (error) {
    res.status(500).json({ error: 'Error creando cita' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { clientName, date, time, service, status, notes } = req.body
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { clientName, date: date ? new Date(date) : undefined, time, service, status, notes }
    })
    res.json(appointment)
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando cita' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' }
    })
    res.json({ message: 'Cita cancelada' })
  } catch (error) {
    console.error('Error cancelando cita:', error)
    res.status(500).json({ error: 'Error cancelando cita' })
  }
})

router.get('/:companyId/disponibilidad/:date', async (req: Request, res: Response) => {
  try {
    const { companyId, date } = req.params
    const citas = await prisma.appointment.findMany({
      where: { companyId, date: new Date(date), status: 'confirmed' },
      select: { time: true }
    })
    const ocupados = citas.map(c => c.time)
    res.json({ ocupados })
  } catch (error) {
    res.status(500).json({ error: 'Error verificando disponibilidad' })
  }
})

export default router