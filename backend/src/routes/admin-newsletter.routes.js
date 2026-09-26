const express = require('express')
const { listSubscribers } = require('../controllers/newsletter.controller')
const { requireAuth } = require('../middlewares/auth')
const { requireAdmin } = require('../middlewares/admin')

const router = express.Router()
router.get('/', requireAuth, requireAdmin, listSubscribers)

module.exports = router
