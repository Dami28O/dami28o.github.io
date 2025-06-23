import { Biography } from '../components/Biography.js'

export class Home {
  constructor() {
    this.biography = new Biography()
  }

  render() {
    const page = document.createElement('div')
    page.className = 'page home-page'
    
    page.innerHTML = `
      <div class="home-content">
        <div class="biography-container"></div>
      </div>
    `
    
    // Mount biography component
    page.querySelector('.biography-container').appendChild(this.biography.render())
    
    // Add entrance animation
    requestAnimationFrame(() => {
      page.classList.add('page-enter-active')
    })
    
    return page
  }
}