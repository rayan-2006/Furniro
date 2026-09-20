const pool = require('../config/db')

const sortOptions = {
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  name_asc: 'p.name ASC',
}

const listProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50)
    const offset = (page - 1) * limit

    const where = []
    const values = []

    if (search) {
      values.push(`%${search}%`)
      where.push(`(p.name ILIKE $${values.length} OR p.short_description ILIKE $${values.length})`)
    }
    if (category) {
      values.push(category)
      where.push(`c.slug = $${values.length}`)
    }
    if (minPrice && !Number.isNaN(Number(minPrice))) {
      values.push(Number(minPrice))
      where.push(`p.price >= $${values.length}`)
    }
    if (maxPrice && !Number.isNaN(Number(maxPrice))) {
      values.push(Number(maxPrice))
      where.push(`p.price <= $${values.length}`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orderBy = sortOptions[sort] || sortOptions.newest

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}`,
      values
    )

    const dataResult = await pool.query(
      `SELECT p.id, p.sku, p.name, p.short_description, p.price, p.stock,
              p.image_url, p.tags, p.created_at,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY ${orderBy}, p.id
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    )

    res.json({
      items: dataResult.rows,
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const getProduct = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.sku, p.name, p.short_description, p.description, p.price, p.stock,
              p.image_url, p.images, p.tags, p.specs, p.created_at,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [req.params.id]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'product not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'invalid product id' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

const createProduct = async (req, res) => {
  try {
    const {
      name, sku, short_description, description, price, stock,
      image_url, images, tags, specs, category_id,
    } = req.body

    if (!name || price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'name and a valid price are required' })
    }

    const result = await pool.query(
      `INSERT INTO products
         (name, sku, short_description, description, price, stock,
          image_url, images, tags, specs, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9::text[], $10::jsonb, $11)
       RETURNING *`,
      [
        name, sku || null, short_description || null, description || null, price,
        stock || 0, image_url || null, images || [], tags || [],
        JSON.stringify(specs || {}), category_id || null,
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'sku already exists' })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'category does not exist' })
    }
    console.error(err)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { listProducts, getProduct, createProduct }
