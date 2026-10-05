require('dotenv').config()
const os = require('os')
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const QRCode = require('qrcode')
const pool = require('./config/db')

const app = express()
const PORT = process.env.PORT || 3000

function getLocalIp() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

const LOCAL_IP = getLocalIp()

app.use(cors())
app.use(express.json())

// لاگ هر درخواست همراه با آی‌پی کلاینت
app.use((req, res, next) => {
  const getClientIp = (req) => {
    let ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown'

    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
      ip = LOCAL_IP
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7)
    }
    return ip
  }

  console.log(`${new Date().toISOString()} - ${getClientIp(req)} - ${req.method} ${req.url}`)
  next()
})

// جلوگیری از حجم غیرعادی درخواست
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/categories', require('./routes/category.routes'))
app.use('/api/newsletter', require('./routes/newsletter.routes'))
app.use('/api/admin/newsletter', require('./routes/admin-newsletter.routes'))
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

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }

  const networkUrl = `http://${LOCAL_IP}:${PORT}`

  QRCode.toString(networkUrl, { type: 'utf8', small: true })
    .then((qr) => {
      const qrLines = qr.trimEnd().split('\n')
      const qrWidth = Math.max(...qrLines.map((l) => l.length))
      const W = Math.max(46, qrWidth + 2)

      const pad = (txt) => txt + ' '.repeat(Math.max(0, W - txt.length))
      const line = (txt = '') => `║  ${pad(txt)}  ║`
      const top = `╔${'═'.repeat(W + 4)}╗`
      const mid = `╠${'═'.repeat(W + 4)}╣`
      const bot = `╚${'═'.repeat(W + 4)}╝`

      console.log('\n' + top)
      console.log(line('Shop Backend'))
      console.log(mid)
      console.log(line(`localhost : http://localhost:${PORT}`))
      console.log(line(`network   : ${networkUrl}`))
      console.log(mid)
      console.log(line('Scan with your phone:'))
      console.log(line())
      qrLines.forEach((row) => console.log(line(row)))
      console.log(line())
      console.log(bot + '\n')
    })
    .catch((err) => {
      console.error('QR code error:', err.message)
    })
})