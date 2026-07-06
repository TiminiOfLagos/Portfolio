# Oluwadamilola Salami — Portfolio 2026

A single-page portfolio for a UX Product Designer. Dark editorial design with
a live WebGL hero, smooth scrolling and scroll-driven motion.

## Stack

- **Plain HTML/CSS/JS** — no build step, deploys anywhere
- **Three.js** (CDN, lazy-loaded) — domain-warped noise shader in the hero,
  with a CSS gradient fallback if WebGL is unavailable
- **GSAP 3.13** + ScrollTrigger + SplitText (CDN) — preloader, mask reveals,
  word-by-word statement scrub, stat counters, magnetic buttons
- **Lenis** (CDN) — smooth scrolling (skipped for `prefers-reduced-motion`)
- **Fonts** — Space Grotesk + Instrument Serif (Google Fonts)

## Structure

```
index.html      — all content & sections
css/style.css   — design system (custom properties at the top)
js/main.js      — shader, animations, cursor, nav, clock
```

## Run locally

Any static server works:

```
npx serve .
```

## Deploy

Drop the folder on Netlify / Vercel / GitHub Pages / Cloudflare Pages as a
static site — no build command, publish directory is the root.

## Editing content

- **Projects:** edit the `<li class="work__item">` entries in `index.html`.
  `data-hue` (0–360) sets each project's preview/thumb color; `data-tag`
  is the label shown on the hover preview card.
- **Colors & type:** CSS custom properties in `:root` at the top of
  `css/style.css` (`--accent`, `--bg`, fonts, spacing).
- **Availability badge, Lagos clock, socials:** in `index.html` (nav + footer).
