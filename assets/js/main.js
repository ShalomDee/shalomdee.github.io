/* ═══ THE MAKER'S TIMES — main.js ═══ */

const SVG_SUN  = `<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>`;
const SVG_MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

/* ─── Theme ─── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-icon').forEach(icon => {
    icon.innerHTML = theme === 'dark' ? SVG_SUN : SVG_MOON;
  });
  const label = document.querySelector('.mast-theme-label');
  if (label) label.textContent = theme === 'dark' ? 'Day Edition' : 'Night Edition';
  const illo = document.getElementById('heroIllo');
  if (illo) illo.src = theme === 'dark'
    ? './assets/images/hero-dark.png'
    : './assets/images/hero-light.png';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

// Init from storage
const saved = localStorage.getItem('theme');
applyTheme(saved || 'light');

document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', toggleTheme));

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
  drawerClose.addEventListener('click', () => closeNav(true));
  drawerOverlay.addEventListener('click', () => closeNav(true));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeNav(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(true); });
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
