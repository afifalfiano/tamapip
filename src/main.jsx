import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Tamagotchi from './Tamagotchi.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Tamagotchi />
  </StrictMode>,
)
