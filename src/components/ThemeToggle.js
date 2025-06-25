/**
 * ThemeToggle Component
 * Handles switching between light and dark themes
 * Persists theme preference in localStorage
 */
export class ThemeToggle {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light'
  }

  /**
   * Render the theme toggle button
   * @returns {HTMLElement} The theme toggle button element
   */
  render() {
    const toggle = document.createElement('button')
    toggle.className = 'theme-toggle'
    toggle.setAttribute('aria-label', 'Toggle theme')
    toggle.innerHTML = `
      <span class="theme-toggle-icon">
        ${this.currentTheme === 'light' ? '◐' : '◑'}
      </span>
    `
    
    toggle.addEventListener('click', () => this.toggleTheme())
    
    return toggle
  }

  /**
   * Toggle between light and dark themes
   * Updates DOM attributes and saves preference
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', this.currentTheme)
    localStorage.setItem('theme', this.currentTheme)
    
    // Update icon to reflect new theme
    const icon = document.querySelector('.theme-toggle-icon')
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '◐' : '◑'
    }
  }
}