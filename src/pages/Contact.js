export class Contact {
  constructor() {
    this.contactData = null
  }

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
    
    // Add special handling for email link
    const emailLink = container.querySelector('.email-link')
    if (emailLink) {
      emailLink.addEventListener('click', () => {
        console.log('Email link clicked - neural network check')
        // Don't prevent default, just monitor and restart if needed
        setTimeout(() => {
          // Check if neural network is still running after email opens
          const canvas = document.querySelector('.neural-network-container canvas')
          
          if (!canvas || canvas.style.display === 'none') {
            console.warn('Neural network disappeared - restarting...')
            this.restartNeuralNetwork()
          }
        }, 100)
      })
    }
  }

  async restartNeuralNetwork() {
    // Use the layout's restart method if available
    if (window.portfolioLayout && typeof window.portfolioLayout.restartNeuralNetwork === 'function') {
      await window.portfolioLayout.restartNeuralNetwork()
    } else {
      console.error('Layout not available for neural network restart')
    }
  }
}