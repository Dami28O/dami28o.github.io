import * as THREE from 'three'

export class SimpleThreeTest {
  constructor(container) {
    console.log('SimpleThreeTest: Starting initialization')
    console.log('Container:', container)
    console.log('Container dimensions:', container.clientWidth, container.clientHeight)
    console.log('Container offsetWidth/Height:', container.offsetWidth, container.offsetHeight)
    console.log('Container computed style:', window.getComputedStyle(container))
    
    this.container = container
    
    // Force container to have dimensions if it doesn't
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      container.style.width = '100vw'
      container.style.height = '100vh'
      console.log('Forced container dimensions')
    }
    
    // Create a simple spinning cube
    const scene = new THREE.Scene()
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    
    console.log('Using dimensions:', width, height)
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    
    renderer.setSize(width, height)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.zIndex = '10'
    container.appendChild(renderer.domElement)
    
    console.log('Renderer canvas:', renderer.domElement)
    console.log('Canvas size:', renderer.domElement.width, renderer.domElement.height)
    
    // Create a red cube
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    
    camera.position.z = 5
    
    console.log('SimpleThreeTest: Created cube, starting animation')
    
    function animate() {
      requestAnimationFrame(animate)
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()
  }
}