/**
 * Contact Page Component
 * Displays contact information and social links
 * Features special email handling for neural network recovery
 */
export class Contact {
  constructor() {
    this.contactData = null
  }

  /**
   * Load contact data from JSON file
   * @returns {Promise} Promise that resolves when data is loaded
   */
  async loadContactData() {
    try {
      const response = await fetch('/data/contact.json')
      this.contactData = await response.json()
    } catch (error) {
      console.error('Error loading contact data:', error)
      this.contactData = {
        links: {
          linkedin: "#",
          github: "#",
          email: "contact@example.com"
        },
        cv: {
          filename: "CV.pdf",
          path: "#"
        }
      }
    }
  }

  /**
   * Render the contact page
   * @returns {HTMLElement} The complete contact page element
   */
  render() {
    const page = document.createElement('div')
    page.className = 'page contact-page'
    
    page.innerHTML = `
      <div class="contact-content">
        <div class="contact-links"></div>
      </div>
    `
    
    const linksContainer = page.querySelector('.contact-links')
    linksContainer.innerHTML = '<p class="loading">Loading contact information...</p>'
    
    // Load and render contact links
    this.loadContactData().then(() => {
      linksContainer.innerHTML = ''
      this.renderContactLinks(linksContainer)
    })
    
    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })

    return page
  }

  /**
   * Render contact links and handle special email functionality
   * @param {HTMLElement} container - Container element for contact links
   */
  renderContactLinks(container) {
    if (!this.contactData) return
    
    const { links, cv } = this.contactData
    
    container.innerHTML = `
      <div class="contact-list">
        <a href="${links.linkedin}" target="_blank" rel="noopener noreferrer" class="contact-link">
          <span class="contact-label">LinkedIn</span>
        </a>
        <a href="${links.github}" target="_blank" rel="noopener noreferrer" class="contact-link">
          <span class="contact-label">GitHub</span>
        </a>
        <a href="mailto:${links.email}" class="contact-link email-link">
          <span class="contact-label">Email</span>
        </a>
        <a href="${cv.path}" download="${cv.filename}" class="contact-link">
          <span class="contact-label">Resume</span>
        </a>
      </div>
    `
    
    // Add special handling for email link to restart neural network if needed
    const emailLink = container.querySelector('.email-link')
    if (emailLink) {
      emailLink.addEventListener('click', () => {
        // Monitor and restart neural network if it disappears after email client opens
        setTimeout(() => {
          const canvas = document.querySelector('.neural-network-container canvas')
          if (!canvas || canvas.style.display === 'none') {
            this.restartNeuralNetwork()
          }
        }, 100)
      })
    }
  }

  /**
   * Restart the neural network if it becomes unavailable
   * Typically used after email client interruption
   */
  async restartNeuralNetwork() {
    // Use the layout's restart method if available
    if (window.portfolioLayout && typeof window.portfolioLayout.restartNeuralNetwork === 'function') {
      await window.portfolioLayout.restartNeuralNetwork()
    } else {
      console.error('Layout not available for neural network restart')
    }
  }
}