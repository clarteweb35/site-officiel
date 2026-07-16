// ================== ECOMOTION — Intégration Google Maps ==================
// Ce module active : autocomplétion d'adresses (Places), géolocalisation +
// reverse geocoding, calcul d'itinéraire (Directions) et affichage de la
// carte avec le tracé du trajet.
//
// Il ne fait RIEN tant que l'API Google Maps n'est pas chargée avec une clé
// valide (voir index des instructions en fin de fichier / réponse). Sans
// clé configurée, le formulaire reste pleinement utilisable en mode manuel
// (saisie libre de l'adresse + distance en km).

let map, directionsService, directionsRenderer, geocoder;
let departAutocomplete, arriveeAutocomplete;
let departPlace = null;
let arriveePlace = null;

const $depart = () => document.querySelector('#depart');
const $arrivee = () => document.querySelector('#arrivee');
const $distance = () => document.querySelector('#distance');
const $geoStatus = () => document.querySelector('#geo-status');
const $routeSummary = () => document.querySelector('#route-summary');
const $mapCanvas = () => document.querySelector('#map-canvas');
const $svgFallback = () => document.querySelector('#route-svg-fallback');

// --- Point d'entrée : appelé automatiquement par le callback du script Google Maps ---
function initEcomotionMaps() {
  const mapEl = $mapCanvas();
  if (!mapEl) return; // pas sur la page de réservation

  geocoder = new google.maps.Geocoder();
  directionsService = new google.maps.DirectionsService();

  map = new google.maps.Map(mapEl, {
    center: { lat: 45.75, lng: 4.85 }, // à ajuster sur votre ville
    zoom: 12,
    disableDefaultUI: true,
    zoomControl: true,
    styles: NIGHT_MAP_STYLE
  });

  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: false,
    polylineOptions: { strokeColor: '#e3a542', strokeWeight: 4, strokeOpacity: 0.9 }
  });

  // Bascule visuelle : carte réelle à la place du schéma décoratif
  mapEl.classList.add('show');
  if ($svgFallback()) $svgFallback().classList.add('hide-fallback');

  setupAutocomplete();
  setupGeolocationButton();
}
window.initEcomotionMaps = initEcomotionMaps;

// --- Autocomplétion Google Places sur les deux champs ---
function setupAutocomplete() {
  const options = {
    fields: ['formatted_address', 'geometry', 'name'],
    componentRestrictions: { country: 'fr' } // à adapter/retirer selon votre zone
  };

  if ($depart()) {
    departAutocomplete = new google.maps.places.Autocomplete($depart(), options);
    departAutocomplete.addListener('place_changed', () => {
      const place = departAutocomplete.getPlace();
      if (place && place.geometry) {
        departPlace = place;
        maybeCalculateRoute();
      }
    });
  }

  if ($arrivee()) {
    arriveeAutocomplete = new google.maps.places.Autocomplete($arrivee(), options);
    arriveeAutocomplete.addListener('place_changed', () => {
      const place = arriveeAutocomplete.getPlace();
      if (place && place.geometry) {
        arriveePlace = place;
        maybeCalculateRoute();
      }
    });
  }
}

// --- Bouton "Utiliser ma position actuelle" ---
function setupGeolocationButton() {
  const btn = document.querySelector('#btn-geoloc');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      setGeoStatus("La géolocalisation n'est pas supportée par ce navigateur. Veuillez saisir votre adresse manuellement.", 'error');
      return;
    }

    btn.classList.add('loading');
    setGeoStatus('Localisation en cours…', '');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        geocoder.geocode({ location: latLng }, (results, status) => {
          btn.classList.remove('loading');
          if (status === 'OK' && results[0]) {
            $depart().value = results[0].formatted_address;
            departPlace = { geometry: { location: new google.maps.LatLng(latLng.lat, latLng.lng) } };
            setGeoStatus('Position récupérée avec succès.', 'success');
            maybeCalculateRoute();
          } else {
            setGeoStatus("Impossible de récupérer votre position. Veuillez saisir votre adresse manuellement.", 'error');
          }
        });
      },
      () => {
        btn.classList.remove('loading');
        setGeoStatus("Impossible de récupérer votre position. Veuillez saisir votre adresse manuellement.", 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

function setGeoStatus(message, type) {
  const el = $geoStatus();
  if (!el) return;
  el.textContent = message;
  el.classList.remove('error', 'success');
  if (type) el.classList.add(type);
}

// --- Calcul d'itinéraire dès que départ ET arrivée sont renseignés ---
function maybeCalculateRoute() {
  const originValue = departPlace ? (departPlace.geometry.location) : $depart().value;
  const destValue = arriveePlace ? (arriveePlace.geometry.location) : $arrivee().value;

  if (!$depart().value || !$arrivee().value) return;
  if (!departPlace && !arriveePlace) return; // attend une sélection Places réelle

  showRouteLoading();

  directionsService.route(
    {
      origin: originValue,
      destination: destValue,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        const leg = result.routes[0].legs[0];
        const km = leg.distance.value / 1000;
        const minutes = Math.round(leg.duration.value / 60);

        if ($distance()) {
          $distance().value = km.toFixed(1);
          $distance().dispatchEvent(new Event('input')); // déclenche le recalcul du prix (script.js)
        }
        showRouteSummary(km, minutes);
      } else {
        showRouteError();
      }
    }
  );
}

function showRouteLoading() {
  const el = $routeSummary();
  if (!el) return;
  el.innerHTML = '<span class="chip loading">Calcul de l\'itinéraire…</span>';
}
function showRouteSummary(km, minutes) {
  const el = $routeSummary();
  if (!el) return;
  el.innerHTML =
    '<span class="chip">📍 ' + km.toFixed(1) + ' km</span>' +
    '<span class="chip">⏱ ' + minutes + ' min</span>';
}
function showRouteError() {
  const el = $routeSummary();
  if (!el) return;
  el.innerHTML = '<span class="chip">Itinéraire indisponible pour ces adresses — vérifiez leur exactitude.</span>';
}

// --- Style de carte assorti à la charte graphique nocturne ---
const NIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a1120' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8791a8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2540' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#121b2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050810' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] }
];
