import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import webhookRouter from './routes/webhook'
import companiesRouter from './routes/companies'
import authRouter from './routes/auth'
import appointmentsRouter from './routes/appointments'
import { authMiddleware } from './middleware/auth'

dotenv.config()

const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

app.use('/webhook', webhookRouter)
app.use('/auth', authRouter)
app.use('/companies', authMiddleware, companiesRouter)
app.use('/appointments', authMiddleware, appointmentsRouter)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

export default app