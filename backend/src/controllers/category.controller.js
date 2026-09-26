const pool = require('../config/db')

const listCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, image_url FROM categories ORDER BY name'
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const createCategory = async (req, res) => {
  try {
    const { name, slug, image_url } = req.body
    if (!name || !slug) {
      return res.status(400).json({ message: 'name and slug are required' })
    }

    const result = await pool.query(
      'INSERT INTO categories (name, slug, image_url) VALUES ($1, $2, $3) RETURNING id, name, slug, image_url',
      [name, slug.toLowerCase(), image_url || null]
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

const updateCategory = async (req, res) => {
  try {
    const { image_url } = req.body
    if (image_url === undefined) {
      return res.status(400).json({ message: 'image_url is required' })
    }

    const result = await pool.query(
      'UPDATE categories SET image_url = $1 WHERE id = $2 RETURNING id, name, slug, image_url',
      [image_url, req.params.id]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'category not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'invalid category id' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { listCategories, createCategory, updateCategory }
