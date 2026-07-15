// ================== ECOMOTION — script partagé ==================

// --- Menu mobile ---
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const isOpen = mobileMenu.classList.contains('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// --- Bascule thème jour / nuit ---
const themeToggle = document.querySelector('.theme-toggle');
const root = document.documentElement;
function applyStoredTheme() {
  const saved = window.__ecomotionTheme || 'dark';
  root.setAttribute('data-theme', saved);
}
applyStoredTheme();
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', current);
    window.__ecomotionTheme = current;
  });
}

// --- FAQ accordéon ---
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (!q) return;
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// --- Filtres blog ---
const filterChips = document.querySelectorAll('.filter-chip');
const blogCards = document.querySelectorAll('[data-category]');
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.filter;
    blogCards.forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
    });
  });
});

// --- Estimation tarifaire simplifiée (démo) ---
const estimateForm = document.querySelector('#reservation-form');
const estimateBox = document.querySelector('#estimate-amount');
function computeEstimate() {
  if (!estimateForm || !estimateBox) return;
  const base = 8;
  const perKmNight = 1.9;
  const distanceInput = estimateForm.querySelector('[name="distance"]');
  const km = distanceInput ? parseFloat(distanceInput.value) || 6 : 6;
  const total = (base + km * perKmNight).toFixed(2);
  estimateBox.textContent = total + ' €';
}
if (estimateForm) {
  estimateForm.addEventListener('input', computeEstimate);
  computeEstimate();
}

// --- Soumission formulaires (démo statique, sans backend) ---
document.querySelectorAll('form[data-demo-submit]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const successPanel = form.parentElement.querySelector('.form-success');
    if (successPanel) {
      form.style.display = 'none';
      successPanel.classList.add('show');
    }
  });
});

// --- Année automatique dans le footer ---
document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});
