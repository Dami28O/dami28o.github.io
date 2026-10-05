import { Layout } from './components/Layout.js'
import { Home } from './pages/Home.js'
import { Projects } from './pages/Projects.js'
import { Contact } from './pages/Contact.js'

/**
 * Router Component
 * Handles client-side routing and page navigation
 * Features:
 * - Hash-based routing (#projects/3 opens project 3)
 * - Page lifecycle management
 */
export class Router {
  constructor() {
    this.routes = {
      '': Home,
      'projects': Projects,
      'contact': Contact
    }
    this.titles = {
      '': 'Damilola Ogunleye',
      'projects': 'Projects – Damilola Ogunleye',
      'contact': 'Contact – Damilola Ogunleye'
    }
    this.currentRoute = ''
    this.currentPage = null
    this.hasRendered = false
    this.layout = new Layout()
  }

  /**
   * Initialize the router and set up event listeners
   */
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
  }

  /**
   * Handle route changes and navigation
   */
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

  /**
   * Render the specified page
   * @param {string} route - The route to render
   */
  renderPage(route) {
    const PageComponent = this.routes[route]

    // Clean up previous page if it has a destroy method
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }

    this.currentPage = new PageComponent()
    document.title = this.titles[route]

    const main = document.querySelector('main')
    main.innerHTML = ''
    main.appendChild(this.currentPage.render())

    // After navigating, move focus into the new content so keyboard and
    // screen reader users start there (pages may focus something more specific)
    if (this.hasRendered) {
      requestAnimationFrame(() => {
        if (!main.contains(document.activeElement)) main.focus({ preventScroll: true })
      })
    }
    this.hasRendered = true
  }

  /**
   * Update navigation link active states
   * @param {string} activeRoute - The currently active route
   */
  updateNavigation(activeRoute) {
    document.querySelectorAll('[data-route]').forEach(link => {
      const route = link.getAttribute('data-route').slice(1) || ''
      link.classList.toggle('active', route === activeRoute)
      if (route === activeRoute) {
        link.setAttribute('aria-current', 'page')
      } else {
        link.removeAttribute('aria-current')
      }
    })
  }
}
