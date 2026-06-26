export class StickFigure {
  constructor(pose = 'home') {
    this.pose = pose
    this.element = null
  }

  // Mounts to <main> (not the page div) so position:fixed stays viewport-relative.
  // .page-enter-active applies transform:translateY(0) which creates a new containing
  // block for fixed descendants even though the transform is identity.
  // Cleanup is automatic: the router does main.innerHTML='' on each navigation.
  mount() {
    const main = document.querySelector('main')
    if (!main) return null

    const wrapper = document.createElement('div')
    wrapper.className = `stickfigure-wrapper stickfigure-${this.pose}`
    wrapper.innerHTML = this.getSVG()
    this.element = wrapper

    main.appendChild(wrapper)
    setTimeout(() => wrapper.classList.add('stickfigure-visible'), 700)

    return wrapper
  }

  getSVG() {
    // The wrapper is at bottom:1rem, which places the SVG's bottom edge (y=60)
    // exactly on the layout-frame border line. The body and thighs run to y=60,
    // so the torso visually meets the line. Lower legs (y>60) overflow the SVG
    // bounds and dangle below the frame into the 1rem margin gap.
    //
    // Arms are in absolute SVG coordinates — no SVG transform attributes on
    // animated elements. This makes transform-box:fill-box work correctly:
    // the joint is always at the (0%,100%) corner of the line bounding box.

    const sitting = `
      <circle cx="30" cy="8" r="6" class="sf-shape" />
      <line x1="30" y1="14" x2="30" y2="60" class="sf-shape" />
      <line x1="30" y1="60" x2="10" y2="60" class="sf-shape" />
      <line x1="30" y1="60" x2="50" y2="60" class="sf-shape" />
      <line x1="10" y1="60" x2="7"  y2="75" class="sf-shape sf-left-leg" />
      <line x1="50" y1="60" x2="53" y2="75" class="sf-shape sf-right-leg" />
    `

    if (this.pose === 'home') {
      // Pointing arm: shoulder (30,30) → upper-right (44,10)
      // BBox x:[30,44] y:[10,30] → joint (30,30) = (0%,100%) ✓
      return `
        <svg class="sf-svg" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          ${sitting}
          <line x1="30" y1="30" x2="44" y2="10" class="sf-shape sf-point-arm" />
          <line x1="30" y1="30" x2="20" y2="48" class="sf-shape" />
        </svg>
      `
    }

    if (this.pose === 'projects') {
      // Upper arm static: shoulder (30,30) → elbow (16,46)
      // Forearm animated at elbow: (16,46) → (26,24)
      // Forearm BBox x:[16,26] y:[24,46] → joint (16,46) = (0%,100%) ✓
      return `
        <svg class="sf-svg" viewBox="0 0 65 60" xmlns="http://www.w3.org/2000/svg">
          ${sitting}
          <line x1="30" y1="30" x2="16" y2="46" class="sf-shape" />
          <line x1="16" y1="46" x2="26" y2="24" class="sf-shape sf-think-forearm" />
          <line x1="30" y1="30" x2="42" y2="48" class="sf-shape" />
          <circle cx="40" cy="4"  r="2"   class="sf-shape sf-thought sf-thought-1" />
          <circle cx="49" cy="-1" r="2.8" class="sf-shape sf-thought sf-thought-2" />
          <circle cx="58" cy="-6" r="3.5" class="sf-shape sf-thought sf-thought-3" />
        </svg>
      `
    }

    if (this.pose === 'contact') {
      // Phone arm group — no SVG transform attribute, all absolute coords.
      // BBox: arm (30,30)→(46,10), phone x:[43,53] y:[2,18], signals x:[55,65]
      // Combined x:[30,65] y:[2,30] → joint (30,30) = (0%,100%) ✓
      return `
        <svg class="sf-svg sf-svg-wide" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
          ${sitting}
          <g class="sf-phone-arm">
            <line x1="30" y1="30" x2="46" y2="10" class="sf-shape" />
            <rect x="43" y="2" width="10" height="16" rx="2" class="sf-shape" />
            <path d="M 55 5 Q 60 10 55 15" class="sf-signal sf-signal-1" />
            <path d="M 58 2 Q 65 10 58 18" class="sf-signal sf-signal-2" />
          </g>
          <line x1="30" y1="30" x2="20" y2="48" class="sf-shape" />
        </svg>
      `
    }

    return ''
  }
}
