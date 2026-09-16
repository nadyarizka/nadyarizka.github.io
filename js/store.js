// Local persistence layer for the CMS. Since this is a static site with no
// backend, edits made in admin/index.html are saved to localStorage and merged over
// the defaults in data.js whenever a page reads persona/about content.
// Both the CMS and the public pages (index/about/post) go through here so
// there is exactly one source of truth at runtime.

const STORE_KEY = "nadyaCmsOverrides";

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(overrides));
  } catch (e) {
    // Storage full or unavailable (private browsing) — edits just won't persist.
  }
}

let _overrides = loadOverrides();

function getOverrides() {
  return _overrides;
}

// ---- Persona profile + content ----

function getPersonaData(persona) {
  const base = SITE[persona] || {};
  const ov = (_overrides.personas && _overrides.personas[persona]) || {};
  return Object.assign({}, base, ov);
}

function setPersonaField(persona, field, value) {
  if (!_overrides.personas) _overrides.personas = {};
  if (!_overrides.personas[persona]) _overrides.personas[persona] = {};
  _overrides.personas[persona][field] = value;
  saveOverrides(_overrides);
}

function getPersonaField(persona, field) {
  const ov = _overrides.personas && _overrides.personas[persona];
  if (ov && Object.prototype.hasOwnProperty.call(ov, field)) return ov[field];
  return (SITE[persona] || {})[field];
}

// ---- List fields (works / experience / testimonials / countriesVisited) ----
// Stored as a full-array replacement once touched, so add/edit/remove/reorder
// in the CMS is just "write the whole array back".

function getPersonaList(persona, field) {
  const ov = _overrides.personas && _overrides.personas[persona];
  if (ov && Array.isArray(ov[field])) return ov[field];
  return (SITE[persona] && SITE[persona][field]) || [];
}

function setPersonaList(persona, field, list) {
  setPersonaField(persona, field, list);
}

function makeId(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

// ---- Display formatting shared by public pages + the CMS ----

function formatWorkMeta(w) {
  return [w.year, w.company].filter(Boolean).join(" • ");
}

function formatExpMeta(e) {
  return [e.period, e.location].filter(Boolean).join(" • ");
}

// ---- About page content ----

function getAboutData() {
  const ov = _overrides.about || {};
  return {
    intro: ov.intro || ABOUT.intro,
    personaText: Object.assign({}, ABOUT.personaText, ov.personaText || {}),
    skills: ov.skills || ABOUT.skills,
    tools: ov.tools || ABOUT.tools,
  };
}

function setAboutPersonaText(persona, value) {
  if (!_overrides.about) _overrides.about = {};
  if (!_overrides.about.personaText) _overrides.about.personaText = {};
  _overrides.about.personaText[persona] = value;
  saveOverrides(_overrides);
}

function setAboutList(field, list) {
  if (!_overrides.about) _overrides.about = {};
  _overrides.about[field] = list;
  saveOverrides(_overrides);
}

function resetAllOverrides() {
  _overrides = {};
  saveOverrides(_overrides);
}

// ---- Site-wide settings (favicon) ----

function getSiteData() {
  return Object.assign({ favicon: "/assets/favicon.png" }, _overrides.site || {});
}

function setSiteField(field, value) {
  if (!_overrides.site) _overrides.site = {};
  _overrides.site[field] = value;
  saveOverrides(_overrides);
}

function applyStoredFavicon() {
  const site = _overrides.site || {};
  if (!site.favicon) return;
  const link = document.querySelector('link[rel="icon"]');
  if (link) link.href = site.favicon;
}

applyStoredFavicon();
