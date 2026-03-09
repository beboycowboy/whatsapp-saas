import express from 'express'
import dotenv from 'dotenv'
import webhookRouter from './routes/webhook'
import companiesRouter from './routes/companies'

dotenv.config()

const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use('/webhook', webhookRouter)
app.use('/companies', companiesRouter)

app.get('/', (req, res) => {
  res.send('WhatsApp SaaS funcionando ✅')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

export default app