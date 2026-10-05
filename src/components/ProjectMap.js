import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'

const SVG_NS = 'http://www.w3.org/2000/svg'
const MOBILE_BREAKPOINT = 768
// A tool becomes a hub when at least this many projects share it
const MIN_SHARED = 2

/**
 * ProjectMap Component
 * Force-directed map of projects, linked through the tools they share.
 * Features:
 * - Hover or focus a project to highlight its tools and preview it
 * - Hover a tool to highlight the projects that use it
 * - Click (or Enter) opens the project; on touch, first tap previews
 * - Nodes can be dragged; layout respects reduced motion
 */
export class ProjectMap {
  constructor(projects, { onOpen } = {}) {
    this.projects = projects
    this.onOpen = onOpen || (() => {})
    this.nodes = []
    this.links = []
    this.simulation = null
    this.resizeObserver = null
    this.activeNode = null
    this.width = 0
    this.height = 0
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.buildGraph()
  }

  /**
   * Build project and tool nodes plus the links between them
   */
  buildGraph() {
    const counts = new Map()
    this.projects.forEach(project => {
      project.technologies.forEach(tech => counts.set(tech, (counts.get(tech) || 0) + 1))
    })

    const hubs = new Map()
    counts.forEach((count, tech) => {
      if (count >= MIN_SHARED) {
        hubs.set(tech, { id: `t:${tech}`, type: 'tech', label: tech, count })
      }
    })

    const projectNodes = this.projects.map(project => ({
      id: `p:${project.id}`,
      type: 'project',
      label: project.shortName || project.name,
      project
    }))

    this.nodes = [...projectNodes, ...hubs.values()]
    this.links = []
    projectNodes.forEach(node => {
      node.project.technologies.forEach(tech => {
        if (hubs.has(tech)) this.links.push({ source: node.id, target: `t:${tech}` })
      })
    })

    // Neighbour lookup for highlighting
    this.neighbours = new Map(this.nodes.map(node => [node.id, new Set()]))
    this.links.forEach(link => {
      this.neighbours.get(link.source).add(link.target)
      this.neighbours.get(link.target).add(link.source)
    })
  }

  /**
   * Render the map container; the layout starts once it is in the DOM
   * @returns {HTMLElement} The map element
   */
  render() {
    const root = document.createElement('div')
    root.className = 'project-map'

    root.innerHTML = `
      <svg class="map-svg" role="group" aria-label="Map of projects, linked by the tools they share">
        <g class="map-links"></g>
        <g class="map-nodes"></g>
      </svg>
      <div class="map-preview" aria-hidden="true" hidden>
        <div class="map-preview-media"><img alt="" /></div>
        <p class="map-preview-title"></p>
        <p class="map-preview-meta"></p>
      </div>
      <p class="map-caption">Projects, linked by the tools they share. Hover to preview, click to open.</p>
    `

    this.root = root
    this.svg = root.querySelector('.map-svg')
    this.preview = root.querySelector('.map-preview')
    this.createElements()

    requestAnimationFrame(() => this.start())
    return root
  }

  createElements() {
    const linkLayer = this.svg.querySelector('.map-links')
    const nodeLayer = this.svg.querySelector('.map-nodes')

    this.links.forEach(link => {
      link.el = document.createElementNS(SVG_NS, 'line')
      link.el.setAttribute('class', 'map-link')
      linkLayer.appendChild(link.el)
    })

    this.nodes.forEach(node => {
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('class', `map-node is-${node.type}`)

      if (node.type === 'project') {
        const { project } = node
        g.setAttribute('tabindex', '0')
        g.setAttribute('role', 'link')
        g.setAttribute('aria-label', `${project.name}, ${project.dates}. Open project`)
        g.innerHTML = `
          <circle class="map-hit" r="16"></circle>
          <circle class="map-ring" r="10"></circle>
          <circle class="map-dot" r="4.5"></circle>
          <text class="map-label" x="11" dy="0.35em"></text>
        `
      } else {
        g.setAttribute('aria-hidden', 'true')
        g.innerHTML = `
          <circle class="map-hit" r="12"></circle>
          <circle class="map-dot" r="2.5"></circle>
          <text class="map-label" x="7" dy="0.35em"></text>
        `
      }
      g.querySelector('.map-label').textContent = node.label
      node.el = g
      this.bindNodeEvents(node)
      nodeLayer.appendChild(g)
    })

    // Tapping or clicking empty space clears the highlight
    this.svg.addEventListener('pointerdown', (e) => {
      if (e.target === this.svg) this.clearActive()
    })
  }

