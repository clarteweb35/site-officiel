// ================== ECOMOTION — script partagé ==================

// --- Configuration tarifaire (chauffeur indépendant, Renault Zoé électrique) ---
const PRICING = {
  base: 3.13,      // prise en charge
  perKm: 1.77,     // tarif au kilomètre
  maxKm: 25,        // au-delà : hors zone habituelle (autonomie du véhicule)
  warnKm: 18        // à partir de cette distance : message d'avertissement
};

// --- Configuration disponibilité (Google Sheets via proxy JSON) ---
// Voir la note de configuration fournie en fin de réponse.
// Exemple avec opensheet.elk.sh : "https://opensheet.elk.sh/VOTRE_ID_SHEET/Statut"
const AVAILABILITY_ENDPOINT = ""; // <-- à renseigner

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

// --- Estimation tarifaire réelle (prise en charge + km) ---
const estimateForm = document.querySelector('#reservation-form');
const estimateBox = document.querySelector('#estimate-amount');
const distanceInput = estimateForm ? estimateForm.querySelector('[name="distance"]') : null;
const distanceWarning = document.querySelector('#distance-warning');
const continueBtn = document.querySelector('#btn-continue');

function computeEstimate() {
  if (!estimateForm || !estimateBox || !distanceInput) return;
  const km = parseFloat(distanceInput.value) || 0;
  const total = (PRICING.base + km * PRICING.perKm);
  estimateBox.textContent = total.toFixed(2).replace('.', ',') + ' €';

  if (distanceWarning) {
    if (km > PRICING.maxKm) {
      distanceWarning.textContent = "Ce trajet dépasse ma zone de service habituelle (" + PRICING.maxKm + " km), en raison de l'autonomie de mon véhicule 100% électrique. Contactez-moi directement pour étudier une solution.";
      distanceWarning.classList.add('show', 'danger');
      if (continueBtn) continueBtn.disabled = true;
    } else if (km > PRICING.warnKm) {
      distanceWarning.textContent = "Ce trajet approche de ma limite de service (" + PRICING.maxKm + " km). Je vous confirmerai sa faisabilité avant validation.";
      distanceWarning.classList.add('show');
      distanceWarning.classList.remove('danger');
      if (continueBtn) continueBtn.disabled = false;
    } else {
      distanceWarning.classList.remove('show', 'danger');
      if (continueBtn) continueBtn.disabled = false;
    }
  }
}
if (estimateForm) {
  estimateForm.addEventListener('input', computeEstimate);
  computeEstimate();
}

// --- Passage à l'étape 2 : demande de réservation (coordonnées) ---
const step2 = document.querySelector('#reservation-step-2');
if (continueBtn && step2) {
  continueBtn.addEventListener('click', () => {
    step2.classList.remove('step-hidden');
    continueBtn.parentElement.classList.add('step-hidden');
    step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// --- Soumission formulaires (démo statique, sans backend) ---
document.querySelectorAll('form[data-demo-submit]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const successPanel = form.closest('.form-card, .container').querySelector('.form-success');
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

// --- Disponibilité en temps réel (Google Sheets) ---
async function checkAvailability() {
  const pills = document.querySelectorAll('.avail-pill');
  const banner = document.querySelector('#availability-banner');
  const reservationFlow = document.querySelector('#reservation-flow');

  if (!AVAILABILITY_ENDPOINT) {
    // Pas d'endpoint configuré : on considère le service disponible par défaut,
    // sans bloquer le prototype. À remplacer une fois le Google Sheet branché.
    setAvailabilityUI('disponible', "Disponible actuellement", pills, banner, reservationFlow);
    return;
  }

  try {
    const res = await fetch(AVAILABILITY_ENDPOINT, { cache: 'no-store' });
    const data = await res.json();
    const row = Array.isArray(data) ? data[0] : data;
    const statut = (row && row.statut ? String(row.statut) : 'disponible').toLowerCase().trim();
    const message = (row && row.message) ? row.message : null;
    setAvailabilityUI(statut, message, pills, banner, reservationFlow);
  } catch (err) {
    // En cas d'échec réseau, on n'affiche pas de fausse indisponibilité :
    // on masque simplement le badge pour ne pas induire en erreur.
    pills.forEach(p => p.style.display = 'none');
  }
}

function setAvailabilityUI(statut, message, pills, banner, reservationFlow) {
  const labels = {
    disponible: { text: "Disponible actuellement", cls: "ok" },
    en_course: { text: "En course — bientôt disponible", cls: "warn" },
    indisponible: { text: "Indisponible actuellement", cls: "off" }
  };
  const state = labels[statut] || labels.disponible;

  pills.forEach(pill => {
    pill.textContent = "● " + state.text;
    pill.dataset.state = state.cls;
  });

  if (banner) {
    if (statut === 'disponible') {
      banner.classList.remove('show');
    } else {
      banner.classList.add('show');
      banner.querySelector('.availability-text').textContent = message ||
        (statut === 'en_course'
          ? "Je suis actuellement en course. Vous pouvez tout de même envoyer une demande, je vous répondrai dès que possible."
          : "Le service est momentanément fermé. Vous pouvez laisser une demande de réservation à l'avance, je la traiterai à ma prochaine disponibilité.");
    }
  }

  if (reservationFlow && statut === 'indisponible') {
    reservationFlow.classList.add('is-closed');
  }
}
checkAvailability();
