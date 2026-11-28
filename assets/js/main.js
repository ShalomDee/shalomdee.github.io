/* ═══ THE MAKER'S TIMES — main.js ═══
   Loaded with defer. Everything sits inside one function so nothing
   leaks into the global scope. Copy and image paths live in index.html
   as data attributes, not here. */

(() => {

/* ─── Theme ───
   The inline script in <head> picks the theme before first paint
   (saved choice, else device setting, else light). This syncs the rest
   of the page to it and handles changes. Icons swap in CSS. */
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// 'light', 'dark', or null when nothing is saved or storage is blocked
function savedTheme() {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch (e) {
    return null;
  }
}

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  // Accessible name from data-label-light / data-label-dark
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.setAttribute('aria-label', dark ? btn.dataset.labelDark : btn.dataset.labelLight);
  });
  // The hero art fades to the new theme's engraving (defined below)
  if (window.showHeroArt) window.showHeroArt(theme);
  // Browser UI colour (mobile address bar) follows the page background
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = dark ? '#121A28' : '#F5F1E8';
}

// A toggle this visit counts as a choice even when storage can't keep it
let chosenThisVisit = false;

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  chosenThisVisit = true;
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
}

applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', toggleTheme));

// With no saved choice (or blocked storage), follow the device setting live.
// (Safari before 14 has no addEventListener on media queries.)
if (darkQuery.addEventListener) darkQuery.addEventListener('change', e => {
  if (!chosenThisVisit && !savedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

/* ─── Hero art ───
   The engraving is a still. When it is half on screen one timeline plays
   once: the icon glow comes up, two lights travel along the rope, a spark
   bursts, then everything dies down to the plain still. Hover or tap
   replays it. Reduced motion keeps the plain still. The animation is one
   function of time, so every state is reproducible. */
const heroArt = document.getElementById('heroArt');
if (heroArt) {
  const DURATION = 7;
  const layers = {
    light: heroArt.querySelector('.hero-layer-day'),
    dark: heroArt.querySelector('.hero-layer-night')
  };
  const glows = heroArt.querySelectorAll('.hero-art-glow');
  const burst = heroArt.querySelector('.fx-burst');
  const halo = heroArt.querySelector('.fx-halo');
  const lightL = heroArt.querySelector('.fx-light-l');
  const lightR = heroArt.querySelector('.fx-light-r');

  const clamp = x => Math.min(1, Math.max(0, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  function render(t) {
    // Dying down: the spark shrinks to an ember and goes out first; the icon
    // glow cools more slowly, dropping fast and then lingering.
    const cool = Math.pow(1 - seg(t, 5.0, 7.0), 2);
    const spark = Math.pow(1 - seg(t, 4.4, 6.0), 2);
    const glow = easeInOut(seg(t, 0.15, 1.6)) * cool;
    glows.forEach(g => { g.style.opacity = glow; });

    const p = easeInOut(seg(t, 1.0, 2.4)); // lights along the rope
    const lo = seg(t, 1.0, 1.2) * (1 - seg(t, 2.25, 2.45));
    lightL.style.opacity = lo; lightL.style.transform = 'translateX(' + (162 * p) + 'px)';
    lightR.style.opacity = lo; lightR.style.transform = 'translateX(' + (-168 * p) + 'px)';

    const up = easeOut(seg(t, 2.5, 3.0)), down = easeInOut(seg(t, 3.0, 4.0));
    const scale = (t < 3 ? 0.05 + 1.85 * up : 1.9 - 0.9 * down) * (1 - 0.45 * seg(t, 4.4, 6.0));
    burst.style.opacity = seg(t, 2.5, 2.65) * spark;
    burst.style.transform = 'scale(' + scale + ')';
    const haloScale = t < 3 ? 0.3 + 0.95 * up : 1.25 - 0.55 * down;
    halo.style.opacity = (t < 3 ? 0.85 : 0.85 - 0.4 * down) * seg(t, 2.5, 2.6) * spark;
    halo.style.transform = 'scale(' + haloScale + ')';
  }

  let t = DURATION, playing = false, last = 0;
  function frame(now) {
    // A slow frame slows the animation down instead of skipping its phases
    t = Math.min(DURATION, t + Math.min(0.05, Math.max(0, (now - last) / 1000)));
    last = now;
    render(t);
    if (t < DURATION) requestAnimationFrame(frame); else playing = false;
  }
  function play() {
    t = 0; playing = true; last = performance.now();
    requestAnimationFrame(frame);
  }

  // It starts when the page has finished loading, the engraving is decoded and
  // the hero is on screen, so it is not spent behind the page's own fade-in.
  // Each time the hero comes back into view it plays again.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!still.matches) {
    let ready = false, inView = false, waiting = false;
    const maybePlay = () => {
      if (!ready || !inView || playing || waiting) return;
      waiting = true;
      setTimeout(() => { waiting = false; if (inView && !playing) play(); }, 600);
    };
    const replay = () => { if (ready && !playing) play(); };
    heroArt.addEventListener('mouseenter', replay);
    heroArt.addEventListener('click', replay);
    const visibleBase = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? layers.dark : layers.light).querySelector('.hero-art-base');
    const whenReady = () => {
      const img = visibleBase();
      const done = () => { ready = true; maybePlay(); };
      if (img && img.decode) img.decode().then(done, done); else done();
    };
    if (document.readyState === 'complete') whenReady(); else window.addEventListener('load', whenReady);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        if (inView) maybePlay();
      }, { threshold: 0.5 }).observe(heroArt);
    }
  }

  // The other theme's engraving loads once the page has settled, or when the
  // theme button is reached, so most visitors never wait for it.
  let fetched = {};
  function loadArt(theme) {
    if (fetched[theme]) return;
    fetched[theme] = true;
    layers[theme].querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src; img.removeAttribute('data-src');
    });
  }
  loadArt('light');
  const settle = () => loadArt('dark');
  if (document.documentElement.getAttribute('data-theme') === 'dark') settle();
  else if ('requestIdleCallback' in window) requestIdleCallback(settle, { timeout: 4000 });
  else setTimeout(settle, 2500);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    ['pointerenter', 'focus'].forEach(ev => btn.addEventListener(ev, settle, { once: true }));
  });

  // New engraving fades in over the old one on the page's own 0.3s curve,
  // so the art's box tracks the page background and never shows.
  let shown = null, tidy = 0;
  window.showHeroArt = theme => {
    const next = layers[theme], prev = shown && layers[shown];
    clearTimeout(tidy);
    if (prev === next) return;
    if (!prev) {
      shown = theme;
      return; // first paint: CSS already shows the right layer
    }
    shown = theme;
    prev.style.transition = 'none'; prev.style.opacity = '1'; prev.style.zIndex = '1';
    next.style.transition = 'none'; next.style.opacity = '0'; next.style.zIndex = '2';
    void next.offsetWidth;
    next.style.transition = 'opacity 0.3s var(--ease)'; next.style.opacity = '1';
    tidy = setTimeout(() => { prev.style.transition = 'none'; prev.style.opacity = '0'; }, 320);
  };
  window.showHeroArt(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
}

