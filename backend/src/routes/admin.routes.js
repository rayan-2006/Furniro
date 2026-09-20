const express = require('express')
const { listAllOrders, updateOrderStatus } = require('../controllers/order-admin.controller')
const { requireAuth } = require('../middlewares/auth')
const { requireAdmin } = require('../middlewares/admin')

const router = express.Router()
router.use(requireAuth, requireAdmin)

router.get('/orders', listAllOrders)
router.patch('/orders/:id/status', updateOrderStatus)

module.exports = router
