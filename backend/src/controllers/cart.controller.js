const pool = require('../config/db')

const isPositiveInt = (v) => Number.isInteger(v) && v > 0

const getCart = async (req, res) => {
  try {
    const items = await pool.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.image_url,
              (p.price * ci.quantity) AS line_total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1
       ORDER BY ci.id`,
      [req.user.id]
    )
    const total = await pool.query(
      `SELECT COALESCE(SUM(p.price * ci.quantity), 0) AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [req.user.id]
    )
    res.json({ items: items.rows, total: total.rows[0].total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const addToCart = async (req, res) => {
  try {
    const productId = Number(req.body.product_id)
    const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity)

    if (!isPositiveInt(productId) || !isPositiveInt(quantity)) {
      return res.status(400).json({ message: 'product_id and quantity must be positive integers' })
    }

    const product = await pool.query('SELECT id, stock FROM products WHERE id = $1', [productId])
    if (!product.rows[0]) {
      return res.status(404).json({ message: 'product not found' })
    }
    if (quantity > product.rows[0].stock) {
      return res.status(400).json({ message: 'not enough stock' })
    }

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING product_id, quantity`,
      [req.user.id, productId, quantity]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const updateCartItem = async (req, res) => {
  try {
    const productId = Number(req.params.productId)
    const quantity = Number(req.body.quantity)

    if (!isPositiveInt(productId) || !isPositiveInt(quantity)) {
      return res.status(400).json({ message: 'quantity must be a positive integer' })
    }

    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1
       WHERE user_id = $2 AND product_id = $3
       RETURNING product_id, quantity`,
      [quantity, req.user.id, productId]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'item not in cart' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const removeCartItem = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, Number(req.params.productId)]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'item not in cart' })
    }
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem }
