import { ProjectMap } from '../components/ProjectMap.js'

/**
 * Home Page Component
 * Landing page: a short bio and the interactive project map
 */
export class Home {
  constructor() {
    this.projectMap = null
  }

  /**
   * Load projects and bio data from JSON files
   * @returns {Promise<{projects: Array, bio: Object|null}>}
   */
  async loadData() {
    const [projects, bio] = await Promise.all([
      fetch('/data/projects.json').then(r => r.json()).then(d => d.projects).catch(() => []),
      fetch('/data/bio.json').then(r => r.json()).catch(() => null)
    ])
    return { projects, bio }
  }

  /**
   * Render the home page
   * @returns {HTMLElement} The complete home page element
   */
  render() {
    const page = document.createElement('div')
    page.className = 'page home-page'

    page.innerHTML = `
      <div class="home-map"></div>
      <p class="home-bio"></p>
    `

    this.loadData().then(({ projects, bio }) => {
      if (bio?.sections?.current) {
        page.querySelector('.home-bio').innerHTML = bio.sections.current.content
      }
      if (projects.length === 0) return

      this.projectMap = new ProjectMap(projects, {
        onOpen: (id) => { window.location.hash = `projects/${id}` }
      })
      page.querySelector('.home-map').appendChild(this.projectMap.render())
    })

    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })

    return page
  }

  destroy() {
    if (this.projectMap) this.projectMap.destroy()
  }
}
