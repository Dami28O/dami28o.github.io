# Damilola Ogunleye — Portfolio

Personal portfolio for a robotics and ML engineer, live at the domain in `CNAME`.

The home page is an interactive map of projects linked by the tools they share. Hover (or tap) a project to preview it and click to open its page. On phones the map becomes a two-column layout, projects on the left and tools on the right.

## Pages

- **Home** (`#`): short bio and the project map
- **Projects** (`#projects`): filterable list with an image preview on hover
- **Project** (`#projects/<id>`): full-width page with description, image, tools and previous/next links
- **Contact** (`#contact`): email with a copy button, LinkedIn, GitHub and CV

## Stack

- Vanilla JavaScript components with a small hash router, built with Vite
- [d3-force](https://github.com/d3/d3-force) for the map layout, drawn as SVG
- Plain CSS with design tokens; light and dark themes follow the system setting

## Development

```bash
npm install
npm run dev       # localhost:3000
npm run build     # production build in dist/
npm run preview   # serve the production build
npm run deploy    # build and publish dist/ to the gh-pages branch
```

## Project structure

```
src/
├── components/
│   ├── Layout.js        # Frame, name, nav, theme toggle, skip link
│   ├── Navigation.js    # Home / Projects / Contact links
│   ├── ProjectMap.js    # Project map: force layout on desktop, two columns on phones
│   └── ThemeToggle.js   # Light/dark switch, follows the system until used
├── pages/
│   ├── Home.js          # Bio and map
│   ├── Projects.js      # Index and individual project pages
│   └── Contact.js       # Contact details
├── styles/main.css      # All styles; tokens at the top
├── router.js            # Hash routing, page titles, focus on navigation
└── main.js              # Entry point

public/
├── data/                # Site content (see below)
└── assets/
    ├── docs/            # CV (only OGUNLEYE_CV.pdf is tracked)
    └── images/ProjectPics/
        └── previews/    # Web-sized WebP copies used on the site
```

## Updating content

All content lives in `public/data/`.

**Add a project** to `projects.json` with these fields:

| Field | Purpose |
|---|---|
| `id` | Unique number; also the URL (`#projects/<id>`) |
| `name` | Full title |
| `shortName` | Label on the map |
| `dates`, `group` | Shown on the project page; `group` drives the filters |
| `description` | HTML; keep `<b>` for partner organisations only |
| `technologies` | Tools; any tool shared by two or more projects becomes a hub on the map |
| `images` | Original image paths |
| `preview` | Web-sized WebP used on the map, the index and the project page |
| `externalLink` | Optional link to the code or write-up |

Make the preview from the original (use the original width if it is under 2000px):

```bash
cwebp -q 82 -alpha_q 90 -resize 2000 0 public/assets/images/ProjectPics/photo.png \
  -o public/assets/images/ProjectPics/previews/photo.webp
```

**Bio:** the home page shows `sections.current.content` from `bio.json`.

**Currently working on:** add `"now": { "text": "…", "updated": "October 2026" }` to `bio.json` to show the yellow note on the desktop home page. Remove it to hide the note.

**Contact and CV:** edit `contact.json`, and replace `public/assets/docs/OGUNLEYE_CV.pdf`.

**Portrait (contact page):** the full-size original lives in `assets-src/` (tracked, not deployed). Crop it to 4:5, save a WebP and set `photo.src` in `contact.json`. It is cropped to 4:5; set `photo.mono` to `true` for black and white. With no `src`, a placeholder frame shows in `npm run dev` only and nothing appears on the live site.

```bash
# crop to 4:5 (height width, then offset y x), then convert
sips -c 1690 1352 --cropOffset 60 1050 assets-src/dami-ogunleye-portrait.jpg --out /tmp/portrait-crop.jpg
cwebp -q 84 -resize 0 1250 /tmp/portrait-crop.jpg -o public/assets/images/dami-ogunleye-portrait.webp
```
