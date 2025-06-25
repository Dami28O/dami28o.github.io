import * as THREE from 'three'

/**
 * Interactive Neural Network Component
 * Creates a 3D neural network visualization with clickable bio information nodes
 * Features:
 * - Dynamic node and connection generation across multiple layers
 * - Interactive bio nodes that display information when clicked
 * - Theme-aware styling (light/dark mode)
 * - Page-specific interactivity (interactive on home, background on other pages)
 * - Mobile responsive design
 * - Connection highlighting based on selected bio categories
 */
export class NeuralNetwork {
  constructor(container) {
    // Core Three.js components
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    
    // Network structure
    this.nodes = []
    this.connections = []
    
    // Bio information system
    this.infoNodes = {}
    this.activeInfo = null
    this.bioData = null
    
    // Interaction handling
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.listenersAdded = false
    this.clickCooldown = false
    
    // Animation and lifecycle
    this.animationId = null
    this.backupTimer = null
    
    this.init()
  }

  async init() {
    this.setupScene()
    await this.loadBioData()
    this.createNodes()
    this.createConnections()
    this.setupEventListeners()
    
    // Apply mobile adjustments if needed
    this.adjustForMobile()
    
    this.animate()
  }

  /**
   * Load biographical data from JSON file
   * Contains information sections for different bio categories
   */
  async loadBioData() {
    try {
      const response = await fetch('/data/bio.json')
      this.bioData = await response.json()
    } catch (error) {
      console.error('Error loading bio data:', error)
    }
  }

