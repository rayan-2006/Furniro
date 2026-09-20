const express = require('express')
const { getCart, addToCart, updateCartItem, removeCartItem } = require('../controllers/cart.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', getCart)
router.post('/', addToCart)
router.patch('/:productId', updateCartItem)
router.delete('/:productId', removeCartItem)

module.exports = router
