export class ToastManager {
  constructor() {
    this.container = document.getElementById('toastContainer')
    if (!this.container) {
      throw new Error('toastContainer element not found')
    }
  }

  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div')
    toast.className = `Message-box ${type}`

    toast.innerHTML = `
      <div class="message-text">
        <p>${message}</p>
        <div class="bar"></div>
      </div>
      <button class="close-message" aria-label="Close">
       <i class="fa-solid fa-xmark"></i>
      </button>
    `

    this.container.prepend(toast)

    let isRemoved = false

    requestAnimationFrame(() => {
      toast.classList.add('show')
    })

    const bar = toast.querySelector('.bar')
    bar.style.width = '100%'

    requestAnimationFrame(() => {
      bar.style.transition = `width ${duration}ms linear`
      bar.style.width = '0%'
    })

    const removeToast = () => {
      if (isRemoved) return
      isRemoved = true

      toast.classList.remove('show')
      toast.classList.add('hide')

      let removedByEvent = false

      const onEnd = (e) => {
        if (e.target !== toast) return
        removedByEvent = true
        toast.remove()
      }

      toast.addEventListener('transitionend', onEnd, { once: true })
      setTimeout(() => {
        if (!removedByEvent) toast.remove()
      }, 500)
    }

    toast.querySelector('.close-message').addEventListener('click', removeToast)
    setTimeout(removeToast, duration)
  }
}

// یه نمونه‌ی مشترک که همه‌ی فایل‌ها می‌تونن import کنن
export const toast = new ToastManager();
