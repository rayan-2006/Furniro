const API_BASE = 'http://localhost:3000/api'

async function request(path, options = {}) {
  const { headers, ...rest } = options
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request(`/products${qs ? `?${qs}` : ''}`)
}

export const getProduct = (id) => request(`/products/${id}`)

// قیمت از ای‌پی‌آی به‌صورت رشته میاد ("742.00"). واحد پول رو فقط همین‌جا عوض کن.
export const formatPrice = (value) =>
  Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export const subscribeNewsletter = (email) =>
  request('/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
