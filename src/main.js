import './styles/main.css'
import { Router } from './router.js'

class App {
  constructor() {
    this.router = new Router()
    this.init()
  }

  init() {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    // Start router
    this.router.init()
  }
}

// Initialize app
new App()