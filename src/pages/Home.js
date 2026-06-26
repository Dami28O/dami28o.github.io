import { Biography } from '../components/Biography.js'

/**
 * Home Page Component
 * Displays the main landing page with interactive neural network background
 * Features biography component and neural network interactions
 */
export class Home {
  constructor() {
    this.biography = new Biography()
  }

  /**
   * Render the home page
   * @returns {HTMLElement} The complete home page element
   */
  render() {
    const page = document.createElement('div')
    page.className = 'page home-page'

    page.innerHTML = `
      <div class="home-content">
        <div class="biography-container"></div>
      </div>
    `

    // Mount biography component
    page.querySelector('.biography-container').appendChild(this.biography.render())

    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })

    return page
  }
}