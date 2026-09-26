const pool = require('../config/db')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const subscribe = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'a valid email is required' })
    }

    await pool.query(
      'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    )

    // چه قبلاً عضو بوده چه تازه، همون پیام موفقیت رو می‌دیم
    // تا کسی نفهمه کدوم ایمیل قبلاً ثبت شده (حفظ حریم خصوصی)
    res.status(201).json({ message: 'subscribed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { subscribe }

const listSubscribers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports.listSubscribers = listSubscribers
