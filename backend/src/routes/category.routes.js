const express = require('express')
const { listCategories, createCategory, updateCategory } = require('../controllers/category.controller')
const { requireAuth } = require('../middlewares/auth')
const { requireAdmin } = require('../middlewares/admin')

const router = express.Router()

router.get('/', listCategories)
router.post('/', requireAuth, requireAdmin, createCategory)
router.patch('/:id', requireAuth, requireAdmin, updateCategory)

module.exports = router
