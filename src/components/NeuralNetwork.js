import * as THREE from 'three'

export class NeuralNetwork {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.nodes = []
    this.connections = []
    this.infoNodes = {}
    this.infoConnections = []
    this.infoTargetNodes = {}
    this.activeInfo = null
    this.bioData = null
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.animationId = null
    this.backupTimer = null
    this.clickCooldown = false
    this.listenersAdded = false
    
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

  async loadBioData() {
    try {
      const response = await fetch('/data/bio.json')
      this.bioData = await response.json()
      console.log('Bio data loaded:', this.bioData)
    } catch (error) {
      console.error('Error loading bio data:', error)
    }
  }

  setupScene() {
    // Use main content area dimensions
    const mainContent = document.querySelector('.main-content')
    const width = mainContent ? mainContent.clientWidth : this.container.clientWidth || window.innerWidth
    const height = mainContent ? mainContent.clientHeight : this.container.clientHeight || window.innerHeight
    
    console.log('Neural Network container dimensions:', width, height)
    console.log('Container element:', this.container)

    // Scene
    this.scene = new THREE.Scene()

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    )
    this.camera.position.z = 50

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Ensure proper positioning and clickability
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0'
    this.renderer.domElement.style.left = '0'
    this.renderer.domElement.style.cursor = 'default'
    this.renderer.domElement.style.pointerEvents = 'auto'
    
    this.container.appendChild(this.renderer.domElement)

    console.log('Neural Network initialized successfully')
    console.log('Canvas element:', this.renderer.domElement)
    console.log('Canvas style:', this.renderer.domElement.style.cssText)
    console.log('Container z-index:', window.getComputedStyle(this.container).zIndex)
    console.log('Canvas z-index:', window.getComputedStyle(this.renderer.domElement).zIndex)
    
