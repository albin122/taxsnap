import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Prevent mouse wheel scrolling from changing number input values
document.addEventListener(
  'wheel',
  () => {
    if (document.activeElement && (document.activeElement as HTMLInputElement).type === 'number') {
      (document.activeElement as HTMLElement).blur();
    }
  },
  { passive: true }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
