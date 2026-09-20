import React from 'react'
import { createRoot } from 'react-dom/client'

const App = () => (
  <div>Hello React</div>
)

createRoot(
  document.getElementById('root')
).render(<App />)