/* ─── Drawer ─── */
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const hamburger = document.getElementById('hamburger');
const drawerClose = document.getElementById('drawerClose');

function openNav() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  drawerClose.focus();
}
// restoreFocus is false after a link click, so the page jumps to the link target
function closeNav(restoreFocus) {
  if (!drawer.classList.contains('open')) return;
  const hadFocus = restoreFocus && drawer.contains(document.activeElement);
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  if (hadFocus) hamburger.focus();
}
if (drawer && drawerOverlay && hamburger && drawerClose) {
  hamburger.addEventListener('click', openNav);
  // The drawer only exists below 768px; close it if the window grows past that
  const wide = window.matchMedia('(min-width: 768px)');
  if (wide.addEventListener) wide.addEventListener('change', e => { if (e.matches) closeNav(false); });
  drawerClose.addEventListener('click', () => closeNav(true));
  drawerOverlay.addEventListener('click', () => closeNav(true));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeNav(false)));
  document.addEventListener('keydown', e => {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') closeNav(true);
    // Keep Tab inside the open drawer
    if (e.key === 'Tab') {
      const items = drawer.querySelectorAll('a, button');
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ─── Scroll animations ─── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));

/* Highlighted passages in Experience: marked once, when most of the passage is on screen */
const markObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-marked');
      markObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll('.hl').forEach(el => markObserver.observe(el));

/* Stamped dates: set down once the date is about a fifth of the way up the screen */
const stampObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-stamped');
      stampObserver.unobserve(e.target);
    }
  });
}, { threshold: 1, rootMargin: '0px 0px -20% 0px' });

