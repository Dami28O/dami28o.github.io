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
- `/src/components/` - Reusable UI components (Layout, Navigation, ThemeToggle, ProjectMap)
- `/src/pages/` - Page components (Home, Projects, Contact)
- `/src/router.js` - Hash-based SPA routing system: `#projects` is the index, `#projects/3` is project 3's full-width page
- `ProjectMap` - home page centrepiece: d3-force map of projects linked through technologies shared by 2+ projects
- `/src/main.js` - Application entry point

**Data Management:**
- `/public/data/*.json` - Content data files for easy updates
- `bio.json` - Personal information and biography
- `projects.json` - Project data for the map, the projects index and project pages
- `contact.json` - Contact links and CV information

**Styling:**
- CSS custom properties for theming
- Mobile-first responsive design
- Smooth transitions and microinteractions
- Light/dark theme follows the system setting; the toggle saves an explicit choice in localStorage

## Content Updates

**Adding New Projects:**
1. Edit `public/data/projects.json`
2. Add project object with: id, name, shortName (map label), dates, group, description, technologies, images, preview, externalLink
3. Images go in `public/assets/images/ProjectPics/`; add a web-sized WebP copy to `ProjectPics/previews/` and point `preview` at it (used by the map card, the index hover and the project page): `cwebp -q 82 -alpha_q 90 -resize 2000 0 in.png -o previews/in.webp` (use the original width if it is under 2000px)

**Updating Biography:**
1. Edit `public/data/bio.json`
2. Modify name, role, or biography text

**Contact Information:**
1. Edit `public/data/contact.json`
2. Update LinkedIn, GitHub, email links
3. Replace CV file in `public/assets/docs/`

## Deployment

The site builds to static files and can be deployed to any static hosting service:
- Netlify: Auto-deploy from git with build command `npm run build`
- Vercel: Zero-config deployment
- GitHub Pages: Use GitHub Actions workflow

## Design System

**Typography:** Newsreader (display: name, titles) and Hanken Grotesk (everything else), loaded in `index.html`
**Colors:** tokens at the top of `src/styles/main.css` (`--paper`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--surface`, `--accent`); monochrome, with the accent set to the ink colour. Theme follows the system until the visitor uses the toggle, and is always written to `data-theme` on `<html>`
**Layout:** CSS Grid and Flexbox with generous whitespace
**Interactions:** Subtle hover states and smooth transitions

## Key Features

- Hash-based routing for SPA navigation
- Projects index with hover image previews, and a full-width page per project
- Theme persistence across sessions
- Responsive design for mobile/desktop
- Component-based architecture for easy maintenance