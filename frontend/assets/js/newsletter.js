import { subscribeNewsletter } from './api.js'
import { toast } from './toast.js'

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
    toast.show('Subscribed! Thanks for joining.', 'success')
  } catch (err) {
    toast.show(err.message, 'error')
  } finally {
    button.disabled = false
  }
})
