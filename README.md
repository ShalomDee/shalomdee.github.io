# The Maker's Times

Shalom Donga's portfolio, styled as a newspaper. It is a static site served by GitHub Pages at https://shalomdee.github.io. It has no framework, no build step, and no dependencies: one HTML page, one stylesheet, and one script.

## Folder map

```
index.html                    The whole page. Section comments (<!-- ═══ HERO ═══ -->) mark each part.
favicon.ico
assets/
  css/style.css               All styles. Color, type, and spacing tokens are at the top.
  js/main.js                  Theme toggle, mobile drawer, scroll animations, nav highlight.
  Shalom_Donga_Resume.pdf     The resume every "Resume" link opens.
  images/
    projs/                    Selected Builds card images
    exp/                      Experience Wire logos
    cards/                    Editorial tiles
    hero-*.png, portrait.png, texture.webp
_reference/                   Local design notes. Ignored by git, never deployed.
```

## Run it locally

```
python3 -m http.server
```

Then open http://localhost:8000. Use a server, not a double-clicked file, so paths behave the way they do on GitHub Pages.

## Edit copy

All copy is in `index.html`. Find the section by its comment and edit the text. The only text in `main.js` is the "Night Edition" / "Day Edition" label on the desktop theme button.

## Add a project card

1. In `index.html`, under `SELECTED BUILDS`, copy one `<article class="pa-card">` block and paste it where the card should appear.
2. Edit the tags, title, description, and tech list.
3. Give the image div a new modifier, for example `pa-img--c7`. In `style.css`, next to `.pa-img--c6`, add a rule for it in both themes:
   ```css
   .pa-img--c7{background:#1A2A2A url('../images/projs/my-project.webp') center/cover no-repeat;}
   [data-theme="light"] .pa-img--c7{background:#A3BDB9 url('../images/projs/my-project.webp') center/cover no-repeat;}
   ```
4. Put the image in `assets/images/projs/`. Use a lowercase, hyphenated `.webp` file name, and match its case exactly, because GitHub Pages is case sensitive.
5. Links go inside the card's `.pa-links` div. Copy one from the ClassSync card.

## Add a case study page

1. Create `case-studies/my-project.html`. Copy the `<head>` from `index.html` and change the stylesheet and script paths to `../assets/...`.
2. Link it from its card by pasting the one-line link from the HTML comment above the project grid into that card's `.pa-links` div, then set its `href` to `./case-studies/my-project.html`.

## Update the resume

Replace `assets/Shalom_Donga_Resume.pdf` with the new file, keeping the exact same name. Every Resume link points to that path, so nothing else changes.

## Deploy

GitHub Pages publishes the `main` branch, so a push to `main` goes live within a minute or two. Work on a branch, check it locally, then merge into `main`.

## Bump the cache version

Not set up yet; this is issue 7. Until then, after a deploy, browsers and the GitHub Pages CDN can serve an old `style.css` or `main.js` for up to about 10 minutes, and a hard refresh shows the new version.
