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
      if (bio?.now?.text) page.appendChild(this.renderNote(bio.now))
      if (projects.length === 0) return

      const mapContainer = page.querySelector('.home-map')
      this.projectMap = new ProjectMap(projects, {
        onOpen: (id) => { window.location.hash = `projects/${id}` },
        getObstacles: () => this.textObstacles(page, mapContainer)
      })
      mapContainer.appendChild(this.projectMap.render())
    })

    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })

    return page
  }

  /**
   * "Currently working on" note, desktop only (hidden on phones in CSS)
   * @param {{text: string, updated?: string}} now - From bio.json
   */
  renderNote(now) {
    const note = document.createElement('aside')
    note.className = 'now-note'
    note.setAttribute('aria-label', 'Currently working on')
    note.innerHTML = `
      <p class="now-note-label">Currently working on</p>
      <button type="button" class="now-note-item" aria-pressed="false">
        <span class="now-note-box" aria-hidden="true"></span>
        <span class="now-note-text"><span class="now-note-strike"></span></span>
      </button>
      ${now.updated ? '<p class="now-note-date"></p>' : ''}
    `
    note.querySelector('.now-note-strike').textContent = now.text
    if (now.updated) note.querySelector('.now-note-date').textContent = `Updated ${now.updated}`

    // Click to tick it off like a to-do item, click again to undo
    const item = note.querySelector('.now-note-item')
    item.addEventListener('click', () => {
      const done = item.getAttribute('aria-pressed') !== 'true'
      item.setAttribute('aria-pressed', String(done))
    })
    return note
  }

  /**
   * The static text on the page (note, bio, caption) as padded rectangles
   * in map coordinates, so the interactive map keeps clear of it
   */
  textObstacles(page, mapContainer) {
    const m = mapContainer.getBoundingClientRect()
    const pad = 48
    return ['.now-note', '.home-bio', '.map-caption']
      .map(selector => page.querySelector(selector))
      .filter(el => el && el.offsetParent !== null && el.textContent.trim())
      .map(el => {
        const r = el.getBoundingClientRect()
        return {
          left: r.left - m.left - pad,
          top: r.top - m.top - pad,
          right: r.right - m.left + pad,
          bottom: r.bottom - m.top + pad
        }
      })
  }

  destroy() {
    if (this.projectMap) this.projectMap.destroy()
  }
}
