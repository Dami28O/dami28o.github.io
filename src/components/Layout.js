import { Navigation } from './Navigation.js'
import { ThemeToggle } from './ThemeToggle.js'
import { NeuralNetwork } from './NeuralNetwork.js'

export class Layout {
  constructor() {
    this.navigation = new Navigation()
    this.themeToggle = new ThemeToggle()
    this.neuralNetwork = null
  }

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
      console.log('Neural network initialized in layout')
      
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


  destroy() {
    if (this.neuralNetwork) {
      this.neuralNetwork.destroy()
    }
  }
}