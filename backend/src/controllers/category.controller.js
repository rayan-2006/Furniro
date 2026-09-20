const pool = require('../config/db')

const listCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, slug FROM categories ORDER BY name')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body
    if (!name || !slug) {
      return res.status(400).json({ message: 'name and slug are required' })
    }

    const result = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
      [name, slug.toLowerCase()]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'category already exists' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { listCategories, createCategory }
