import { subscribeNewsletter } from './api.js'

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('.footer-newsletter form')
  if (!form) return

  e.preventDefault()
  const input = form.querySelector('input[type="email"]')
  const button = form.querySelector('button')
  const email = input.value.trim()

  button.disabled = true
  try {
    await subscribeNewsletter(email)
    input.value = ''
    alert('Subscribed! Thanks for joining.')
  } catch (err) {
    alert(err.message)
  } finally {
    button.disabled = false
  }
})
