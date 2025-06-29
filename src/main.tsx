
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Remove loading screen when React is ready
const removeLoadingScreen = () => {
  const loadingScreen = document.querySelector('.loading-screen')
  if (loadingScreen) {
    loadingScreen.style.opacity = '0'
    loadingScreen.style.transition = 'opacity 0.3s ease-out'
    setTimeout(() => {
      loadingScreen.remove()
    }, 300)
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Remove loading screen after a short delay
setTimeout(removeLoadingScreen, 100)
