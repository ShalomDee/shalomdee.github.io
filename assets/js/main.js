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
  // The dark hero <source> wins only in dark theme
  const heroDark = document.getElementById('heroDark');
  if (heroDark) heroDark.media = dark ? 'all' : 'not all';
  // Browser UI colour (mobile address bar) follows the page background
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = dark ? '#121417' : '#F5F1E8';
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

/* ─── Live masthead ───
   Today's date is added as the first line of the edition box.
   Without JavaScript the static copy in index.html stays. */
const liveBlurb = document.querySelector('.mast-ed-blurb[data-live]');
if (liveBlurb) {
  const today = new Date();
  const date = document.createElement('time');
  date.dateTime = today.toISOString().slice(0, 10);
  date.textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  liveBlurb.prepend(date, document.createElement('br'));
}


/* ─── Main story images: reveal when section in view ─── */
const mainStory = document.querySelector('.main-story');
if (mainStory) {
  const storyObserver = new IntersectionObserver(entries => {
    mainStory.classList.toggle('in-view', entries[0].isIntersecting);
  }, { threshold: 0.6 });
  storyObserver.observe(mainStory);
}

/* ─── Editorial colour reveal ─── */
const editorialSection = document.getElementById('editorials');
if (editorialSection) {
  const editorialObserver = new IntersectionObserver(entries => {
    editorialSection.classList.toggle('in-view', entries[0].isIntersecting);
  }, { threshold: 0.5 });
  editorialObserver.observe(editorialSection);
}

/* ─── Editorial strip (phones) ───
   Below 768px the tiles show one at a time. Each holds for 4s while the ring
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
  const N = tiles.length, HOLD = 4000, RING = 106.8;
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
   The top margin is the phone bar's height (0 when it is hidden from
   768px), so the class lands as the masthead slides fully under it. */
const mastHeader = document.querySelector('header');
const stickyBars = document.querySelectorAll('.mast-top, .nav-bar');
const mastTop = document.querySelector('.mast-top');
let stuckObserver;
function watchMasthead() {
  if (stuckObserver) stuckObserver.disconnect();
  stuckObserver = new IntersectionObserver(entries => {
    const stuck = !entries[0].isIntersecting;
    stickyBars.forEach(bar => bar.classList.toggle('is-stuck', stuck));
  }, { rootMargin: `-${mastTop ? mastTop.offsetHeight : 0}px 0px 0px 0px` });
  stuckObserver.observe(mastHeader);
}
if (mastHeader) {
  watchMasthead();
  window.matchMedia('(min-width: 768px)').addEventListener('change', watchMasthead);
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
