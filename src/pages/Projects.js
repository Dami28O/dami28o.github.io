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
    this.activeGroup = 'All'
  }

  /**
   * Normalize group labels for robust comparisons
   * @param {string} value - Group label
   * @returns {string} Normalized group label
   */
  normalizeGroup(value) {
    if (typeof value !== 'string') return ''
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
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
        <div class="projects-filters" role="tablist" aria-label="Project groups"></div>
        <div class="projects-list"></div>
      </div>
    `
    
    const filtersContainer = page.querySelector('.projects-filters')
    const projectsList = page.querySelector('.projects-list')
    projectsList.innerHTML = '<p class="loading">Loading projects...</p>'
    
    // Load and render projects
    this.loadProjectsData().then(() => {
      this.renderFilters(filtersContainer, projectsList)
      this.renderProjects(projectsList, this.activeGroup)
    })
    
    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })

    return page
  }

  /**
   * Get available filter groups from project data
   * @returns {string[]} List of group labels including the default "All"
   */
  getFilterGroups() {
    if (!this.projectsData || !this.projectsData.projects) {
      return ['All']
    }

    const groups = new Map()

    this.projectsData.projects.forEach(project => {
      if (typeof project.group === 'string') {
        const label = project.group.trim()
        const normalized = this.normalizeGroup(label)

        if (label && normalized && !groups.has(normalized)) {
          groups.set(normalized, label)
        }
      }
    })

    return ['All', ...groups.values()]
  }

  /**
   * Render filter controls above the project list
   * @param {HTMLElement} container - Filter controls container
   * @param {HTMLElement} projectsList - Project cards container
   */
  renderFilters(container, projectsList) {
    const groups = this.getFilterGroups()

    // Hide the filter bar when there is no custom grouping yet.
    if (groups.length <= 1) {
      container.innerHTML = ''
      container.style.display = 'none'
      this.activeGroup = 'All'
      return
    }

    container.style.display = 'flex'
    container.textContent = ''

    groups.forEach(group => {
      const button = document.createElement('button')
      const isActive = group === this.activeGroup

      button.className = `project-filter-button${isActive ? ' is-active' : ''}`
      button.type = 'button'
      button.dataset.group = group
      button.setAttribute('role', 'tab')
      button.setAttribute('aria-selected', isActive ? 'true' : 'false')
      button.textContent = group

      button.addEventListener('click', () => {
        this.activeGroup = button.dataset.group || 'All'
        this.updateActiveFilterState(container)
        this.renderProjects(projectsList, this.activeGroup)
      })

      container.appendChild(button)
    })
  }

  /**
   * Update active/inactive visual states for filter controls
   * @param {HTMLElement} container - Filter controls container
   */
  updateActiveFilterState(container) {
    const filterButtons = container.querySelectorAll('.project-filter-button')

    filterButtons.forEach(button => {
      const group = button.dataset.group || 'All'
      const isActive = group === this.activeGroup

      button.classList.toggle('is-active', isActive)
      button.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })
  }

  /**
   * Render individual project cards
   * @param {HTMLElement} container - Container element for project cards
   * @param {string} group - Active group filter
   */
  renderProjects(container, group = 'All') {
    if (!this.projectsData || !this.projectsData.projects) return

    this.projectCards = []
    container.innerHTML = ''

    const filteredProjects = this.projectsData.projects.filter(project => {
      if (this.normalizeGroup(group) === this.normalizeGroup('All')) return true
      return this.normalizeGroup(project.group) === this.normalizeGroup(group)
    })

    if (filteredProjects.length === 0) {
      container.innerHTML = '<p class="loading">No projects in this group yet.</p>'
      return
    }

    filteredProjects.forEach(project => {
      const projectCard = new ProjectCard(project)
      this.projectCards.push(projectCard)
      container.appendChild(projectCard.render())
    })
  }
}