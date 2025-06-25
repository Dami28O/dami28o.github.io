/**
 * Navigation Component
 * Renders the main navigation links for the portfolio
 * Handles routing between different pages
 */
export class Navigation {
  constructor() {
    this.links = [
      { text: 'Home', route: '' },
      { text: 'Projects', route: 'projects' },
      { text: 'Contact', route: 'contact' }
    ]
  }

  /**
   * Render the navigation links
   * @returns {HTMLElement} Navigation container with all links
   */
  render() {
    const nav = document.createElement('div')
    nav.className = 'nav-links'
    
    this.links.forEach(link => {
      const linkElement = document.createElement('a')
      linkElement.href = `#${link.route}`
      linkElement.textContent = link.text
      linkElement.className = 'nav-link'
      linkElement.setAttribute('data-route', `#${link.route}`)
      
      nav.appendChild(linkElement)
    })
    
    return nav
  }
}