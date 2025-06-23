import { ProjectCard } from '../components/ProjectCard.js'

export class Projects {
  constructor() {
    this.projectsData = null
    this.projectCards = []
  }

  async loadProjectsData() {
    try {
      const response = await fetch('/src/data/projects.json')
      this.projectsData = await response.json()
    } catch (error) {
      console.error('Error loading projects data:', error)
      this.projectsData = { projects: [] }
    }
  }

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

  renderProjects(container) {
    if (!this.projectsData || !this.projectsData.projects) return
    
    this.projectsData.projects.forEach(project => {
      const projectCard = new ProjectCard(project)
      this.projectCards.push(projectCard)
      container.appendChild(projectCard.render())
    })
  }
}