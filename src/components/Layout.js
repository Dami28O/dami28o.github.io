import { Navigation } from './Navigation.js'
import { ThemeToggle } from './ThemeToggle.js'
import { NeuralNetwork } from './NeuralNetwork.js'

/**
 * Layout Component
 * Main layout container that manages the overall page structure
 * Features:
 * - Neural network background management
 * - Theme toggle integration
 * - Navigation component
 * - Global layout state management
 */
export class Layout {
  constructor() {
    this.navigation = new Navigation()
    this.themeToggle = new ThemeToggle()
    this.neuralNetwork = null
    
    // Store reference globally for restart functionality
    window.portfolioLayout = this
  }

  /**
   * Render the main layout structure
   * @returns {HTMLElement} The complete layout element
   */
  render() {
    const layout = document.createElement('div')
    layout.className = 'layout'
    
    layout.innerHTML = `
      <div class="layout-frame">
        <div class="neural-network-container"></div>
        <header class="header">
          <div class="header-content">
            <h1 class="name">Dami Ogunleye</h1>
            <p class="role">Robotics & AI Engineer</p>
          </div>
          <div class="theme-toggle-container"></div>
        </header>
        
        <nav class="navigation"></nav>
        
        <main class="main-content"></main>
      </div>
    `
    
    // Mount components
    layout.querySelector('.navigation').appendChild(this.navigation.render())
    layout.querySelector('.theme-toggle-container').appendChild(this.themeToggle.render())
    
    // Initialize neural network for all pages
    const networkContainer = layout.querySelector('.neural-network-container')
    try {
      this.neuralNetwork = new NeuralNetwork(networkContainer)
      
      // Create bio connections after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (this.neuralNetwork && typeof this.neuralNetwork.createBioConnections === 'function') {
          this.neuralNetwork.createBioConnections()
        }
      }, 500)
    } catch (error) {
      console.error('Error creating neural network in layout:', error)
    }
    
    return layout
  }

  /**
   * Restart the neural network (used for recovery after email client interruption)
   */
  async restartNeuralNetwork() {
    const networkContainer = document.querySelector('.neural-network-container')
    if (!networkContainer) {
      console.error('Neural network container not found')
      return
    }
    
    try {
      // Destroy existing network if it exists
      if (this.neuralNetwork) {
        try {
          this.neuralNetwork.destroy()
        } catch (destroyError) {
          console.warn('Error destroying existing neural network:', destroyError)
        }
        this.neuralNetwork = null
      }
      
      // Clear container completely
      networkContainer.innerHTML = ''
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Create new network
      this.neuralNetwork = new NeuralNetwork(networkContainer)
      
      // Create bio connections after a short delay
      setTimeout(() => {
        if (this.neuralNetwork && typeof this.neuralNetwork.createBioConnections === 'function') {
          this.neuralNetwork.createBioConnections()
        }
        
        // Force setup of event listeners for home page when we return there
        if (this.neuralNetwork && typeof this.neuralNetwork.forceSetupEventListeners === 'function') {
          this.neuralNetwork.forceSetupEventListeners()
        }
      }, 500)
    } catch (error) {
      console.error('Error restarting neural network:', error)
    }
  }

  /**
   * Clean up layout resources
   */
  destroy() {
    if (this.neuralNetwork) {
      this.neuralNetwork.destroy()
    }
  }
}