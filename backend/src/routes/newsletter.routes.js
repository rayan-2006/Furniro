const express = require('express')
const { subscribe } = require('../controllers/newsletter.controller')

const router = express.Router()
router.post('/', subscribe)

module.exports = router
