const pool = require('../config/db')

const checkout = async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const cart = await client.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1
       ORDER BY p.id
       FOR UPDATE OF p`,
      [req.user.id]
    )

    if (cart.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'cart is empty' })
    }

    let totalCents = 0
    for (const item of cart.rows) {
      if (item.quantity > item.stock) {
        await client.query('ROLLBACK')
        return res.status(409).json({ message: `not enough stock for "${item.name}"` })
      }
      totalCents += Math.round(Number(item.price) * 100) * item.quantity
    }

    const order = await client.query(
      `INSERT INTO orders (user_id, total)
       VALUES ($1, $2)
       RETURNING id, total, status, created_at`,
      [req.user.id, totalCents / 100]
    )
    const orderId = order.rows[0].id

    for (const item of cart.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.name, item.price, item.quantity]
      )
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [
        item.quantity,
        item.product_id,
      ])
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id])
    await client.query('COMMIT')

    res.status(201).json(order.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'server error' })
  } finally {
    client.release()
  }
}

const listOrders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, total, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const getOrder = async (req, res) => {
  try {
    const order = await pool.query(
      'SELECT id, total, status, created_at FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!order.rows[0]) {
      return res.status(404).json({ message: 'order not found' })
    }
    const items = await pool.query(
      `SELECT product_id, product_name, unit_price, quantity
       FROM order_items WHERE order_id = $1 ORDER BY id`,
      [req.params.id]
    )
    res.json({ ...order.rows[0], items: items.rows })
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'invalid order id' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { checkout, listOrders, getOrder }
