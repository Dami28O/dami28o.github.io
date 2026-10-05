/**
 * Contact Page Component
 * Email as the main way in, with a copy button, then other links
 */
export class Contact {
  constructor() {
    this.contactData = null
    this.copyTimer = null
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
      this.contactData = null
    }
  }

  /**
   * Show a link without its protocol, e.g. github.com/Dami28O
   * @param {string} url
   * @returns {string}
   */
  displayUrl(url) {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  }

  /**
   * Render the contact page
   * @returns {HTMLElement} The complete contact page element
   */
  render() {
    const page = document.createElement('div')
    page.className = 'page contact-page'
    page.innerHTML = `
      <div class="contact-scroll">
        <p class="loading">Loading contact details</p>
      </div>
    `

    const container = page.querySelector('.contact-scroll')
    this.loadContactData().then(() => {
      if (!this.contactData) {
        container.innerHTML = '<p class="loading">Contact details could not be loaded. Refresh the page to try again.</p>'
        return
      }
      this.renderContact(container)
    })

    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })

    return page
  }

  renderContact(container) {
    const { links, cv } = this.contactData

    container.innerHTML = `
      <div class="contact-content">
        <p class="contact-intro">Drop me an email.</p>

        <div class="contact-email">
          <a class="contact-email-address" href="mailto:${links.email}">${links.email.replace('@', '<wbr>@')}</a>
          <button type="button" class="contact-copy">Copy</button>
        </div>

        <ul class="contact-list">
          <li>
            <a class="contact-row" href="${links.linkedin}" target="_blank" rel="noopener noreferrer">
              <span class="contact-row-label">LinkedIn</span>
              <span class="contact-row-value">${this.displayUrl(links.linkedin)}</span>
            </a>
          </li>
          <li>
            <a class="contact-row" href="${links.github}" target="_blank" rel="noopener noreferrer">
              <span class="contact-row-label">GitHub</span>
              <span class="contact-row-value">${this.displayUrl(links.github)}</span>
            </a>
          </li>
          <li>
            <a class="contact-row" href="${cv.path}" download="${cv.filename}">
              <span class="contact-row-label">CV</span>
              <span class="contact-row-value">Download PDF</span>
            </a>
          </li>
        </ul>
      </div>
    `

    const button = container.querySelector('.contact-copy')
    const address = container.querySelector('.contact-email-address')
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(links.email)
        this.showCopied(button)
      } catch (error) {
        // Clipboard blocked: select the address so it can be copied by hand
        const range = document.createRange()
        range.selectNodeContents(address)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        button.textContent = 'Press Ctrl+C to copy'
      }
    })
  }

  showCopied(button) {
    button.textContent = 'Copied'
    button.classList.add('is-copied')
    clearTimeout(this.copyTimer)
    this.copyTimer = setTimeout(() => {
      button.textContent = 'Copy'
      button.classList.remove('is-copied')
    }, 2000)
  }

  destroy() {
    clearTimeout(this.copyTimer)
  }
}
