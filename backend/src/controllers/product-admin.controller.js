const pool = require('../config/db')

const allowedFields = ['name', 'description', 'price', 'stock', 'image_url', 'category_id']

const updateProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ message: 'name cannot be empty' })
    }
    if (price !== undefined && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ message: 'price must be a non-negative number' })
    }
    if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      return res.status(400).json({ message: 'stock must be a non-negative integer' })
    }

    const sets = []
    const values = []
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        values.push(req.body[field])
        sets.push(`${field} = $${values.length}`)
      }
    }
    if (sets.length === 0) {
      return res.status(400).json({ message: 'no valid fields to update' })
    }

    values.push(req.params.id)
    const result = await pool.query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'product not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'invalid id or value' })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'category does not exist' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id])
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'product not found' })
    }
    res.status(204).end()
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'invalid product id' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { updateProduct, deleteProduct }
