export class ProjectCard {
  constructor(projectData) {
    this.data = projectData
    this.isExpanded = false
  }

  render() {
    const card = document.createElement('div')
    card.className = 'project-card'
    card.setAttribute('data-project-id', this.data.id)
    
    card.innerHTML = `
      <div class="project-header" role="button" tabindex="0">
        <h3 class="project-name">${this.data.name}</h3>
        <span class="project-dates">${this.data.dates}</span>
        <span class="expand-indicator">+</span>
      </div>
      <div class="project-details">
        ${this.data.images && this.data.images.length > 0 ? `
          <div class="project-images">
            ${this.data.images.map(image => `<img src="${image}" alt="${this.data.name}" class="project-image" loading="lazy">`).join('')}
          </div>
        ` : ''}
        <p class="project-description">${this.data.description}</p>
        <div class="project-technologies">
          ${this.data.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
        ${this.data.externalLink ? `<a href="${this.data.externalLink}" target="_blank" rel="noopener noreferrer" class="project-link">View Project →</a>` : ''}
      </div>
    `
    
    // Add click handler
    const header = card.querySelector('.project-header')
    header.addEventListener('click', () => this.toggleExpanded(card))
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.toggleExpanded(card)
      }
    })
    
    return card
  }

  toggleExpanded(card) {
    this.isExpanded = !this.isExpanded
    const details = card.querySelector('.project-details')
    const indicator = card.querySelector('.expand-indicator')
    
    if (this.isExpanded) {
      card.classList.add('expanded')
      indicator.textContent = '−'
      details.style.maxHeight = details.scrollHeight + 'px'
    } else {
      card.classList.remove('expanded')
      indicator.textContent = '+'
      details.style.maxHeight = '0'
    }
  }
}