    // Check what element is actually at the canvas position
    setTimeout(() => {
      const rect = this.renderer.domElement.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const elementAtCenter = document.elementFromPoint(centerX, centerY)
      console.log('🎯 Element blocking canvas at center:', elementAtCenter)
      console.log('🎯 Element classes:', elementAtCenter?.className)
      console.log('🎯 Element z-index:', elementAtCenter ? window.getComputedStyle(elementAtCenter).zIndex : 'none')
      console.log('🎯 Canvas rect:', rect)
    }, 2000)
    

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize())
    
    // Handle page visibility changes to prevent neural network from stopping
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Page hidden - starting backup timer')
        // Start backup timer when page is hidden
        this.backupTimer = setInterval(() => {
          this.renderFrame()
        }, 16) // ~60fps
      } else {
        console.log('Page visible - clearing backup timer')
        // Clear backup timer when page is visible
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
    
    console.log(`Planning ${bioNodesPerType} nodes for each of ${infoTypes.length} types`)
    console.log('Bio node positions:', bioNodePositions)
    
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
            console.log(`Creating distributed ${infoType} node at global position ${globalNodeIndex} (layer ${layer.x}) with color:`, hexColor)
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
          
          console.log(`Created ${infoType} node at position:`, node.position, 'with color:', infoColor.getHexString())
        }

        this.scene.add(node)
        this.nodes.push(node)
      }
    })
    
    // Log the final distribution
    console.log('Final bio node distribution:')
    Object.entries(this.infoNodes).forEach(([type, nodes]) => {
      console.log(`${type}: ${nodes.length} nodes`)
    })
  }

  createConnections() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: isDark ? 0x555555 : 0x333333,
      transparent: true,
      opacity: isDark ? 0.4 : 0.2
    })

    // Connect nodes between adjacent layers
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i]
        const nodeB = this.nodes[j]
        const distance = nodeA.position.distanceTo(nodeB.position)

        // Only connect nearby nodes
        if (distance < 25 && Math.random() > 0.7) {
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
      }
    }
  }

  createBioConnections() {
    const isHomePage = !window.location.hash || window.location.hash === '#'
    console.log('Creating bio connections - home page:', isHomePage)
    
    // Only setup info system on home page
    if (isHomePage) {
      if (this.bioData && this.bioData.sections) {
        // Create target nodes for each section
        Object.entries(this.bioData.sections).forEach(([key, section]) => {
          const targetGeometry = new THREE.SphereGeometry(0.1, 8, 8)
          const targetMaterial = new THREE.MeshBasicMaterial({ 
            color: section.color, 
            transparent: true, 
            opacity: 0 
          })
          const targetNode = new THREE.Mesh(targetGeometry, targetMaterial)
          targetNode.position.set(section.position.x, section.position.y, 10)
          this.scene.add(targetNode)
          
          this.infoTargetNodes[key] = targetNode
        })
        
        console.log('Info system initialized. Sections:', Object.keys(this.bioData.sections))
        console.log('Info nodes available:', this.infoNodes)
        
        // Ensure all info nodes are properly set up
        this.restoreAllInfoNodes()
      }
    } else {
      console.log('Not home page - bio interaction system disabled')
    }
  }

  restoreAllInfoNodes() {
    console.log('Restoring all info nodes...')
    Object.entries(this.infoNodes).forEach(([infoType, nodeArray]) => {
      nodeArray.forEach((node, index) => {
        if (node.userData.infoColor) {
          node.visible = true
          node.material.color.copy(node.userData.infoColor)
          node.material.opacity = Math.max(0.7, node.material.opacity)
          node.scale.setScalar(Math.max(1.8, node.scale.x))
          console.log(`Restored ${infoType} node ${index}:`, node.userData.infoColor.getHexString())
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
    console.log('showInfo called with:', infoType, 'bioData available:', !!this.bioData)
    
    if (!this.bioData || !this.bioData.sections[infoType]) {
      console.error('Bio data or section not available for:', infoType)
      return
    }
    
    // Simply hide any currently active info immediately - no transition
    if (this.activeInfo) {
      console.log('Hiding previous info immediately:', this.activeInfo)
      this.hideInfo()
    }
    
    this.activeInfo = infoType
    const section = this.bioData.sections[infoType]
    const targetNode = this.infoTargetNodes[infoType]
    
    console.log('Section data:', section)
    console.log('Target node available:', !!targetNode)
    
    if (!targetNode) {
      console.warn('No target node for:', infoType, 'creating bio connections...')
      this.createBioConnections()
      return
    }
    
    // Create connections from info nodes of this type to target
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: section.color,
      transparent: true,
      opacity: 0
    })
    
    // Connect all nodes of this type to the target position
    if (this.infoNodes[infoType]) {
      console.log('Creating connections for', this.infoNodes[infoType].length, 'nodes')
      this.infoNodes[infoType].forEach(node => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          node.position,
          targetNode.position
        ])
        
        const connection = new THREE.Line(geometry, connectionMaterial.clone())
        connection.userData = {
          sourceNode: node,
          targetNode: targetNode,
          maxOpacity: 0.6,
          isInfoConnection: true,
          infoType: infoType,
          activationTime: Date.now()
        }
        
        this.scene.add(connection)
        this.infoConnections.push(connection)
      })
    }
    
    // Show the actual info text
    this.showInfoText(section)
    
    console.log(`${infoType} info revealed! Active info is now:`, this.activeInfo)
  }


  hideInfo() {
    if (!this.activeInfo) return
    
    console.log(`Hiding ${this.activeInfo} info immediately...`)
    
    const previousInfoType = this.activeInfo
    
    // Remove info connections
    this.infoConnections.forEach(connection => {
      this.scene.remove(connection)
      if (connection.geometry) connection.geometry.dispose()
      if (connection.material) connection.material.dispose()
    })
    this.infoConnections = []
    
    // Hide info text immediately
    this.hideInfoText()
    
    // Clear active info immediately
    this.activeInfo = null
    
    console.log(`${previousInfoType} info hidden immediately`)
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
        console.log('Mobile: Appended info card to body')
      } else {
        document.querySelector('.home-content').appendChild(infoElement)
        console.log('Desktop: Appended info card to home-content')
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
      console.log(`Positioning ${section.title} at bottom for mobile`)
      
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
      
      console.log(`Positioning ${section.title} at ${leftPercent}% left, ${topPercent}% top`)
      
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
        console.log('Mobile card shown at bottom, final styles:', {
          position: infoElement.style.position,
          bottom: infoElement.style.bottom,
          left: infoElement.style.left,
          zIndex: infoElement.style.zIndex,
          width: infoElement.style.width,
          opacity: infoElement.style.opacity
        })
      } else {
        infoElement.style.transform = 'translate(-50%, -50%) scale(1)'
      }
    })
    
    console.log(`${section.title} info displayed at position:`, { leftPercent, topPercent })
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
    console.log('Setting up event listeners')
    console.log('Current page hash:', window.location.hash)
    console.log('Is home page:', isHomePage)
    
    // Only add interactive event listeners on home page
    if (!isHomePage) {
      console.log('Not home page - skipping interactive event listeners')
      return
    }
    
    this.addInteractiveListeners()
  }

  forceSetupEventListeners() {
    console.log('Force setting up event listeners for any page')
    this.addInteractiveListeners()
  }

  addInteractiveListeners() {
    // Prevent adding listeners multiple times
    if (this.listenersAdded) {
      console.log('Interactive listeners already added, skipping')
      return
    }
    
    // Test basic click detection first
    this.container.addEventListener('click', () => {
      console.log('BASIC CLICK DETECTED on container!')
    })
    
    // Add click listener after renderer is created
    setTimeout(() => {
      console.log('Adding click listener to canvas')
      
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
        console.log('CANVAS CLICK DETECTED!')
        event.stopPropagation()
        
        const rect = this.renderer.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        console.log('Mouse coordinates:', mouse.x, mouse.y)
        console.log('Bio data available:', !!this.bioData)
        console.log('Info nodes available:', Object.keys(this.infoNodes))
        Object.entries(this.infoNodes).forEach(([type, nodes]) => {
          console.log(`${type} nodes count:`, nodes.length)
          nodes.forEach((node, i) => {
            console.log(`  ${type} node ${i}:`, {
              visible: node.visible,
              opacity: node.material.opacity,
              color: node.material.color.getHexString(),
              position: node.position
            })
          })
        })
        
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
        
        console.log('Total visible info nodes for intersection:', allInfoNodes.length)
        const intersects = this.raycaster.intersectObjects(allInfoNodes)
        console.log('Ray intersections found:', intersects.length)
        
        // Special debugging for goals (blue) nodes
        if (intersects.length > 0) {
          const clickedNode = intersects[0].object
          if (clickedNode.userData.infoType === 'goals') {
            console.log('*** GOALS (BLUE) NODE CLICKED ***')
            console.log('Goals node data:', {
              type: clickedNode.userData.infoType,
              visible: clickedNode.visible,
              opacity: clickedNode.material.opacity,
              color: clickedNode.material.color.getHexString(),
              position: clickedNode.position
            })
          }
        }
        
        if (intersects.length > 0) {
          const clickedNode = intersects[0].object
          const infoType = clickedNode.userData.infoType
          console.log(`${infoType} node clicked!`, clickedNode.position)
          console.log('Current active info:', this.activeInfo)
          console.log('Bio data for clicked type:', this.bioData?.sections?.[infoType])
          
          // Prevent rapid clicking issues
          if (this.clickCooldown) {
            console.log('Click cooldown active, ignoring click')
            return
          }
          
          this.clickCooldown = true
          setTimeout(() => {
            this.clickCooldown = false
          }, 300)
          
          if (this.activeInfo === infoType) {
            console.log('Hiding current info')
            this.hideInfo()
          } else {
            console.log('Showing new info:', infoType)
            
            // Special debugging for 'about' section
            if (infoType === 'about') {
              console.log('*** ABOUT SECTION CLICKED ***')
              console.log('About nodes available:', this.infoNodes.about?.length || 0)
              console.log('Current about nodes visibility:', this.infoNodes.about?.map(n => ({ visible: n.visible, opacity: n.material.opacity, color: n.material.color.getHexString() })))
            }
            
            this.showInfo(infoType, clickedNode)
          }
        } else {
          console.log('No intersections found with info nodes')
          // Click on empty space - hide any active info
          if (this.activeInfo) {
            console.log('Clicked empty space, hiding active info')
            this.hideInfo()
          }
        }
      })
      
      this.listenersAdded = true
      console.log('Interactive listeners added successfully')
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


  renderFrame() {
    // Debug: Check if renderer still exists
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
          
          // Extra safety for about nodes
          if (node.userData.infoType === 'about' && node.material.opacity < 0.6) {
            node.material.opacity = 0.7
            console.log('*** Boosted about node opacity')
          }
          
          // Extra safety for goals nodes (blue) - prevent flashing
          if (node.userData.infoType === 'goals') {
            if (node.material.opacity < 0.6 || !node.visible) {
              node.visible = true
              node.material.opacity = Math.max(0.7, node.material.opacity)
              node.material.color.copy(node.userData.infoColor)
              console.log('*** Stabilized goals (blue) node')
            }
          }
        }
      })
    })
    
    // Animate info connections if they exist
    if (this.infoConnections.length > 0) {
      this.activateInfoConnections()
    }
    
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

  adjustForMobile() {
    // Simple mobile adjustment - just log for now
    const isMobile = window.innerWidth <= 768
    console.log('Screen size:', isMobile ? 'mobile' : 'desktop', 'width:', window.innerWidth)
  }


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