  /**
   * Work out where the map may sit, leaving room for the name and nav
   */
  getBounds() {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
    const left = isMobile ? 16 : Math.min(260, this.width * 0.22)
    const top = isMobile ? 16 : Math.min(190, this.height * 0.24)
    const bottom = isMobile ? 16 : 64
    const right = isMobile ? 16 : 48
    return {
      left,
      top,
      right: this.width - right,
      bottom: this.height - bottom,
      cx: left + (this.width - right - left) / 2,
      cy: top + (this.height - bottom - top) / 2
    }
  }

  start() {
    if (!this.root.isConnected) return
    this.measure()

    const bounds = this.getBounds()
    const spread = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top)
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT

    // Seed positions close to the centre so the layout blooms outwards
    this.nodes.forEach((node, i) => {
      const angle = (i / this.nodes.length) * Math.PI * 2
      node.x = bounds.cx + Math.cos(angle) * 20
      node.y = bounds.cy + Math.sin(angle) * 20
    })

    this.simulation = forceSimulation(this.nodes)
      .force('link', forceLink(this.links).id(d => d.id)
        .distance(isMobile ? 40 : Math.max(50, spread * 0.12))
        .strength(0.3))
      .force('charge', forceManyBody()
        .strength(d => d.type === 'project' ? (isMobile ? -90 : -180) : (isMobile ? -40 : -70))
        .distanceMax(spread * 0.6))
      .force('collide', forceCollide(d => this.collideRadius(d)).strength(0.9).iterations(3))
      .force('x', forceX(bounds.cx).strength(0.06))
      .force('y', forceY(bounds.cy).strength(isMobile ? 0.06 : 0.1))
      .on('tick', () => this.tick())

    if (this.reducedMotion) {
      this.simulation.stop()
      for (let i = 0; i < 300; i++) this.simulation.tick()
      this.tick()
    } else {
      this.simulation.on('end', () => this.playHint())
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(this.root)
  }

  collideRadius(node) {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
    // Tool labels are hidden on phones until highlighted
    if (isMobile && node.type === 'tech') return 14
    const charWidth = node.type === 'project' ? (isMobile ? 5.8 : 6.4) : 5.4
    const labelWidth = node.label.length * charWidth
    // Labels sit to the right, so treat the node as a wide disc
    return (node.type === 'project' ? 12 : 8) + labelWidth / 2
  }

