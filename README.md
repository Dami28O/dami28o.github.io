# Portfolio Website

A modern, interactive portfolio website featuring a neural network background visualization with Three.js.

## Features

- **Interactive Neural Network**: 3D visualization with clickable bio information nodes
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Theme Support**: Light and dark mode with smooth transitions
- **Project Showcase**: Expandable project cards with image galleries
- **Smooth Navigation**: Hash-based routing with page transitions
- **Modern Architecture**: Component-based vanilla JavaScript structure

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Biography.js     # Biography text component
│   ├── Layout.js        # Main layout wrapper
│   ├── Navigation.js    # Navigation menu
│   ├── NeuralNetwork.js # 3D neural network visualization
│   ├── ProjectCard.js   # Project display cards
│   └── ThemeToggle.js   # Dark/light theme switcher
├── pages/              # Page components
│   ├── Contact.js      # Contact information page
│   ├── Home.js         # Home page with neural network
│   └── Projects.js     # Projects listing page
├── styles/
│   └── main.css        # All styling and responsive design
├── main.js             # Application entry point
└── router.js           # Client-side routing logic

public/
├── data/               # JSON data files
│   ├── bio.json        # Biography and neural network info
│   ├── contact.json    # Contact links and resume
│   └── projects.json   # Project details and images
└── assets/
    └── images/         # Project images and assets
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **3D Graphics**: Three.js for neural network visualization
- **Styling**: CSS3 with custom properties and modern features
- **Build Tool**: Vite for development and production builds
- **Deployment**: GitHub Pages compatible

## Key Components

### Neural Network (NeuralNetwork.js)
- Interactive 3D visualization using Three.js
- Clickable bio information nodes with different categories
- Dynamic connection highlighting and animations
- Page-specific interactivity (interactive on home, background on other pages)
- Mobile-responsive positioning and scaling

### Router (router.js)
- Hash-based client-side routing
- Page lifecycle management
- Neural network interaction control per page
- Dynamic z-index management for proper layering

### Project Cards (ProjectCard.js)
- Expandable/collapsible project information
- Image gallery support
- Technology tags and external links
- Keyboard accessibility support

## Development

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Data Management
Project content is managed through JSON files in the `public/data/` directory:

- `bio.json`: Contains biographical sections and neural network node information
- `projects.json`: Project details, technologies, descriptions, and image paths
- `contact.json`: Contact links and resume information

### Adding Projects
1. Add project details to `public/data/projects.json`
2. Place project images in `public/assets/images/ProjectPics/`
3. Update the images array in the project data with relative paths

## Deployment

### GitHub Pages
1. Build the project: `npm run build`
2. Commit changes with project assets
3. Push to the main branch
4. GitHub Pages will automatically deploy from the `dist` folder

### Asset Management
- Project images should be placed in `public/assets/images/`
- Update `vite.config.js` if custom asset handling is needed
- Ensure all asset paths in JSON files are relative to the public directory

## Browser Compatibility

- Modern browsers with ES6+ support
- WebGL support required for neural network visualization
- Responsive design tested on desktop, tablet, and mobile devices

## Performance Considerations

- Lazy loading for project images
- Optimized Three.js rendering with appropriate frame rates
- CSS animations using transform and opacity for smooth performance
- Efficient asset loading and caching strategies

## Customization

### Themes
- CSS custom properties in `src/styles/main.css`
- Theme persistence using localStorage
- Smooth transitions between light and dark modes

### Neural Network
- Node colors and positions defined in `bio.json`
- Adjustable connection algorithms and visual effects
- Mobile-specific optimizations and scaling

### Layout
- Flexible CSS Grid and Flexbox layouts
- Responsive breakpoints and mobile-first design
- Customizable spacing and typography scales
