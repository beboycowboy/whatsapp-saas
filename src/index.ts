import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import webhookRouter from './routes/webhook'
import companiesRouter from './routes/companies'

dotenv.config()

const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

app.use('/webhook', webhookRouter)
app.use('/companies', companiesRouter)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

export default app