export class ThemeToggle {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light'
  }

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

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', this.currentTheme)
    localStorage.setItem('theme', this.currentTheme)
    
    // Update icon
    const icon = document.querySelector('.theme-toggle-icon')
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '◐' : '◑'
    }
  }
}