# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website built with Vite and vanilla JavaScript, featuring a modular component-based architecture inspired by Keita Yamada's minimalist design aesthetic. The site includes Home, Projects, and Contact pages with light/dark theme support.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

**Component System:**
- `/src/components/` - Reusable UI components (Layout, Navigation, ThemeToggle, Biography, ProjectCard)
- `/src/pages/` - Page components (Home, Projects, Contact)
- `/src/router.js` - Hash-based SPA routing system
- `/src/main.js` - Application entry point

**Data Management:**
- `/src/data/*.json` - Content data files for easy updates
- `bio.json` - Personal information and biography
- `projects.json` - Project data with expandable cards
- `contact.json` - Contact links and CV information

**Styling:**
- CSS custom properties for theming
- Mobile-first responsive design
- Smooth transitions and microinteractions
- Light/dark theme toggle with localStorage persistence

## Content Updates

**Adding New Projects:**
1. Edit `src/data/projects.json`
2. Add project object with: id, name, dates, description, technologies, images, externalLink
3. Images go in `src/assets/images/`

**Updating Biography:**
1. Edit `src/data/bio.json`
2. Modify name, role, or biography text

**Contact Information:**
1. Edit `src/data/contact.json`
2. Update LinkedIn, GitHub, email links
3. Replace CV file in `src/assets/`

## Deployment

The site builds to static files and can be deployed to any static hosting service:
- Netlify: Auto-deploy from git with build command `npm run build`
- Vercel: Zero-config deployment
- GitHub Pages: Use GitHub Actions workflow

## Design System

**Typography:** Inter font family with light weights (200-500)
**Colors:** CSS custom properties for light/dark themes
**Layout:** CSS Grid and Flexbox with generous whitespace
**Interactions:** Subtle hover states and smooth transitions

## Key Features

- Hash-based routing for SPA navigation
- Expandable project cards with smooth animations
- Theme persistence across sessions
- Responsive design for mobile/desktop
- Component-based architecture for easy maintenance