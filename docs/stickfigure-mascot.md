# Stick Figure Mascot — Parked Concept

A small animated stick figure that sits on the bottom border of the `.layout-frame`, with legs dangling below the line and per-page arm poses. Parked because the execution felt goofy rather than polished. All source files are intact — nothing was deleted.

---

## Files

| File | Purpose |
|------|---------|
| `src/components/StickFigure.js` | Component + SVG generation |
| `src/styles/main.css` | All CSS (search `stickfigure`, `sf-`) |

---

## How to re-enable

**1. Wire up the three pages:**

`src/pages/Home.js`
```js
import { StickFigure } from '../components/StickFigure.js'

// in constructor:
this.stickFigure = new StickFigure('home')

// at the end of render(), before return:
requestAnimationFrame(() => this.stickFigure.mount())
```

`src/pages/Projects.js`
```js
import { StickFigure } from '../components/StickFigure.js'
// constructor: this.stickFigure = new StickFigure('projects')
// render():    requestAnimationFrame(() => this.stickFigure.mount())
```

`src/pages/Contact.js`
```js
import { StickFigure } from '../components/StickFigure.js'
// constructor: this.stickFigure = new StickFigure('contact')
// render():    requestAnimationFrame(() => this.stickFigure.mount())
```

**2. That's it.** The CSS is still in `main.css` and the component still exists.

---

## Design decisions worth keeping if redesigned

### Why `mount()` appends to `<main>`, not the page div

`.page-enter-active` sets `transform: translateY(0)`. Even though this is visually identity, any non-`none` CSS `transform` on an ancestor creates a new containing block for `position: fixed` descendants. The figure would then be fixed relative to the page div (which differs in size per page) rather than the viewport — causing it to appear at a different position on each page.

Mounting to `<main>` (no transforms, stable parent) keeps `position: fixed` truly viewport-relative. Cleanup is automatic because the router does `main.innerHTML = ''` on every navigation.

### Why no SVG `transform` attribute on animated arm groups

Using `<g transform="translate(x,y)" class="animated-arm">` alongside CSS `transform-box: fill-box` is unreliable — the browser may compute the fill-box in a different coordinate space than expected, causing the arm to detach and rotate around the wrong point.

The working approach: draw all arms in absolute SVG coordinates with no SVG `transform` attribute. The joint always sits at the `(0%, 100%)` corner of the line's bounding box (left edge, bottom edge), so `transform-box: fill-box; transform-origin: 0% 100%` is always correct.

Example — home pointing arm:
```svg
<!-- shoulder at SVG (30,30), arm points upper-right -->
<line x1="30" y1="30" x2="44" y2="10" class="sf-shape sf-point-arm" />
```
```css
.sf-point-arm {
  transform-box: fill-box;
  transform-origin: 0% 100%; /* resolves to (30,30) = shoulder */
  animation: sf-point 3.7s ease-in-out infinite;
}
```

### Positioning — sitting on the frame border

`.layout-frame` has `margin: var(--spacing-sm)` (1rem = 16px) and `border: 1px solid`. The bottom border sits at `bottom: 1rem` from the viewport.

The SVG is 60px tall with `overflow: visible`. The body and thighs run to `y=60` (the SVG's bottom edge). With the wrapper at `bottom: var(--spacing-sm)`, the SVG bottom edge lands exactly on the border line. Lower legs (y > 60) overflow the SVG and dangle into the 1rem gap below the frame.

```css
.stickfigure-wrapper {
  position: fixed;
  bottom: var(--spacing-sm); /* SVG bottom edge = layout-frame border */
  left: 2.5rem;
}

.sf-svg {
  width: 55px;
  height: 60px;
  overflow: visible; /* legs dangle below the border */
}
```

### Leg kick animation

Lower legs rotate around the knee joint. Because the knee is at a *corner* of the line's bounding box (not the center), `transform-origin` must be set explicitly to that corner:

```
Left lower leg:  (10,60) → (7,75)
BBox: x=[7,10] y=[60,75]
Knee (10,60) = right-top corner → transform-origin: 100% 0%

Right lower leg: (50,60) → (53,75)
BBox: x=[50,53] y=[60,75]
Knee (50,60) = left-top corner → transform-origin: 0% 0%
```

```css
.sf-left-leg  { transform-box: fill-box; transform-origin: 100% 0%; animation: sf-kick-l 2.6s ease-in-out infinite; }
.sf-right-leg { transform-box: fill-box; transform-origin: 0%   0%; animation: sf-kick-r 2.6s ease-in-out infinite; }

@keyframes sf-kick-l {
  0%, 100% { transform: rotate(0deg);  }
  40%, 65% { transform: rotate(22deg); }   /* inward kick */
}
@keyframes sf-kick-r {
  0%, 100% { transform: rotate(0deg);   }
  40%, 65% { transform: rotate(-22deg); }  /* inward kick (mirrored) */
}
```

### Pulse gating — home page only

Neural network pulses fire only on the home page. The router calls:
- `neuralNetwork.stopPeriodicPulses()` on leaving home — clears the interval and hides any in-flight pulses immediately
- `neuralNetwork.resetPulseInterval()` on returning to home — restarts the 5s timer fresh

`stopPeriodicPulses()` already exists in `NeuralNetwork.js`.

---

## What felt off / what to fix if reviving

- The figure reads as goofy rather than characterful — needs a stronger visual style or to be more minimalist (just 2–3 lines, no head circle)
- The pointing arm animation is the strongest part; the sitting legs feel mechanical
- Consider: a simpler "hand waving over the border" concept instead of a full body
- Consider: SVG drawn in a design tool first, then hand-traced to coordinates, rather than coordinate-first
