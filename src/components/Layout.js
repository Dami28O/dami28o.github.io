import { Navigation } from './Navigation.js'
import { ThemeToggle } from './ThemeToggle.js'

/**
 * Layout Component
 * Main layout container that manages the overall page structure
 * Features:
 * - Theme toggle integration
 * - Navigation component
 */
export class Layout {
  constructor() {
    this.navigation = new Navigation()
    this.themeToggle = new ThemeToggle()
  }

  /**
   * Render the main layout structure
   * @returns {HTMLElement} The complete layout element
   */
  render() {
    const layout = document.createElement('div')
    layout.className = 'layout'

    layout.innerHTML = `
      <div class="layout-frame">
        <header class="header">
          <div class="header-content">
            <h1 class="name">Damilola Ogunleye</h1>
            <p class="role">Robotics & ML Engineer</p>
          </div>
          <div class="theme-toggle-container"></div>
        </header>

        <nav class="navigation"></nav>

        <main class="main-content"></main>
      </div>
    `

    // Mount components
    layout.querySelector('.navigation').appendChild(this.navigation.render())
    layout.querySelector('.theme-toggle-container').appendChild(this.themeToggle.render())

    return layout
  }
}