document.querySelectorAll('.stamp').forEach(el => stampObserver.observe(el));

/* ─── Masthead typewriter ───
   Runs when the head script in index.html set html.press (first home page
   load of a visit, motion allowed). The full text stays readable to screen
   readers in a hidden copy; the letters are decoration. */
if (document.documentElement.classList.contains('press')) {
  const split = (el, start, step) => {
    const text = el.textContent;
    const vh = document.createElement('span');
    vh.className = 'tw-vh'; vh.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    [...text].forEach((c, k) => {
      const ch = document.createElement('span');
      ch.className = 'tw-ch'; ch.textContent = c;
      ch.style.setProperty('--d', `${start + k * step}ms`);
      vis.append(ch);
    });
    el.replaceChildren(vh, vis);
    el.classList.add('tw-on');
    const end = start + text.length * step;
    // Once typed, put the plain text back so spacing and kerning match the resting masthead
    setTimeout(() => { el.textContent = text; }, end + (el.matches('.mast-edition') ? 2000 : 400));
    return end;
  };
  document.querySelectorAll('.mast-title, .mast-center').forEach(box => {
    const name = box.querySelector('.mast-name');
    const tag = box.querySelector('.mast-edition');
    if (!name || !tag) return;
    // Case study mastheads link the title; type the link's text in place
    const nameEl = name.querySelector('a') || name;
    const end = split(nameEl, 150, 60);
    if (nameEl !== name) name.classList.add('tw-on');
    const tagStart = end + 250;
    const tagEnd = split(tag, tagStart, 38);
    // The caret rides just after the newest letter as the tagline types
    const vis = tag.lastElementChild;
    vis.style.position = 'relative';
    const caret = document.createElement('span');
    caret.className = 'tw-caret'; caret.setAttribute('aria-hidden', 'true');
    vis.append(caret);
    const chars = [...vis.querySelectorAll('.tw-ch')];
    const place = k => { const c = chars[k]; caret.style.left = (c ? c.offsetLeft + c.offsetWidth : 0) + 'px'; };
    place(-1);
    chars.forEach((c, k) => setTimeout(() => { c.classList.add('is-in'); place(k); }, tagStart + k * 38));
    setTimeout(() => caret.classList.add('is-done'), tagEnd + 1200);
  });
}

/* ─── Live masthead ───
   Today's date fills the centre of the folio row, in the visitor's own day.
   Without JavaScript that slot stays empty. */
const liveFolio = document.querySelector('.mast-folio-c[data-live]');
if (liveFolio) {
  const today = new Date();
  const date = document.createElement('time');
  date.dateTime = today.toISOString().slice(0, 10);
  date.textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  liveFolio.append(date);
}


/* ─── Main story images: reveal when section in view ─── */
const mainStory = document.querySelector('.main-story');
const mainPortrait = document.querySelector('.ms-portrait');
if (mainStory && mainPortrait) {
  const storyObserver = new IntersectionObserver(entries => {
    mainStory.classList.toggle('in-view', entries[0].isIntersecting);
  }, { threshold: 0.6 });
  storyObserver.observe(mainPortrait);
}

/* ─── Editorial colour reveal ─── */
const editorialSection = document.getElementById('editorials');
if (editorialSection) {
  const editorialObserver = new IntersectionObserver(entries => {
    editorialSection.classList.toggle('in-view', entries[0].isIntersecting);
  }, { threshold: 0.5 });
  editorialObserver.observe(editorialSection);
}

