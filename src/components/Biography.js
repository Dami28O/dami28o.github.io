export class Biography {
  constructor() {
    this.bioData = null
  }

  async loadBioData() {
    try {
      const response = await fetch('/src/data/bio.json')
      this.bioData = await response.json()
    } catch (error) {
      console.error('Error loading bio data:', error)
      this.bioData = {
        biography: "Biography content will be loaded here."
      }
    }
  }

  render() {
    const bio = document.createElement('div')
    bio.className = 'biography'
    
    bio.innerHTML = `
      <p class="biography-text">Loading biography...</p>
    `
    
    // Load and render biography
    this.loadBioData().then(() => {
      if (this.bioData) {
        bio.querySelector('.biography-text').textContent = this.bioData.biography
      }
    })
    
    return bio
  }
}