  /**
   * Initialize Three.js scene, camera, and renderer
   * Sets up the 3D environment and handles responsive sizing
   */
  setupScene() {
    // Calculate container dimensions
    const mainContent = document.querySelector('.main-content')
    const width = mainContent ? mainContent.clientWidth : this.container.clientWidth || window.innerWidth
    const height = mainContent ? mainContent.clientHeight : this.container.clientHeight || window.innerHeight

    // Initialize Three.js components
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.z = 50

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Position canvas properly
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0'
    this.renderer.domElement.style.left = '0'
    this.renderer.domElement.style.cursor = 'default'
    this.renderer.domElement.style.pointerEvents = 'auto'
    
    this.container.appendChild(this.renderer.domElement)

    // Event listeners
    window.addEventListener('resize', () => this.onWindowResize())
    
    // Handle page visibility to maintain animation during focus changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Use backup timer when page is hidden (e.g., email client opens)
        this.backupTimer = setInterval(() => this.renderFrame(), 16)
      } else {
        // Clear backup timer when page regains focus
        if (this.backupTimer) {
          clearInterval(this.backupTimer)
          this.backupTimer = null
        }
      }
    })
  }

  createNodes() {
    const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    
    // Create multiple layers of nodes (neural network structure)
    const layers = [
      { count: 6, x: -30, spread: 20 },
      { count: 8, x: -10, spread: 25 },
      { count: 10, x: 10, spread: 30 },
      { count: 6, x: 30, spread: 20 }
    ]

    // Plan consistent bio nodes distribution across all layers
    const bioNodesPerType = 3 // 3 nodes of each type
    const infoTypes = this.bioData ? Object.keys(this.bioData.sections) : []
    const totalBioNodes = bioNodesPerType * infoTypes.length
    const totalRegularNodes = layers.reduce((sum, layer) => sum + layer.count, 0)
    
    // Pre-calculate which nodes will be bio nodes (distributed evenly)
    const bioNodePositions = []
    for (let i = 0; i < totalBioNodes; i++) {
      const position = Math.floor((i * totalRegularNodes) / totalBioNodes)
      bioNodePositions.push(position)
    }
    
    let globalNodeIndex = 0

    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        // Base material (inactive state)
        const nodeMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x444444,
          transparent: true,
          opacity: 0.6
        })

        const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
        
        // Position nodes in layers
        node.position.x = layer.x + (Math.random() - 0.5) * 10
        node.position.y = (i - layer.count / 2) * (layer.spread / layer.count) + (Math.random() - 0.5) * 5
        node.position.z = (Math.random() - 0.5) * 20
        
        // Store original properties with theme-aware colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        
        // Determine if this is an info node and which type (distributed across layers)
        let infoType = null
        let infoColor = null
        
        // Check if current global position should be a bio node
        const bioNodeIndex = bioNodePositions.indexOf(globalNodeIndex)
        if (bioNodeIndex !== -1 && this.bioData) {
          const typeIndex = Math.floor(bioNodeIndex / bioNodesPerType)
          infoType = infoTypes[typeIndex]
          
          // Use colors from bio data
          if (this.bioData.sections[infoType]) {
            const hexColor = this.bioData.sections[infoType].color
            infoColor = new THREE.Color(hexColor)
          }
        }
        
        globalNodeIndex++
        
        node.userData = {
          originalColor: new THREE.Color(isDark ? 0x666666 : 0x444444),
          activeColor: new THREE.Color(0x00ff88),
          pulseColor: new THREE.Color(0x0088ff),
          originalOpacity: isDark ? 0.8 : 0.6,
          isActive: false,
          infoType: infoType,
          infoColor: infoColor,
          activationTime: 0,
          pulsePhase: Math.random() * Math.PI * 2
        }
        
        // Make info nodes visible
        if (infoType && infoColor) {
          // Set the color and make it permanent by storing it in userData
          node.material.color.copy(infoColor)
          node.material.opacity = 1.0
          node.scale.set(2.0, 2.0, 2.0) // Keep consistent sizing
          
          // Store the info color in userData so it persists
          node.userData.infoColor = infoColor.clone()
          node.userData.isInfoNode = true
          
          // Group nodes by type
          if (!this.infoNodes[infoType]) {
            this.infoNodes[infoType] = []
          }
          this.infoNodes[infoType].push(node)
        }

        this.scene.add(node)
        this.nodes.push(node)
      }
    })
  }

  createConnections() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: isDark ? 0x555555 : 0x333333,
      transparent: true,
      opacity: isDark ? 0.4 : 0.2
    })

    // Track which nodes have connections
    const connectedNodes = new Set()

    // First pass: Create connections with higher probability for closer nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i]
        const nodeB = this.nodes[j]
        const distance = nodeA.position.distanceTo(nodeB.position)

        // Dynamic connection probability based on distance
        let connectionChance = 0
        if (distance < 15) {
          connectionChance = 0.8 // 80% chance for very close nodes
        } else if (distance < 25) {
          connectionChance = 0.5 // 50% chance for close nodes
        } else if (distance < 35) {
          connectionChance = 0.2 // 20% chance for medium distance
        }

        if (Math.random() < connectionChance) {
          this.createConnection(nodeA, nodeB, connectionMaterial, isDark)
          connectedNodes.add(nodeA)
          connectedNodes.add(nodeB)
        }
      }
    }

    // Second pass: Ensure every node has at least one connection
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i]
      
      if (!connectedNodes.has(node)) {
        // Find the closest node that has connections
        let closestNode = null
        let closestDistance = Infinity
        
        for (let j = 0; j < this.nodes.length; j++) {
          if (i === j) continue
          
          const otherNode = this.nodes[j]
          const distance = node.position.distanceTo(otherNode.position)
          
          if (distance < closestDistance) {
            closestDistance = distance
            closestNode = otherNode
          }
        }
        
        if (closestNode) {
          this.createConnection(node, closestNode, connectionMaterial, isDark)
          connectedNodes.add(node)
          connectedNodes.add(closestNode)
        }
      }
    }
  }

  createConnection(nodeA, nodeB, connectionMaterial, isDark) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      nodeA.position,
      nodeB.position
    ])

    const connection = new THREE.Line(geometry, connectionMaterial.clone())
    connection.userData = {
      nodeA: nodeA,
      nodeB: nodeB,
      originalOpacity: isDark ? 0.4 : 0.2,
      isActive: false
    }

    this.scene.add(connection)
    this.connections.push(connection)
  }

  createBioConnections() {
    const isHomePage = !window.location.hash || window.location.hash === '#'
    
    // Only setup info system on home page
    if (isHomePage) {
      if (this.bioData && this.bioData.sections) {
        // Ensure all info nodes are properly set up
        this.restoreAllInfoNodes()
      }
    } else {
      // Make sure no bio info is showing on non-home pages
      this.disableInteractivity()
    }
  }

  restoreAllInfoNodes() {
    Object.entries(this.infoNodes).forEach(([infoType, nodeArray]) => {
      nodeArray.forEach((node, index) => {
        if (node.userData.infoColor) {
          node.visible = true
          node.material.color.copy(node.userData.infoColor)
          node.material.opacity = Math.max(0.7, node.material.opacity)
          node.scale.setScalar(Math.max(1.8, node.scale.x))
        }
      })
    })
  }

  ensureInfoNodesVisible() {
    Object.entries(this.infoNodes).forEach(([infoType, nodeArray]) => {
      nodeArray.forEach(node => {
        if (node.userData.infoColor) {
          if (!node.visible || node.material.opacity < 0.3) {
            node.visible = true
            node.material.color.copy(node.userData.infoColor)
            node.material.opacity = Math.max(0.5, node.material.opacity)
          }
        }
      })
    })
  }

  showInfo(infoType, activatingNode) {
    if (!this.bioData || !this.bioData.sections[infoType]) {
      console.error('Bio data or section not available for:', infoType)
      return
    }
    
    // Simply hide any currently active info immediately - no transition
    if (this.activeInfo) {
      this.hideInfo()
    }
    
    this.activeInfo = infoType
    const section = this.bioData.sections[infoType]
    
    // Light up existing connections that connect to nodes of this type
    this.lightUpConnections(infoType, section.color)
    
    // Show the actual info text
    this.showInfoText(section)
  }

  lightUpConnections(infoType, color) {
    const infoNodes = this.infoNodes[infoType] || []
    
    // Find all existing connections that connect to any node of this type
    this.connections.forEach(connection => {
      const nodeA = connection.userData.nodeA
      const nodeB = connection.userData.nodeB
      
      // Check if either end of the connection is an info node of the selected type
      const isConnectedToInfoNode = infoNodes.includes(nodeA) || infoNodes.includes(nodeB)
      
      if (isConnectedToInfoNode) {
        // Store original properties for restoration
        if (!connection.userData.originalColor) {
          connection.userData.originalColor = connection.material.color.clone()
          connection.userData.originalOpacity = connection.material.opacity
        }
        
        // Light up the connection with the info node color
        connection.material.color.setHex(color.replace('#', '0x'))
        connection.material.opacity = 0.8
        connection.userData.isHighlighted = true
        connection.userData.highlightType = infoType
        connection.userData.activationTime = Date.now() * 0.001 // For animation offset
      }
    })
  }


  hideInfo() {
    if (!this.activeInfo) return
    
    // Restore original connection colors
    this.restoreConnectionColors()
    
    // Hide info text immediately
    this.hideInfoText()
    
    // Clear active info immediately
    this.activeInfo = null
  }

  restoreConnectionColors() {
    this.connections.forEach(connection => {
      if (connection.userData.isHighlighted) {
        // Restore original color and opacity
        if (connection.userData.originalColor) {
          connection.material.color.copy(connection.userData.originalColor)
        }
        if (connection.userData.originalOpacity !== undefined) {
          connection.material.opacity = connection.userData.originalOpacity
        }
        
        // Clear highlight flags
        connection.userData.isHighlighted = false
        connection.userData.highlightType = null
      }
    })
  }

  animateHighlightedConnections() {
    if (!this.activeInfo) return
    
    const time = Date.now() * 0.005
    this.connections.forEach(connection => {
      if (connection.userData.isHighlighted) {
        // Create a flowing pulse effect
        const pulse = Math.sin(time + connection.userData.activationTime || 0) * 0.3 + 0.7
        connection.material.opacity = Math.max(0.4, pulse * 0.9)
      }
    })
  }

  showInfoText(section) {
    // Create or update info display element
    let infoElement = document.querySelector('.info-display')
    if (!infoElement) {
      infoElement = document.createElement('div')
      infoElement.className = 'info-display'
      
      // For mobile, append to body to avoid any container restrictions
      const isMobile = window.innerWidth <= 768
      if (isMobile) {
        document.body.appendChild(infoElement)
      } else {
        document.querySelector('.home-content').appendChild(infoElement)
      }
    }
    
    infoElement.innerHTML = `
      <h3 class="info-title">${section.title}</h3>
      <p class="info-content">${section.content}</p>
    `
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768
    
    if (isMobile) {
      // Mobile: Position at bottom of page
      infoElement.style.position = 'fixed'
      infoElement.style.left = '50%'
      infoElement.style.bottom = '20px'
      infoElement.style.top = 'auto'
      infoElement.style.transform = 'translateX(-50%)'
      infoElement.style.width = 'calc(100vw - 40px)'
      infoElement.style.maxWidth = '400px'
      infoElement.style.zIndex = '100' // Very high z-index for mobile
    } else {
      // Desktop: Use position from bio.json data to place info in different locations
      const { x, y } = section.position
      
      // Convert world coordinates to screen percentages
      const leftPercent = Math.max(5, Math.min(70, 50 + (x / 100) * 50))
      const topPercent = Math.max(10, Math.min(80, 50 + (y / 100) * 50))
      
      infoElement.style.position = 'fixed'
      infoElement.style.left = `${leftPercent}%`
      infoElement.style.top = `${topPercent}%`
      infoElement.style.bottom = 'auto'
      infoElement.style.transform = 'translate(-50%, -50%)'
      infoElement.style.width = 'auto'
      infoElement.style.maxWidth = '400px'
    }
    infoElement.style.opacity = '0'
    infoElement.style.transition = 'all 0.8s ease-out'
    infoElement.style.display = 'block'
    
    // Add colored border based on section color
    infoElement.style.borderColor = section.color
    infoElement.style.borderWidth = '2px'
    
    // Force immediate display and smoother transition
    requestAnimationFrame(() => {
      infoElement.style.opacity = '1'
      if (isMobile) {
        infoElement.style.transform = 'translateX(-50%) scale(1)'
      } else {
        infoElement.style.transform = 'translate(-50%, -50%) scale(1)'
      }
    })
  }

  hideInfoText() {
    const infoElement = document.querySelector('.info-display')
    if (infoElement) {
      // Immediate disappearance - no transition
      infoElement.style.display = 'none'
      infoElement.style.opacity = '0'
    }
  }

  activateInfoConnections() {
    if (!this.activeInfo || this.infoConnections.length === 0) return
    
    // Animate info connections with flowing effect
    this.infoConnections.forEach((connection, index) => {
      const timeSinceActivation = (Date.now() - connection.userData.activationTime) / 1000
      const phase = (timeSinceActivation + index * 0.1) % 1.5
      
      if (phase < 1) {
        // Flowing animation from node to target
        const intensity = Math.sin(phase * Math.PI)
        connection.material.opacity = connection.userData.maxOpacity * intensity
        
        // Pulse the source info node
        if (connection.userData.sourceNode) {
          const node = connection.userData.sourceNode
          node.material.color.lerpColors(
            node.userData.infoColor,
            new THREE.Color(0xffffff),
            intensity * 0.3
          )
          node.material.opacity = node.userData.originalOpacity + intensity * 0.4
        }
      } else {
        connection.material.opacity = 0.1
      }
    })
  }

  setupEventListeners() {
    const isHomePage = !window.location.hash || window.location.hash === '#'
    
    // Only add interactive event listeners on home page
    if (!isHomePage) {
      return
    }
    
    this.addInteractiveListeners()
  }

  forceSetupEventListeners() {
    this.addInteractiveListeners()
  }

  disableInteractivity() {
    // Reset the listeners added flag so they can be re-added later
    this.listenersAdded = false
    
    // Hide any active info
    if (this.activeInfo) {
      this.hideInfo()
    }
    
    // Remove any info display elements
    const infoElement = document.querySelector('.info-display')
    if (infoElement) {
      infoElement.remove()
    }
  }

  addInteractiveListeners() {
    // Prevent adding listeners multiple times
    if (this.listenersAdded) {
      return
    }
    
    // Add click listener after renderer is created
    setTimeout(() => {
      
      // Mouse move for cursor changes only (no color interactions)
      this.renderer.domElement.addEventListener('mousemove', (event) => {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        // Only update cursor, no color changes
        this.updateCursor()
      })
      
      // Click for info node activation
      this.renderer.domElement.addEventListener('click', (event) => {
        event.stopPropagation()
        
        const rect = this.renderer.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        this.raycaster.setFromCamera(mouse, this.camera)
        
        // Get all info nodes for intersection testing
        const allInfoNodes = []
        Object.values(this.infoNodes).forEach(nodeArray => {
          nodeArray.forEach(node => {
            if (node.visible && node.material.opacity > 0.3) {
              allInfoNodes.push(node)
            }
          })
        })
        
        const intersects = this.raycaster.intersectObjects(allInfoNodes)
        
        if (intersects.length > 0) {
          const clickedNode = intersects[0].object
          const infoType = clickedNode.userData.infoType
          
          // Prevent rapid clicking issues
          if (this.clickCooldown) {
            return
          }
          
          this.clickCooldown = true
          setTimeout(() => {
            this.clickCooldown = false
          }, 300)
          
          if (this.activeInfo === infoType) {
            this.hideInfo()
          } else {
            this.showInfo(infoType, clickedNode)
          }
        } else {
          // Click on empty space - hide any active info
          if (this.activeInfo) {
            this.hideInfo()
          }
        }
      })
      
      this.listenersAdded = true
    }, 100)
  }

  updateCursor() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // Get all info nodes for hover detection
    const allInfoNodes = []
    Object.values(this.infoNodes).forEach(nodeArray => {
      nodeArray.forEach(node => {
        if (node.visible && node.material.opacity > 0.3) {
          allInfoNodes.push(node)
        }
      })
    })
    
    const intersects = this.raycaster.intersectObjects(allInfoNodes)
    
    if (intersects.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.renderer.domElement.style.cursor = 'default'
    }
  }


  /**
   * Main render loop that updates animations and renders the scene
   * Handles neural network rotation, node pulsing, and connection highlighting
   */
  renderFrame() {
    if (!this.renderer || !this.scene) {
      console.error('Neural network renderer or scene missing!')
      return
    }
    
    // Add subtle rotation
    this.scene.rotation.y += 0.001
    
    // Periodically ensure info nodes are visible (every 2 seconds)
    if (Date.now() % 2000 < 16) { // Roughly every 2 seconds
      this.ensureInfoNodesVisible()
    }
    
    // Make info nodes pulse while preserving their colors
    const time = Date.now() * 0.003
    Object.values(this.infoNodes).forEach(nodeArray => {
      nodeArray.forEach(node => {
        if (node.userData.infoColor) {
          const pulse = Math.sin(time + node.userData.pulsePhase) * 0.3 + 0.7
          
          // Always preserve the info color and ensure visibility
          node.material.color.copy(node.userData.infoColor)
          
          // Special handling for about nodes - keep them extra visible
          const minOpacity = node.userData.infoType === 'about' ? 0.7 : 0.5
          node.material.opacity = Math.max(minOpacity, pulse * 0.8 + 0.2) // Minimum opacity to prevent disappearing
          node.scale.setScalar(1.8 + pulse * 0.4) // Larger scale for visibility
          node.visible = true // Ensure always visible
          
          // Extra brightness when it's the active info type
          if (this.activeInfo && node.userData.infoType === this.activeInfo) {
            node.material.opacity = Math.max(0.9, node.material.opacity)
            node.scale.setScalar(2.2 + pulse * 0.3) // Even bigger when active
          }
          
          // Ensure minimum opacity for about nodes
          if (node.userData.infoType === 'about' && node.material.opacity < 0.6) {
            node.material.opacity = 0.7
          }
          
          // Ensure goals nodes remain visible and stable
          if (node.userData.infoType === 'goals') {
            if (node.material.opacity < 0.6 || !node.visible) {
              node.visible = true
              node.material.opacity = Math.max(0.7, node.material.opacity)
              node.material.color.copy(node.userData.infoColor)
            }
          }
        }
      })
    })
    
    // Animate highlighted connections with a subtle pulse
    this.animateHighlightedConnections()
    
    this.renderer.render(this.scene, this.camera)
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate())
    this.renderFrame()
  }

  onWindowResize() {
    const mainContent = document.querySelector('.main-content')
    const width = mainContent ? mainContent.clientWidth : this.container.clientWidth || window.innerWidth
    const height = mainContent ? mainContent.clientHeight : this.container.clientHeight || window.innerHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    
    // Adjust camera and node scales for mobile
    this.adjustForMobile()
  }

  /**
   * Adjust display settings for mobile devices
   * Currently handles basic mobile detection for future enhancements
   */
  adjustForMobile() {
    const isMobile = window.innerWidth <= 768
    // Mobile adjustments can be added here as needed
  }


  /**
   * Clean up neural network resources and event listeners
   * Properly disposes of Three.js objects and removes DOM elements
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    if (this.backupTimer) {
      clearInterval(this.backupTimer)
    }
    
    // Clean up Three.js objects
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) object.material.dispose()
      })
    }
    
    if (this.renderer) {
      // Safely remove DOM element
      try {
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
        }
      } catch (error) {
        console.warn('Could not remove canvas element:', error)
      }
      this.renderer.dispose()
    }
    
    window.removeEventListener('resize', () => this.onWindowResize())
  }
}