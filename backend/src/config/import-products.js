const fs = require('fs')
const pool = require('./db')

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const main = async () => {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node src/config/import-products.js products.json')
    process.exit(1)
  }

  const items = JSON.parse(fs.readFileSync(file, 'utf8'))
  const client = await pool.connect()
  let inserted = 0
  let updated = 0

  try {
    await client.query('BEGIN')

    for (const [index, item] of items.entries()) {
      const label = `item #${index + 1} (${item.name || 'no name'})`

      if (!item.name || !item.sku) {
        throw new Error(`${label}: name and sku are required`)
      }
      if (item.price === undefined || Number.isNaN(Number(item.price)) || Number(item.price) < 0) {
        throw new Error(`${label}: a valid price is required`)
      }

      let categoryId = null
      if (item.category) {
        const slug = slugify(item.category)
        const cat = await client.query(
          `INSERT INTO categories (name, slug) VALUES ($1, $2)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [item.category, slug]
        )
        categoryId = cat.rows[0].id
      }

      // موجودی تو فایل نبود: مقدار نمونه (هر سیزدهمین محصول ناموجوده)
      const stock = (index + 1) % 13 === 0 ? 0 : 5 + ((index * 7) % 30)
      const images = [...new Set(item.secondary_images || [])]
      const specs = {
        dimensions: item.dimensions || {},
        warranty: item.warranty || {},
        general: item.general || {},
        product_details: item.product_details || {},
      }

      const result = await client.query(
        `INSERT INTO products
           (category_id, sku, name, short_description, description, price, stock,
            image_url, images, tags, specs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10::text[], $11::jsonb)
         ON CONFLICT (sku) DO UPDATE SET
           category_id = EXCLUDED.category_id,
           name = EXCLUDED.name,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           image_url = EXCLUDED.image_url,
           images = EXCLUDED.images,
           tags = EXCLUDED.tags,
           specs = EXCLUDED.specs
         RETURNING (xmax = 0) AS inserted`,
        [
          categoryId,
          item.sku,
          item.name,
          item.short_description || null,
          item.detailed_description || null,
          item.price,
          stock,
          item.main_image || null,
          images,
          item.tags || [],
          JSON.stringify(specs),
        ]
      )
      if (result.rows[0].inserted) inserted++
      else updated++
    }

    await client.query('COMMIT')
    console.log(`Done. Inserted: ${inserted}, updated: ${updated}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Import failed, nothing was saved:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
