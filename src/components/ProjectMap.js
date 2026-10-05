import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'

const SVG_NS = 'http://www.w3.org/2000/svg'
const MOBILE_BREAKPOINT = 768
// A tool becomes a hub when at least this many projects share it
const MIN_SHARED = 2
// Labels sit to the right of their dot, this far from its centre
const LABEL_OFFSET = { project: 11, tech: 7 }
const LABEL_HALF_HEIGHT = 9

/**
 * Collision force for label boxes: each node is treated as the rectangle
 * covering its dot and its label, and overlapping rectangles are pushed
 * apart along the axis with the smaller overlap
 */
function labelCollide(padding = 5, strength = 0.7) {
  let nodes = []

  const box = (node) => ({
    left: node.x - 6 - padding,
    right: node.x + LABEL_OFFSET[node.type] + node.labelWidth + padding,
    top: node.y - LABEL_HALF_HEIGHT - padding / 2,
    bottom: node.y + LABEL_HALF_HEIGHT + padding / 2
  })

  function force() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      const boxA = box({ ...a, x: a.x + a.vx, y: a.y + a.vy })
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const boxB = box({ ...b, x: b.x + b.vx, y: b.y + b.vy })
        const overlapX = Math.min(boxA.right, boxB.right) - Math.max(boxA.left, boxB.left)
        const overlapY = Math.min(boxA.bottom, boxB.bottom) - Math.max(boxA.top, boxB.top)
        if (overlapX <= 0 || overlapY <= 0) continue

        if (overlapX < overlapY) {
          const direction = (boxA.left + boxA.right) < (boxB.left + boxB.right) ? -1 : 1
          const shift = (overlapX / 2) * strength * direction
          a.vx += shift
          b.vx -= shift
        } else {
          const direction = a.y < b.y ? -1 : 1
          const shift = (overlapY / 2) * strength * direction
          a.vy += shift
          b.vy -= shift
        }
      }
    }
  }

  force.initialize = (n) => { nodes = n }
  return force
}

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

    // Resolve link ends to node objects so both layouts can use them
    const byId = new Map(this.nodes.map(node => [node.id, node]))
    this.links.forEach(link => {
      link.source = byId.get(link.source)
      link.target = byId.get(link.target)
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
      <p class="map-caption"></p>
    `
    const touch = window.matchMedia('(hover: none)').matches
    root.querySelector('.map-caption').textContent = touch
      ? 'Projects, linked by the tools they share. Tap to preview, tap again to open.'
      : 'Projects, linked by the tools they share. Hover to preview, click to open.'

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
          <text class="map-label" x="${LABEL_OFFSET.project}" dy="0.35em"></text>
        `
      } else {
        g.setAttribute('aria-hidden', 'true')
        g.innerHTML = `
          <circle class="map-hit" r="12"></circle>
          <circle class="map-dot" r="2.5"></circle>
          <text class="map-label" x="${LABEL_OFFSET.tech}" dy="0.35em"></text>
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
    const left = Math.min(260, this.width * 0.22)
    const top = Math.min(190, this.height * 0.24)
    const bottom = 64
    const right = 48
    return {
      left,
      top,
      right: this.width - right,
      bottom: this.height - bottom,
      cx: left + (this.width - right - left) / 2,
      cy: top + (this.height - bottom - top) / 2
    }
  }

  async start() {
    // Label widths drive the layout, so wait for the web fonts first
    if (document.fonts?.ready) await document.fonts.ready
    if (!this.root.isConnected) return
    this.measure()
    this.layout()
    this.root.classList.add('is-ready')

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(this.root)
  }

  /**
   * Phones get a two-column ladder (tools left, projects right);
   * larger screens get the force-directed map
   */
  layout() {
    this.measureLabels()
    const mode = window.innerWidth <= MOBILE_BREAKPOINT ? 'ladder' : 'force'
    if (mode !== this.mode && this.simulation) {
      this.simulation.stop()
      this.simulation = null
    }
    this.mode = mode
    this.root.classList.toggle('is-ladder', mode === 'ladder')

    if (mode === 'ladder') {
      this.layoutLadder()
      if (!this.reducedMotion) setTimeout(() => this.playHint(), 400)
    } else {
      this.root.style.height = ''
      this.measure()
      this.layoutForce()
    }
  }

  layoutForce() {
    const bounds = this.getBounds()
    const areaWidth = bounds.right - bounds.left
    const areaHeight = bounds.bottom - bounds.top
    const scale = Math.sqrt(areaWidth * areaHeight)

    // Reduced motion gets a settled layout; otherwise it blooms from the centre
    const animate = !this.reducedMotion
    this.nodes.forEach((node, i) => {
      if (animate) {
        const angle = (i / this.nodes.length) * Math.PI * 2
        node.x = bounds.cx + Math.cos(angle) * 20
        node.y = bounds.cy + Math.sin(angle) * 20
      } else {
        // Spread seeds over the area on a sunflower spiral so the
        // precomputed layout starts untangled
        const t = Math.sqrt((i + 0.5) / this.nodes.length)
        const angle = i * 2.39996
        node.x = bounds.cx + Math.cos(angle) * t * areaWidth * 0.45
        node.y = bounds.cy + Math.sin(angle) * t * areaHeight * 0.45
      }
    })

    // Centring is weaker along the longer side so the map fills the area
    const wide = areaWidth >= areaHeight
    this.simulation = forceSimulation(this.nodes)
      .force('link', forceLink(this.links).distance(scale * 0.13).strength(0.25))
      .force('charge', forceManyBody()
        .strength(d => (d.type === 'project' ? -1 : -0.3) * scale * 0.75))
      .force('collide', forceCollide(d => (d.type === 'project' ? 10 : 6)))
      .force('labels', labelCollide())
      .force('x', forceX(bounds.cx).strength(wide ? 0.012 : 0.03))
      .force('y', forceY(bounds.cy).strength(wide ? 0.05 : 0.03))
      .on('tick', () => this.tick())

    if (animate) {
      this.simulation.on('end', () => this.playHint())
    } else {
      this.simulation.stop()
      this.settle(300)
    }
  }

  /**
   * Two columns: tools on the left, projects evenly spaced on the right.
   * Both are ordered by the average position of their neighbours
   * (barycentre method) to cut down on crossing links.
   */
  layoutLadder() {
    const ROW_GAP = 40
    const PAD = 14
    let projects = this.nodes.filter(node => node.type === 'project')
    let tools = this.nodes.filter(node => node.type === 'tech')

    const position = (list) => new Map(list.map((node, i) => [node.id, list.length > 1 ? i / (list.length - 1) : 0.5]))
    const barycentre = (node, positions) => {
      const values = [...this.neighbours.get(node.id)].map(id => positions.get(id))
      return values.reduce((sum, v) => sum + v, 0) / values.length
    }
    for (let pass = 0; pass < 8; pass++) {
      const projectPositions = position(projects)
      tools = [...tools].sort((a, b) => barycentre(a, projectPositions) - barycentre(b, projectPositions))
      const toolPositions = position(tools)
      projects = [...projects].sort((a, b) => barycentre(a, toolPositions) - barycentre(b, toolPositions))
    }

    const height = PAD * 2 + (projects.length - 1) * ROW_GAP
    this.root.style.height = `${height}px`
    this.measure()

    const toolX = 4
    const longestProject = Math.max(...projects.map(node => node.labelWidth))
    const projectX = Math.max(140, this.width - longestProject - LABEL_OFFSET.project - 4)

    projects.forEach((node, i) => {
      node.x = projectX
      node.y = PAD + i * ROW_GAP
    })
    const toolGap = (height - PAD * 2) / Math.max(1, tools.length - 1)
    tools.forEach((node, i) => {
      node.x = toolX
      node.y = PAD + i * toolGap
    })
    this.tick()
  }

  /**
   * Record each label's rendered width for collision and bounds
   */
  measureLabels() {
    this.nodes.forEach(node => {
      const text = node.el.querySelector('.map-label')
      node.labelWidth = text.getComputedTextLength() || node.label.length * 6.4
    })
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
    const oldMode = this.mode
    this.measure()
    const mode = window.innerWidth <= MOBILE_BREAKPOINT ? 'ladder' : 'force'
    if (mode === oldMode && oldWidth === this.width && oldHeight === this.height) return

    // Crossing the breakpoint, or any resize of the ladder, lays out afresh
    if (mode !== oldMode || mode === 'ladder') {
      this.layout()
      return
    }

    // Crossing the phone breakpoint changes the label font size
    this.measureLabels()
    const bounds = this.getBounds()
    this.simulation.force('x').x(bounds.cx)
    this.simulation.force('y').y(bounds.cy)
    if (this.reducedMotion) {
      this.simulation.stop()
      this.simulation.alpha(0.3)
      this.settle(120)
    } else {
      this.simulation.alpha(0.3).restart()
    }
  }

  /**
   * Keep nodes (and their labels) inside the drawable area
   */
  clampNodes() {
    const bounds = this.getBounds()
    this.nodes.forEach(node => {
      const labelRoom = LABEL_OFFSET[node.type] + node.labelWidth + 4
      node.x = Math.max(bounds.left + 8, Math.min(bounds.right - labelRoom, node.x))
      node.y = Math.max(bounds.top + 8, Math.min(bounds.bottom - 8, node.y))
    })
  }

  /**
   * Advance the layout without animating; manual ticks fire no events,
   * so clamping happens here on every step
   */
  settle(steps) {
    for (let i = 0; i < steps; i++) {
      this.simulation.tick()
      this.clampNodes()
    }
    this.tick()
  }

  tick() {
    if (this.mode === 'force') this.clampNodes()
    this.nodes.forEach(node => {
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
    if (this.mode === 'ladder') {
      // On phones the preview is a sheet fixed to the bottom of the screen
      this.preview.style.left = ''
      this.preview.style.top = ''
      return
    }

    const gap = 24
    const width = this.preview.offsetWidth
    const height = this.preview.offsetHeight
    const labelWidth = LABEL_OFFSET.project + node.labelWidth

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
