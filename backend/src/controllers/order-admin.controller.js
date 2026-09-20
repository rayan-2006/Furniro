const pool = require('../config/db')

const allowedStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

const listAllOrders = async (req, res) => {
  try {
    const { status } = req.query
    const values = []
    let where = ''
    if (status) {
      values.push(status)
      where = 'WHERE o.status = $1'
    }
    const result = await pool.query(
      `SELECT o.id, o.total, o.status, o.created_at, u.name AS user_name, u.email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC`,
      values
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const updateOrderStatus = async (req, res) => {
  const { status } = req.body
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowedStatuses.join(', ')}` })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const current = await client.query(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE',
      [req.params.id]
    )
    if (!current.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'order not found' })
    }
    if (current.rows[0].status === 'cancelled') {
      await client.query('ROLLBACK')
      return res.status(409).json({ message: 'a cancelled order cannot be changed' })
    }

    if (status === 'cancelled') {
      await client.query(
        `UPDATE products p
         SET stock = p.stock + oi.quantity
         FROM order_items oi
         WHERE oi.order_id = $1 AND oi.product_id = p.id`,
        [req.params.id]
      )
    }

    const updated = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, total, status, created_at',
      [status, req.params.id]
    )
    await client.query('COMMIT')
    res.json(updated.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'invalid order id' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  } finally {
    client.release()
  }
}

module.exports = { listAllOrders, updateOrderStatus }
