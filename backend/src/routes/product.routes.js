const express = require('express')
const { listProducts, getProduct, createProduct } = require('../controllers/product.controller')
const { updateProduct, deleteProduct } = require('../controllers/product-admin.controller')
const { requireAuth } = require('../middlewares/auth')
const { requireAdmin } = require('../middlewares/admin')

const router = express.Router()

router.get('/', listProducts)
router.get('/:id', getProduct)
router.post('/', requireAuth, requireAdmin, createProduct)
router.patch('/:id', requireAuth, requireAdmin, updateProduct)
router.delete('/:id', requireAuth, requireAdmin, deleteProduct)

module.exports = router
