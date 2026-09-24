// Data-access layer over SITE / ABOUT / SITE_SETTINGS (from data.js).
//
// There is no separate local draft anymore. GitHub is the only place edits
// persist — the CMS mutates these objects directly in memory as its one
// working copy, and cms.js's debounced scheduleSave()/flushSave() (backed
// by publish.js's saveToGithub()) is responsible for getting that state
// onto the live repo. Every page — public and admin — starts from whatever
// loadPublishedContent() merged in from data/content.json, so these
// getters always reflect "the last thing that was actually saved," plus
// whatever the CMS has changed in this tab since.

function makeId(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

// ---- Persona profile + content ----

function getPersonaData(persona) {
  return SITE[persona] || {};
}

function setPersonaField(persona, field, value) {
  if (!SITE[persona]) SITE[persona] = {};
  SITE[persona][field] = value;
}

// ---- List fields (works / experience / testimonials / countriesVisited / socials / etc.) ----
// Stored as a full-array replacement once touched, so add/edit/remove/reorder
// in the CMS is just "write the whole array back".

function getPersonaList(persona, field) {
  return (SITE[persona] && SITE[persona][field]) || [];
}

function setPersonaList(persona, field, list) {
  setPersonaField(persona, field, list);
}

// ---- Display formatting shared by public pages + the CMS ----

function formatWorkMeta(w) {
  return [w.year, w.company].filter(Boolean).join(" • ");
}

function formatExpMeta(e) {
  return [e.period, e.location].filter(Boolean).join(" • ");
}

// ---- Selected works ----
// A persona that carries a `selectedWorkIds` array curates its homepage works
// as references into the Blog Posts list. Personas without one just show every
// published item, as before.

function usesWorkSelection(data) {
  return Array.isArray(data.selectedWorkIds);
}

function getSelectedWorks(data) {
  const posts = data.works || [];
  if (!usesWorkSelection(data)) return posts.filter((w) => w.published !== false);
  return data.selectedWorkIds
    .map((id) => posts.find((w) => w.id === id))
    .filter((w) => w && w.published !== false);
}

// ---- About page content ----

function getAboutData() {
  return ABOUT;
}

function setAboutPersonaText(persona, value) {
  if (!ABOUT.personaText) ABOUT.personaText = {};
  ABOUT.personaText[persona] = value;
}

// ---- Site-wide settings (favicon) ----

function getSiteData() {
  return SITE_SETTINGS;
}

function setSiteField(field, value) {
  SITE_SETTINGS[field] = value;
}

function applyStoredFavicon() {
  const favicon = getSiteData().favicon;
  if (!favicon) return;
  const link = document.querySelector('link[rel="icon"]');
  if (link) link.href = favicon;
}

applyStoredFavicon();
