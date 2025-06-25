/**
 * Biography Component
 * Displays biographical information loaded from JSON data
 * Used on the home page as a fallback when neural network info is not available
 */
export class Biography {
  constructor() {
    this.bioData = null
  }

  /**
   * Load biographical data from JSON file
   * @returns {Promise} Promise that resolves when data is loaded
   */
  async loadBioData() {
    try {
      const response = await fetch('/data/bio.json')
      this.bioData = await response.json()
    } catch (error) {
      console.error('Error loading bio data:', error)
      this.bioData = {
        biography: "Biography content will be loaded here."
      }
    }
  }

  /**
   * Render the biography component
   * @returns {HTMLElement} The biography container element
   */
  render() {
    const bio = document.createElement('div')
    bio.className = 'biography'
    
    bio.innerHTML = `
      <p class="biography-text">Loading biography...</p>
    `
    
    // Load and render biography content
    this.loadBioData().then(() => {
      if (this.bioData) {
        bio.querySelector('.biography-text').textContent = this.bioData.biography
      }
    })
    
    return bio
  }
}