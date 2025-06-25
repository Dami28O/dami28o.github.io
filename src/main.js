import './styles/main.css'
import { Router } from './router.js'

/**
 * Main Application Class
 * Entry point for the portfolio application
 * Handles theme initialization and router setup
 */
class App {
  constructor() {
    this.router = new Router()
    this.init()
  }

  /**
   * Initialize the application
   * Sets up theme and starts the router
   */
  init() {
    // Initialize theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    // Start the router for page navigation
    this.router.init()
  }
}

// Initialize the application
new App()