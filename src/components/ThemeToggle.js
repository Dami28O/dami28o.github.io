/**
 * ThemeToggle Component
 * Handles switching between light and dark themes
 * Follows the system setting until the visitor picks a theme,
 * then persists that choice in localStorage
 */
export class ThemeToggle {
  constructor() {
    this.media = window.matchMedia('(prefers-color-scheme: dark)')
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
    this.button = null
  }

  /**
   * Render the theme toggle button
   * @returns {HTMLElement} The theme toggle button element
   */
  render() {
    const toggle = document.createElement('button')
    toggle.className = 'theme-toggle'
    toggle.type = 'button'
    // Small half-filled disc, then the name of the mode it switches to
    toggle.innerHTML = `
      <svg class="theme-toggle-icon" viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M10 2 A8 8 0 0 1 10 18 Z" fill="currentColor" />
      </svg>
      <span class="theme-toggle-label"></span>
    `
    this.button = toggle
    this.updateLabel()

    toggle.addEventListener('click', () => this.toggleTheme())

    // Track system changes until the visitor makes an explicit choice
    this.media.addEventListener('change', (e) => {
      if (this.getSavedTheme()) return
      this.applyTheme(e.matches ? 'dark' : 'light')
    })

    return toggle
  }

  getSavedTheme() {
    try {
      return localStorage.getItem('theme')
    } catch (e) {
      return null
    }
  }

  /**
   * Toggle between light and dark themes and save the choice
   */
  toggleTheme() {
    const next = this.currentTheme === 'light' ? 'dark' : 'light'
    this.applyTheme(next)
    try {
      localStorage.setItem('theme', next)
    } catch (e) {
      // Storage blocked: the choice lasts for this visit only
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)
    this.updateLabel()
  }

  updateLabel() {
    if (!this.button) return
    const next = this.currentTheme === 'light' ? 'dark' : 'light'
    this.button.querySelector('.theme-toggle-label').textContent = `${next[0].toUpperCase()}${next.slice(1)} mode`
    this.button.setAttribute('aria-label', `Switch to ${next} mode`)
  }
}