  measure() {
    const rect = this.root.getBoundingClientRect()
    this.width = rect.width
    this.height = rect.height
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`)
  }

  handleResize() {
    const oldWidth = this.width
    const oldHeight = this.height
    this.measure()
    if (!this.simulation || (oldWidth === this.width && oldHeight === this.height)) return

    const bounds = this.getBounds()
    this.simulation.force('x').x(bounds.cx)
    this.simulation.force('y').y(bounds.cy)
    if (this.reducedMotion) {
      for (let i = 0; i < 120; i++) this.simulation.tick()
      this.tick()
    } else {
      this.simulation.alpha(0.3).restart()
    }
  }

  tick() {
    const bounds = this.getBounds()

    this.nodes.forEach(node => {
      // Keep nodes (and their labels) inside the drawable area
      const labelRoom = node.type === 'project' ? Math.min(150, node.label.length * 6.2 + 14) : 40
      node.x = Math.max(bounds.left + 8, Math.min(bounds.right - labelRoom, node.x))
      node.y = Math.max(bounds.top + 8, Math.min(bounds.bottom - 8, node.y))
      node.el.setAttribute('transform', `translate(${node.x.toFixed(1)},${node.y.toFixed(1)})`)
    })

    this.links.forEach(link => {
      link.el.setAttribute('x1', link.source.x.toFixed(1))
      link.el.setAttribute('y1', link.source.y.toFixed(1))
      link.el.setAttribute('x2', link.target.x.toFixed(1))
      link.el.setAttribute('y2', link.target.y.toFixed(1))
    })

    if (this.activeNode && this.activeNode.type === 'project') this.positionPreview(this.activeNode)
  }

  /**
   * One pass of rings across the projects once the layout settles,
   * to show which dots can be opened
   */
  playHint() {
    if (this.hintPlayed) return
    this.hintPlayed = true
    this.nodes
      .filter(node => node.type === 'project')
      .forEach((node, i) => {
        node.el.style.setProperty('--hint-delay', `${i * 60}ms`)
        node.el.classList.add('is-hinting')
        node.el.addEventListener('animationend', () => node.el.classList.remove('is-hinting'), { once: true })
      })
  }

  bindNodeEvents(node) {
    const el = node.el
    let start = null
    let dragged = false

    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && !this.dragging) this.setActive(node)
    })
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !this.dragging) this.clearActive()
    })

    el.addEventListener('pointerdown', (e) => {
      start = { x: e.clientX, y: e.clientY, type: e.pointerType }
      dragged = false
      el.setPointerCapture(e.pointerId)
    })

    el.addEventListener('pointermove', (e) => {
      if (!start || !this.simulation) return
      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y)
      if (!dragged && distance < 5) return

      if (!dragged) {
        dragged = true
        this.dragging = true
        el.classList.add('is-dragging')
        if (!this.reducedMotion) this.simulation.alphaTarget(0.2).restart()
      }
      const rect = this.svg.getBoundingClientRect()
      node.fx = e.clientX - rect.left
      node.fy = e.clientY - rect.top
      if (this.reducedMotion) {
        node.x = node.fx
        node.y = node.fy
        this.tick()
      }
    })

    const endPointer = (e) => {
      if (!start) return
      const pointerType = start.type
      start = null
      el.classList.remove('is-dragging')

      if (dragged) {
        this.dragging = false
        node.fx = null
        node.fy = null
        if (!this.reducedMotion) this.simulation.alphaTarget(0)
        return
      }
      if (e.type === 'pointercancel') return

      if (node.type !== 'project') {
        // Tools have nothing to open; a tap toggles their highlight
        if (pointerType !== 'mouse') {
          this.activeNode === node ? this.clearActive() : this.setActive(node)
        }
        return
      }

      // Touch: first tap previews, second tap opens
      if (pointerType !== 'mouse' && this.activeNode !== node) {
        this.setActive(node)
        return
      }
      this.onOpen(node.project.id)
    }
    el.addEventListener('pointerup', endPointer)
    el.addEventListener('pointercancel', endPointer)

    if (node.type === 'project') {
      // Only keyboard focus previews; pointer focus is handled above,
      // otherwise a first tap on touch would preview and open at once
      el.addEventListener('focus', () => {
        if (el.matches(':focus-visible')) this.setActive(node)
      })
      el.addEventListener('blur', () => this.clearActive())
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.onOpen(node.project.id)
        }
      })
    }
  }

  setActive(node) {
    this.clearActive()
    this.activeNode = node
    const linked = this.neighbours.get(node.id)

    this.svg.classList.add('has-active')
    node.el.classList.add('is-active')
    this.nodes.forEach(other => {
      if (linked.has(other.id)) other.el.classList.add('is-linked')
    })
    this.links.forEach(link => {
      if (link.source.id === node.id || link.target.id === node.id) link.el.classList.add('is-linked')
    })

    if (node.type === 'project') this.showPreview(node)
  }

  clearActive() {
    if (!this.activeNode) return
    this.activeNode = null
    this.svg.classList.remove('has-active')
    this.svg.querySelectorAll('.is-active, .is-linked').forEach(el => {
      el.classList.remove('is-active', 'is-linked')
    })
    this.preview.hidden = true
  }

  showPreview(node) {
    const { project } = node
    const media = this.preview.querySelector('.map-preview-media')
    const img = media.querySelector('img')

    if (project.preview) {
      img.onload = () => {
        if (this.activeNode === node) this.positionPreview(node)
      }
      img.src = project.preview
      media.hidden = false
    } else {
      img.removeAttribute('src')
      media.hidden = true
    }
    this.preview.querySelector('.map-preview-title').textContent = project.name
    this.preview.querySelector('.map-preview-meta').textContent = project.dates
    this.preview.hidden = false
    this.positionPreview(node)
  }

  positionPreview(node) {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
    if (isMobile) {
      // On phones the preview docks to the bottom of the map
      this.preview.style.left = ''
      this.preview.style.top = ''
      return
    }

    const gap = 24
    const width = this.preview.offsetWidth
    const height = this.preview.offsetHeight
    const labelWidth = Math.min(150, node.label.length * 6.2 + 14)

    let left = node.x + labelWidth + gap
    if (left + width > this.width - 16) left = node.x - width - gap
    const top = Math.max(16, Math.min(this.height - height - 16, node.y - height / 2))

    this.preview.style.left = `${Math.max(16, left)}px`
    this.preview.style.top = `${top}px`
  }

  destroy() {
    if (this.simulation) this.simulation.stop()
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }
}
