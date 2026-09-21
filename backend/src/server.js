require('dotenv').config()
const express = require('express')
const cors = require('cors')
const pool = require('./config/db')

const app = express()
app.use(cors())
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/categories', require('./routes/category.routes'))
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/cart', require('./routes/cart.routes'))
app.use('/api/orders', require('./routes/order.routes'))
app.use('/api/admin', require('./routes/admin.routes'))

app.get('/', (req, res) => {
  res.send('Hello from backend')
})

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time')
    res.json({ status: 'ok', dbTime: result.rows[0].time })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
  console.log(`Listening ${PORT}`)
})
