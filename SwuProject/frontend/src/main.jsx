import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SplashCursor from './SplashScreen.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <SplashCursor>
     <App />
   </SplashCursor>
  </StrictMode>,
)
