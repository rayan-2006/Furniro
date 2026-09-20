const express = require('express')
const { listCategories, createCategory } = require('../controllers/category.controller')
const { requireAuth } = require('../middlewares/auth')
const { requireAdmin } = require('../middlewares/admin')

const router = express.Router()

router.get('/', listCategories)
router.post('/', requireAuth, requireAdmin, createCategory)

module.exports = router
