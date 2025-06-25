import { ProjectCard } from '../components/ProjectCard.js'

/**
 * Projects Page Component
 * Displays a list of portfolio projects in expandable cards
 * Features scrollable content and project image galleries
 */
export class Projects {
  constructor() {
    this.projectsData = null
    this.projectCards = []
  }

  /**
   * Load projects data from JSON file
   * @returns {Promise} Promise that resolves when data is loaded
   */
  async loadProjectsData() {
    try {
      const response = await fetch('/data/projects.json')
      this.projectsData = await response.json()
    } catch (error) {
      console.error('Error loading projects data:', error)
      this.projectsData = { projects: [] }
    }
  }

  /**
   * Render the projects page
   * @returns {HTMLElement} The complete projects page element
   */
  render() {
    const page = document.createElement('div')
    page.className = 'page projects-page'
    
    page.innerHTML = `
      <div class="projects-content">
        <div class="projects-list"></div>
      </div>
    `
    
    const projectsList = page.querySelector('.projects-list')
    projectsList.innerHTML = '<p class="loading">Loading projects...</p>'
    
    // Load and render projects
    this.loadProjectsData().then(() => {
      projectsList.innerHTML = ''
      this.renderProjects(projectsList)
    })
    
    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })
    
    return page
  }

  /**
   * Render individual project cards
   * @param {HTMLElement} container - Container element for project cards
   */
  renderProjects(container) {
    if (!this.projectsData || !this.projectsData.projects) return
    
    this.projectsData.projects.forEach(project => {
      const projectCard = new ProjectCard(project)
      this.projectCards.push(projectCard)
      container.appendChild(projectCard.render())
    })
  }
}