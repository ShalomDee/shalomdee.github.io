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
  if (themeColor) themeColor.content = dark ? '#121417' : '#F4F1ED';
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

/* ─── Nav scroll spy ─── */
const sections = document.querySelectorAll('section[id], div[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-ticker a:not(.nav-cta)');

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

})();
