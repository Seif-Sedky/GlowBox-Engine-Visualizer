import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <div style={{ color: 'white', background: '#0a0a0f', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <h1>GlowBox ✦</h1>
    </div>
  </StrictMode>
)