/* ─── Editorial swap tiles ───
   A tile with data-act shows its second image on hover (CSS). Where there is
   no hover (phones, tablets) a tap toggles .is-on instead. */
const edTouch = window.matchMedia('(hover: none)');
document.querySelectorAll('.ed-tile[data-act]:not([data-greet])').forEach(tile => {
  tile.addEventListener('click', () => {
    if (edTouch.matches) tile.classList.toggle('is-on');
  });
});

/* The greetings tile: while the pointer is over it the greetings change every
   1.8s; a tap or click moves to the next one. Leaving the tile clears it.
   With reduced motion the greetings only change on a tap. */
const edGreetTile = document.querySelector('.ed-tile[data-greet]');
const edGreet = edGreetTile && (() => {
  const items = [...edGreetTile.querySelectorAll('.ed-g')];
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cur = -1, timer = 0;
  const show = k => { cur = k; items.forEach((el, j) => el.classList.toggle('is-cur', j === k)); };
  const next = () => show((cur + 1) % items.length);
  const stop = () => { clearInterval(timer); timer = 0; };
  const hide = () => { stop(); show(-1); };
  edGreetTile.addEventListener('mouseenter', () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    next(); stop();
    if (!calm.matches) timer = setInterval(next, 1800);
  });
  edGreetTile.addEventListener('mouseleave', () => { if (window.matchMedia('(hover: hover)').matches) hide(); });
  edGreetTile.addEventListener('click', () => { if (!timer) next(); });
  return { hide };
})();

/* ─── Editorial strip (phones) ───
   Below 768px the tiles show one at a time. Each holds for 6s while the ring
   fills, then slides to the next, looping. Only the ring button pauses it.
   A tile with data-act names its own tap interaction: tapping it pauses the
   strip and fires an "ed:interact" event on the tile. Swiping moves by hand
   and also pauses. Those two pauses lift when the section is scrolled away;
   a pause from the ring stays until the ring is pressed again. Reduced
   motion starts paused. */
