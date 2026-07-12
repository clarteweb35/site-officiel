/* ==========================================================================
   LE FOURNIL DE L'AUBE — script.js
   JS léger, sans dépendance : menu mobile, indicateur d'horaires en direct,
   validation et simulation de soumission du formulaire Click & Collect.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------
     1. MENU MOBILE
     ------------------------------------------------------------ */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Ferme le menu après un clic sur un lien (mobile)
    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------
     2. INDICATEUR D'HORAIRES EN DIRECT
     Horaires : Mar-Sam 6h30-13h30 / 15h30-19h30, Dim 7h-13h, Lun fermé
     ------------------------------------------------------------ */
  var HORAIRES = {
    // 0 = dimanche ... 6 = samedi
    0: [["07:00", "13:00"]],
    1: [], // lundi fermé
    2: [["06:30", "13:30"], ["15:30", "19:30"]],
    3: [["06:30", "13:30"], ["15:30", "19:30"]],
    4: [["06:30", "13:30"], ["15:30", "19:30"]],
    5: [["06:30", "13:30"], ["15:30", "19:30"]],
    6: [["06:30", "13:30"], ["15:30", "19:30"]]
  };

  function toMinutes(hhmm) {
    var parts = hhmm.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function majStatutOuverture() {
    var el = document.getElementById("statutOuverture");
    if (!el) return;

    var now = new Date();
    var jour = now.getDay();
    var minutesActuelles = now.getHours() * 60 + now.getMinutes();
    var creneaux = HORAIRES[jour] || [];

    var estOuvert = creneaux.some(function (creneau) {
      return minutesActuelles >= toMinutes(creneau[0]) && minutesActuelles < toMinutes(creneau[1]);
    });

    var texteEl = el.querySelector(".statut-text");

    if (estOuvert) {
      el.setAttribute("data-state", "open");
      if (texteEl) texteEl.textContent = "Ouvert actuellement";
    } else {
      el.setAttribute("data-state", "closed");
      if (texteEl) texteEl.textContent = "Fermé actuellement";
    }
  }

  majStatutOuverture();
  // Réévalue toutes les minutes si la page reste ouverte
  setInterval(majStatutOuverture, 60000);

  /* ------------------------------------------------------------
     3. FORMULAIRE CLICK & COLLECT
     Validation simple + simulation de confirmation (site de démonstration,
     aucune donnée n'est envoyée à un serveur réel).
     ------------------------------------------------------------ */
  var form = document.getElementById("commandeForm");
  var errorBox = document.getElementById("formError");
  var successBox = document.getElementById("commandeSuccess");
  var successDetail = document.getElementById("commandeSuccessDetail");
  var resetBtn = document.getElementById("commandeReset");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        errorBox.hidden = false;
        errorBox.textContent = "Merci de vérifier les champs : un produit, un créneau, votre nom et votre téléphone sont nécessaires.";
        var premierInvalide = form.querySelector(":invalid");
        if (premierInvalide) premierInvalide.focus();
        return;
      }

      errorBox.hidden = true;

      var produitSelect = document.getElementById("produit");
      var produitTexte = produitSelect.options[produitSelect.selectedIndex].text;
      var quantite = document.getElementById("quantite").value;
      var creneauSelect = document.getElementById("creneau");
      var creneauTexte = creneauSelect.options[creneauSelect.selectedIndex].text;
      var nom = document.getElementById("nom").value;

      successDetail.textContent =
        "Merci " + nom + ", " + quantite + " × " + produitTexte.split(" — ")[0] +
        " vous attendra entre " + creneauTexte + ".";

      form.hidden = true;
      successBox.hidden = false;
      successBox.focus();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      form.hidden = false;
      successBox.hidden = true;
      errorBox.hidden = true;
      document.getElementById("produit").focus();
    });
  }

})();
