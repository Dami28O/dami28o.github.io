const MOBILE_BREAKPOINT = 768

// Survives page re-renders, so returning from a project restores the list
const indexState = {
  group: 'All',
  scrollTop: 0,
  lastId: null
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

/**
 * Projects Page Component
 * #projects shows the index; #projects/<id> shows one project full width
 * Features:
 * - Group filters with counts
 * - Hover or focus a row to preview its image (desktop)
 * - Project pages with previous/next navigation; Escape returns to the index
 */
export class Projects {
  constructor() {
    this.projects = []
    this.onKeydown = null
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

  async loadProjectsData() {
    try {
      const response = await fetch('/data/projects.json')
      const data = await response.json()
      this.projects = data.projects || []
    } catch (error) {
      console.error('Error loading projects data:', error)
      this.projects = []
    }
  }

  isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT
  }

  /**
   * Read or set the scroll position of whichever element scrolls this page
   */
  getScroll() {
    return this.isMobile() ? window.scrollY : this.scroller.scrollTop
  }

  setScroll(value) {
    if (this.isMobile()) {
      window.scrollTo(0, value)
    } else {
      this.scroller.scrollTop = value
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
      <div class="projects-scroll">
        <p class="loading">Loading projects</p>
      </div>
    `
    this.scroller = page.querySelector('.projects-scroll')

    this.loadProjectsData().then(() => {
      const id = window.location.hash.slice(1).split('/')[1]
      const project = id && this.projects.find(p => String(p.id) === id)
      if (project) {
        this.renderDetail(project)
      } else {
        this.renderIndex()
      }
    })

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
    const groups = new Map()
    this.projects.forEach(project => {
      if (typeof project.group === 'string') {
        const label = project.group.trim()
        const normalized = this.normalizeGroup(label)
        if (label && !groups.has(normalized)) groups.set(normalized, label)
      }
    })
    return ['All', ...groups.values()]
  }

  countInGroup(group) {
    if (group === 'All') return this.projects.length
    return this.projects.filter(p => this.normalizeGroup(p.group) === this.normalizeGroup(group)).length
  }

  /* ---------- Index ---------- */

  renderIndex() {
    const groups = this.getFilterGroups()
    if (!groups.includes(indexState.group)) indexState.group = 'All'

    this.scroller.innerHTML = `
      <h2 class="sr-only">Projects</h2>
      <div class="projects-index">
        <div class="projects-list-column">
          ${groups.length > 1 ? `
            <div class="projects-filters" role="group" aria-label="Filter projects">
              ${groups.map(group => `
                <button type="button" class="project-filter-button" data-group="${escapeHtml(group)}"
                  aria-pressed="${group === indexState.group}">
                  ${escapeHtml(group)} <span class="project-filter-count">${this.countInGroup(group)}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
          <ol class="project-list"></ol>
        </div>
        <figure class="project-hover" aria-hidden="true" hidden>
          <div class="project-hover-media"><img alt="" /></div>
        </figure>
      </div>
    `

    this.scroller.querySelectorAll('.project-filter-button').forEach(button => {
      button.addEventListener('click', () => {
        indexState.group = button.dataset.group
        this.scroller.querySelectorAll('.project-filter-button').forEach(b => {
          b.setAttribute('aria-pressed', String(b === button))
        })
        this.renderRows()
      })
    })

    this.renderRows()

    // Coming back from a project: restore the list and focus where we were
    requestAnimationFrame(() => {
      this.setScroll(indexState.scrollTop)
      if (indexState.lastId != null) {
        const row = this.scroller.querySelector(`.project-row[data-id="${indexState.lastId}"]`)
        if (row) row.focus({ preventScroll: true })
      }
    })
  }

  renderRows() {
    const list = this.scroller.querySelector('.project-list')
    const hover = this.scroller.querySelector('.project-hover')
    const hoverImg = hover.querySelector('img')

    const visible = this.projects.filter(project =>
      indexState.group === 'All' ||
      this.normalizeGroup(project.group) === this.normalizeGroup(indexState.group)
    )

    if (visible.length === 0) {
      list.innerHTML = '<li class="loading">No projects in this group yet.</li>'
      return
    }

    list.innerHTML = visible.map(project => `
      <li>
        <a class="project-row" href="#projects/${project.id}" data-id="${project.id}">
          <span class="project-row-title">${escapeHtml(project.name)}</span>
          <span class="project-row-year">${escapeHtml(project.dates)}</span>
          <span class="project-row-tools">${escapeHtml(project.technologies.slice(0, 3).join(', '))}</span>
        </a>
      </li>
    `).join('')

    const showPreview = (project) => {
      if (!project.preview || this.isMobile()) {
        hover.hidden = true
        return
      }
      hoverImg.src = project.preview
      hover.hidden = false
    }
    const hidePreview = () => { hover.hidden = true }

    list.querySelectorAll('.project-row').forEach(row => {
      const project = visible.find(p => String(p.id) === row.dataset.id)
      row.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showPreview(project) })
      row.addEventListener('focus', () => showPreview(project))
      row.addEventListener('click', () => {
        indexState.scrollTop = this.getScroll()
        indexState.lastId = project.id
      })
    })
    list.addEventListener('pointerleave', hidePreview)
    list.addEventListener('focusout', (e) => {
      if (!list.contains(e.relatedTarget)) hidePreview()
    })
  }

  /* ---------- Project page ---------- */

  renderDetail(project) {
    const index = this.projects.indexOf(project)
    const previous = this.projects[index - 1]
    const next = this.projects[index + 1]
    // The web-sized copy is sharp enough and far lighter than the original
    const image = project.preview || (project.images && project.images[0])
    indexState.lastId = project.id
    document.title = `${project.shortName || project.name} – Damilola Ogunleye`

    this.scroller.innerHTML = `
      <article class="project-detail">
        <a class="project-back" href="#projects">All projects</a>

        <header class="project-detail-header">
          <h2 class="project-detail-title" tabindex="-1">${escapeHtml(project.name)}</h2>
        </header>

        <div class="project-detail-layout">
          <div class="project-detail-main">
            <p class="project-detail-meta">
              <span>${escapeHtml(project.dates)}</span>
              ${project.group ? `<span>${escapeHtml(project.group)}</span>` : ''}
            </p>
            <div class="project-detail-description">${project.description}</div>
          </div>

          <aside class="project-detail-side" aria-label="Project details">
            ${image ? `
              <figure class="project-detail-media">
                <img src="${image}" alt="${escapeHtml(project.name)}" />
              </figure>
            ` : ''}
            <div class="project-detail-facts">
              <h3 class="project-facts-label">Tools</h3>
              <ul class="project-tools">
                ${project.technologies.map(tech => `<li>${escapeHtml(tech)}</li>`).join('')}
              </ul>
              ${project.externalLink ? `
                <a class="project-detail-link" href="${project.externalLink}" target="_blank" rel="noopener noreferrer">View project</a>
              ` : ''}
            </div>
          </aside>
        </div>

        <nav class="project-pager" aria-label="More projects">
          ${previous ? `
            <a class="project-pager-link is-previous" href="#projects/${previous.id}">
              <span class="project-pager-label">Previous project</span>
              <span class="project-pager-title">${escapeHtml(previous.shortName || previous.name)}</span>
            </a>
          ` : '<span></span>'}
          ${next ? `
            <a class="project-pager-link is-next" href="#projects/${next.id}">
              <span class="project-pager-label">Next project</span>
              <span class="project-pager-title">${escapeHtml(next.shortName || next.name)}</span>
            </a>
          ` : ''}
        </nav>
      </article>
    `

    this.setScroll(0)
    this.scroller.querySelector('.project-detail-title').focus({ preventScroll: true })

    this.onKeydown = (e) => {
      if (e.key === 'Escape') window.location.hash = 'projects'
    }
    document.addEventListener('keydown', this.onKeydown)
  }

  destroy() {
    if (this.onKeydown) document.removeEventListener('keydown', this.onKeydown)
  }
}
