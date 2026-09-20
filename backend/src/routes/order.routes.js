const express = require('express')
const { checkout, listOrders, getOrder } = require('../controllers/order.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()
router.use(requireAuth)

router.post('/', checkout)
router.get('/', listOrders)
router.get('/:id', getOrder)

module.exports = router