const edStrip = document.querySelector('.ed-strip');
const edBar = document.querySelector('.ed-bar');
if (edStrip && edBar) {
  const track = edStrip.querySelector('.editorial-grid');
  const tiles = [...track.children];
  const N = tiles.length, HOLD = 6000, RING = 106.8;
  const count = edBar.querySelector('.ed-count');
  const hint = edBar.querySelector('.ed-hint');
  const btn = edBar.querySelector('.ed-ring-btn');
  const fill = edBar.querySelector('.ed-ring-fill');
  const phones = window.matchMedia('(max-width: 767.98px)');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let on = false, i = 0, elapsed = 0, last = 0, raf = 0;
  let ringPaused = false, softPaused = false, inView = false, sliding = false, drag = null, clone = null;

  const step = () => tiles[0].getBoundingClientRect().width + 12;
  const paused = () => ringPaused || softPaused;
  const setRing = p => { fill.style.strokeDashoffset = RING * (1 - p); };
  const refresh = () => {
    edBar.classList.toggle('is-paused', paused());
    btn.setAttribute('aria-label', (paused() ? 'Play' : 'Pause') + ' the Editorial slides');
    count.setAttribute('aria-live', paused() ? 'polite' : 'off');
  };
  const go = (k, animate) => {
    const motion = animate && !still.matches;
    track.style.transition = motion ? '' : 'none';
    i = k;
    track.style.transform = `translateX(${-i * step()}px)`;
    elapsed = 0; setRing(0); sliding = motion;
    tiles.forEach(t => t.classList.remove('is-on'));
    if (edGreet) edGreet.hide();
    const cur = tiles[i % N];
    count.textContent = `${(i % N) + 1} / ${N}`;
    hint.textContent = cur.dataset.act ? `Tap the card to ${cur.dataset.act}` : '';
    if (!motion) { track.getBoundingClientRect(); if (i >= N) go(i - N, false); }
  };
  track.addEventListener('transitionend', e => {
    if (e.target !== track) return;
    sliding = false;
    if (i >= N) go(i - N, false);
  });
  const back = () => {
    if (i % N > 0) return go((i % N) - 1, true);
    go(N, false);
    requestAnimationFrame(() => requestAnimationFrame(() => go(N - 1, true)));
  };
  const tick = t => {
    const dt = last ? Math.min(64, t - last) : 0;
    last = t;
    if (inView && !paused() && !sliding && !drag) {
      elapsed += dt;
      setRing(Math.min(1, elapsed / HOLD));
      if (elapsed >= HOLD) go(i + 1, true);
    }
    raf = requestAnimationFrame(tick);
  };

  btn.addEventListener('click', () => {
    if (paused()) { ringPaused = false; softPaused = false; } else ringPaused = true;
    refresh();
  });
  edStrip.addEventListener('pointerdown', e => {
    if (on) drag = { x: e.clientX, y: e.clientY };
  });
  edStrip.addEventListener('pointercancel', () => { drag = null; });
  edStrip.addEventListener('pointerup', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) go((i % N) + 1, true); else back();
      softPaused = true; refresh();
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      const tile = e.target.closest('.ed-tile');
      if (tile && tile.dataset.act) {
        softPaused = true; refresh();
        tile.dispatchEvent(new CustomEvent('ed:interact', { bubbles: true }));
      }
    }
  });
  edStrip.addEventListener('keydown', e => {
    if (!on) return;
    if (e.key === 'ArrowRight') { go((i % N) + 1, true); softPaused = true; refresh(); }
    if (e.key === 'ArrowLeft') { back(); softPaused = true; refresh(); }
  });
  new IntersectionObserver(entries => {
    const e = entries[0];
    inView = e.isIntersecting && e.intersectionRatio >= 0.5;
    if (!e.isIntersecting && softPaused) { softPaused = false; refresh(); }
  }, { threshold: [0, 0.5] }).observe(edStrip);

  const start = () => {
    on = true;
    clone = tiles[0].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    track.appendChild(clone);
    edStrip.tabIndex = 0;
    edStrip.setAttribute('role', 'region');
    edStrip.setAttribute('aria-roledescription', 'carousel');
    edStrip.setAttribute('aria-label', 'Editorial, one tile at a time');
    ringPaused = still.matches; softPaused = false;
    go(0, false); refresh();
    last = 0; raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    on = false;
    cancelAnimationFrame(raf);
    if (clone) clone.remove();
    clone = null;
    track.style.transform = track.style.transition = '';
    edStrip.removeAttribute('tabindex');
    ['role', 'aria-roledescription', 'aria-label'].forEach(a => edStrip.removeAttribute(a));
  };
  phones.addEventListener('change', e => (e.matches ? start() : stop()));
  window.addEventListener('resize', () => { if (on) go(i % N, false); });
  if (phones.matches) start();
}

/* ─── Sticky bars: raise them once the masthead has scrolled away ───
   At every width the masthead comes first and the sticky bar sits below it,
   so the bar is raised as soon as the masthead has left the screen. */
const mastHeader = document.querySelector('header');
const stickyBars = document.querySelectorAll('.mast-top, .nav-bar');
if (mastHeader) {
  new IntersectionObserver(entries => {
    const stuck = !entries[0].isIntersecting;
    stickyBars.forEach(bar => bar.classList.toggle('is-stuck', stuck));
  }).observe(mastHeader);
}

/* ─── Nav scroll spy ───
   In-page links only: on case study pages the ticker points back to the
   homepage and keeps its own .active, and the contents column is spied. */
const sections = document.querySelectorAll('section[id], div[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-ticker a[href^="#"]:not(.nav-cta), .cs-toc a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) link.classList.add('active');
  });
}, { passive: true });

/* ═══ LOOPING CLIPS ═══ */
// Short demo loops (.cs-loop) autoplay muted. For visitors who reduce motion
// they stay on their poster, with controls so they can play one by choice.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video.cs-loop').forEach(v => {
    v.removeAttribute('autoplay');
    v.pause();
    v.controls = true;
  });
}

})();
