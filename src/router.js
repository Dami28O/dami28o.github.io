import { Layout } from './components/Layout.js'
import { Home } from './pages/Home.js'
import { Projects } from './pages/Projects.js'
import { Contact } from './pages/Contact.js'

export class Router {
  constructor() {
    this.routes = {
      '': Home,
      'projects': Projects,
      'contact': Contact
    }
    this.currentRoute = ''
    this.currentPage = null
    this.layout = new Layout()
  }

  init() {
    // Mount layout
    document.getElementById('app').appendChild(this.layout.render())
    
    // Handle initial route
    this.handleRoute()
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute())
    
    // Listen for navigation clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]')) {
        e.preventDefault()
        const route = e.target.getAttribute('data-route')
        window.location.hash = route
      }
    })
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (this.layout && typeof this.layout.destroy === 'function') {
        this.layout.destroy()
      }
    })
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || ''
    const route = hash.split('/')[0]
    
    if (this.routes[route]) {
      this.currentRoute = route
      this.renderPage(route)
      this.updateNavigation(route)
    } else {
      // Default to home
      window.location.hash = ''
    }
  }

  renderPage(route) {
    const PageComponent = this.routes[route]
    
    // Clean up previous page if it has a destroy method
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }
    
    this.currentPage = new PageComponent()
    
    const main = document.querySelector('main')
    main.innerHTML = ''
    main.appendChild(this.currentPage.render())
    
    // Manage both page and main content z-index for neural network interaction
    const isHomePage = route === ''
    const pageElement = main.querySelector('.page')
    
    if (isHomePage) {
      main.style.zIndex = '5' // Lower z-index on home page
      if (pageElement) pageElement.style.zIndex = '5' // Also lower page z-index
    } else {
      main.style.zIndex = '10' // Higher z-index on other pages
      if (pageElement) pageElement.style.zIndex = '10' // Also higher page z-index
    }
    
    console.log(`Page rendered: ${route}, main z-index: ${main.style.zIndex}, page z-index: ${pageElement?.style.zIndex}`)
    
    // Handle neural network interactivity based on page
    if (window.portfolioLayout?.neuralNetwork) {
      if (isHomePage) {
        console.log('Returned to home page - enabling neural network interactivity')
        setTimeout(() => {
          if (window.portfolioLayout.neuralNetwork.forceSetupEventListeners) {
            window.portfolioLayout.neuralNetwork.forceSetupEventListeners()
          }
          if (window.portfolioLayout.neuralNetwork.createBioConnections) {
            window.portfolioLayout.neuralNetwork.createBioConnections()
          }
        }, 100)
      } else {
        console.log('Left home page - hiding bio info and disabling interactivity')
        // Hide any active bio info when leaving home page
        if (window.portfolioLayout.neuralNetwork.hideInfo) {
          window.portfolioLayout.neuralNetwork.hideInfo()
        }
        // Clear any listeners to ensure non-interactivity
        if (window.portfolioLayout.neuralNetwork.disableInteractivity) {
          window.portfolioLayout.neuralNetwork.disableInteractivity()
        }
      }
    }
  }

  updateNavigation(activeRoute) {
    document.querySelectorAll('[data-route]').forEach(link => {
      const route = link.getAttribute('data-route').slice(1) || ''
      link.classList.toggle('active', route === activeRoute)
    })
  }
}