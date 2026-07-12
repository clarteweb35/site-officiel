(function () {
  'use strict';

  /* ---------------------------------------------------------------------
   * Statut d'ouverture en temps réel
   * Logique métier : ouvert (vert, pastille qui pulse) du lundi au
   * vendredi, 8h-19h ; en dehors de ce créneau, "urgences uniquement"
   * (ambre). Le texte et la couleur du point de statut sont mis à jour
   * ensemble pour rester cohérents avec le schéma horaires du JSON-LD.
   * ------------------------------------------------------------------- */
  function updateStatus() {
    const statusEl = document.getElementById('statutOuverture');
    const dotEl = document.getElementById('statusDot');
    if (!statusEl || !dotEl) return;

    const now = new Date();
    const day = now.getDay();   // 0 = dimanche, 6 = samedi
    const hour = now.getHours();
    const isWeekday = day > 0 && day < 6;
    const isOpenHours = hour >= 8 && hour < 19;
    const isOpen = isWeekday && isOpenHours;

    statusEl.textContent = isOpen
      ? 'Ouvert : intervention immédiate'
      : 'Urgences uniquement';
    dotEl.classList.toggle('is-closed', !isOpen);
  }

  updateStatus();
  // Recalcule toutes les minutes pour rester juste sans recharger la page.
  setInterval(updateStatus, 60 * 1000);

  /* ---------------------------------------------------------------------
   * Confirmation de formulaire : remplace le formulaire par un message
   * de succès animé (pop-in), plutôt qu'une alerte brute. Le message
   * reste dans le même conteneur pour ne pas déplacer le regard.
   * ------------------------------------------------------------------- */
  const form = document.getElementById('devisForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const wrapper = form.parentElement;
      wrapper.innerHTML =
        '<div class="success-msg">' +
        '<span aria-hidden="true">✅</span>' +
        '<span>Demande reçue, un plombier vous rappelle rapidement.</span>' +
        '</div>';
    });
  }
})();
