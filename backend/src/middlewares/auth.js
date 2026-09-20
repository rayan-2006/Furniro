const jwt = require('jsonwebtoken')

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'missing token' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (err) {
    res.status(401).json({ message: 'invalid or expired token' })
  }
}

module.exports = { requireAuth }
