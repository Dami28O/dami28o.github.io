# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio for a robotics and ML engineer, built with Vite and vanilla JavaScript components. Pages: Home (bio and an interactive project map), Projects (index and one full-width page per project) and Contact. Minimal, monochrome design with light and dark themes.

## Development Commands

```bash
npm install
npm run dev       # localhost:3000
npm run build     # dist/ (emptied on every build)
npm run preview
npm run deploy    # build, copy CNAME, publish dist/ to the gh-pages branch
```

## Architecture

- `src/router.js` - Hash routing: `#` home, `#projects` index, `#projects/<id>` project page, `#contact`. Sets `document.title` and moves focus into `<main>` after navigation
- `src/components/Layout.js` - Frame, name, nav, theme toggle and skip link (the skip link focuses `<main>` in script, since a `#` href would trigger routing)
- `src/components/ProjectMap.js` - Home centrepiece. Projects link to technologies shared by 2+ projects. Desktop: d3-force layout with a custom label-box collision force; phones (<=768px): two-column "ladder" (projects left with labels before the dot, tools right), ordered by the barycentre method. Hover/focus previews, click/Enter opens; on touch, first tap previews, second opens
- `src/pages/Projects.js` - Index (filters, hover image) and project pages (description beside a sticky image and tools list, previous/next). Escape returns to the index at the same scroll position
- `src/pages/Contact.js` - Email with copy button, then LinkedIn, GitHub and CV rows
- `src/components/ThemeToggle.js` - Theme follows the system until the toggle is used; an inline script in `index.html` sets `data-theme` before first paint

## Content

All content is in `public/data/` (tracked in git):
- `projects.json` - fields: id, name, shortName (map label), dates, group, description (HTML; `<b>` only for partner organisations), technologies, images, preview, externalLink
- `bio.json` - `sections.current.content` is shown on the home page; optional `now: { text, updated }` shows the yellow "currently working on" note (desktop home only, the site's one colour, `--note` token)
- `contact.json` - links and CV path

Images: originals in `public/assets/images/ProjectPics/`; the site uses WebP copies in `ProjectPics/previews/` via the `preview` field:
`cwebp -q 82 -alpha_q 90 -resize 2000 0 in.png -o previews/in.webp` (use the original width if under 2000px).

CV: only `public/assets/docs/OGUNLEYE_CV.pdf` is tracked (see `.gitignore`).

## Design System

- **Typography:** Newsreader (name, titles) and Hanken Grotesk (everything else), loaded in `index.html`. Root font size scales from 16px to 20px on large monitors, so size things in `rem`
- **Colour:** tokens at the top of `src/styles/main.css` (`--paper`, `--surface`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--accent`). Monochrome; the accent is the ink colour. No other hues
- **Layout:** desktop pages use a fixed frame with name top-left and nav on the left rail; projects and contact scroll inside `.projects-scroll` / `.contact-scroll`. Phones scroll the page normally
- **Avoid:** uppercase labels, pills/tags, arrows appended to links, decorative motion

## Working in this repo

- Keep the repo out of cloud-synced folders (OneDrive, iCloud): sync clients rename `dist/` folders mid-build (`assets 2`) and flip file modes
- Accessibility baseline: axe-core reports no violations on any page; keep 44px touch targets on phones and visible focus states
