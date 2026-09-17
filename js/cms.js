// Bespoke Content CMS — edits are saved to localStorage (via store.js) and
// read back by index.html / about.html / post.html at render time.

function escapeAttr(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(str) {
  return escapeAttr(str);
}

const CMS_SECTIONS_BY_PERSONA = {
  designer: [
    { id: "profile", label: "Profile & About" },
    { id: "works", label: "Selected Works" },
    { id: "posts", label: "Blog Posts" },
    { id: "experience", label: "Experience" },
    { id: "testimonials", label: "Testimonials" },
    { id: "socials", label: "Socials" },
  ],
  traveller: [
    { id: "about", label: "About Me" },
    { id: "hero", label: "Hero Section" },
    { id: "works", label: "Travel Stories" },
    { id: "countries", label: "Countries Visited" },
    { id: "socials", label: "Socials" },
  ],
  mother: [
    { id: "hero", label: "Hero Section" },
    { id: "about", label: "About Me" },
    { id: "works", label: "My Stories" },
    { id: "tiktok", label: "TikTok Videos" },
    { id: "socials", label: "Socials" },
  ],
};

function getCmsSections(persona) {
  return CMS_SECTIONS_BY_PERSONA[persona] || CMS_SECTIONS_BY_PERSONA.designer;
}

const CMS_ICONS = {
  profile:
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  about:
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  hero:
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>',
  works:
    '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
  posts:
    '<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
  experience:
    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path>',
  testimonials:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  countries:
    '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
  socials:
    '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
  tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>',
  site:
    '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>',
};

const SITE_SECTION = { id: "site", label: "Site Settings" };

function iconSvg(pathContent, size) {
  const s = size || 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cms-icon">${pathContent}</svg>`;
}

const TRASH_ICON =
  '<path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>';
const PLUS_ICON = '<path d="M5 12h14"></path><path d="M12 5v14"></path>';
const PENCIL_ICON =
  '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path>';
const SAVE_ICON =
  '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path>';
const UPLOAD_ICON =
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>';
const BACK_ICON = '<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>';

let cmsPersona = "designer";
let cmsSection = "profile";
let cmsView = "list";
let cmsEditIndex = null;
let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById("cms-toast");
  toast.textContent = message || "Saved";
  toast.classList.add("show");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
}

// ---- Sidebar ----

function renderSidebar() {
  const personaNav = document.getElementById("cms-persona-nav");
  personaNav.innerHTML = PERSONAS.map(
    (p) => `
    <button class="cms-nav-item${p === cmsPersona ? " active" : ""}" type="button" onclick="selectPersona('${p}')">
      ${PERSONA_LABELS[p]}
    </button>`
  ).join("");

  const contentNav = document.getElementById("cms-content-nav");
  contentNav.innerHTML = getCmsSections(cmsPersona)
    .map(
      (s) => `
    <button class="cms-nav-item${s.id === cmsSection ? " active" : ""}" type="button" onclick="selectSection('${s.id}')">
      ${iconSvg(CMS_ICONS[s.id])}
      ${s.label}
    </button>`
    )
    .join("");

  const siteNav = document.getElementById("cms-site-nav");
  if (siteNav) {
    siteNav.innerHTML = `
    <button class="cms-nav-item${cmsSection === SITE_SECTION.id ? " active" : ""}" type="button" onclick="selectSection('${SITE_SECTION.id}')">
      ${iconSvg(CMS_ICONS.site)}
      ${SITE_SECTION.label}
    </button>`;
  }
}

function selectPersona(persona) {
  cmsPersona = persona;
  const sections = getCmsSections(cmsPersona);
  if (cmsSection !== SITE_SECTION.id && !sections.find((s) => s.id === cmsSection)) {
    cmsSection = sections[0].id;
  }
  cmsView = "list";
  cmsEditIndex = null;
  renderSidebar();
  renderHeader();
  renderPanel();
}

function selectSection(section) {
  cmsSection = section;
  cmsView = "list";
  cmsEditIndex = null;
  renderSidebar();
  renderHeader();
  renderPanel();
}

function renderHeader() {
  if (cmsSection === SITE_SECTION.id) {
    document.getElementById("cms-eyebrow").textContent = "SITE";
    document.getElementById("cms-title").textContent = SITE_SECTION.label;
    return;
  }
  document.getElementById("cms-eyebrow").textContent = PERSONA_LABELS[cmsPersona].toUpperCase() + " PERSONA";
  const sectionDef = getCmsSections(cmsPersona).find((s) => s.id === cmsSection);
  document.getElementById("cms-title").textContent = sectionDef ? sectionDef.label : "";
}

function goBackToList() {
  cmsView = "list";
  cmsEditIndex = null;
  renderPanel();
}

function goToEdit(index) {
  cmsView = "edit";
  cmsEditIndex = index;
  renderPanel();
}

// ---- Panel dispatch ----

function renderPanel() {
  const panel = document.getElementById("cms-panel");
  if (cmsSection === "profile") panel.innerHTML = renderProfilePanel(cmsPersona);
  else if (cmsSection === "hero") panel.innerHTML = renderHeroPanel(cmsPersona);
  else if (cmsSection === "about") panel.innerHTML = renderAboutMePanel(cmsPersona);
  else if (cmsSection === "works") panel.innerHTML = renderWorkLikePanel(cmsPersona, WORKS_CONFIG);
  else if (cmsSection === "posts") panel.innerHTML = renderWorkLikePanel(cmsPersona, POSTS_CONFIG);
  else if (cmsSection === "experience") panel.innerHTML = renderExperiencePanel(cmsPersona);
  else if (cmsSection === "testimonials") panel.innerHTML = renderTestimonialsPanel(cmsPersona);
  else if (cmsSection === "countries") panel.innerHTML = renderCountriesPanel(cmsPersona);
  else if (cmsSection === "socials") panel.innerHTML = renderSocialsPanel(cmsPersona);
  else if (cmsSection === "tiktok") panel.innerHTML = renderTikTokPanel(cmsPersona);
  else if (cmsSection === SITE_SECTION.id) panel.innerHTML = renderSitePanel();
}

// ---- Profile & About ----

function renderProfilePanel(persona) {
  const data = getPersonaData(persona);
  const about = getAboutData();
  const fullAboutMe = about.personaText[persona] || "";

  return `
    <div class="cms-card">
      <h2 class="cms-card-title">Edit Profile</h2>
      ${renderHeroFields(persona, data)}

      <div class="cms-field">
        <label class="cms-label">Short About (Homepage)</label>
        <textarea class="cms-textarea" rows="3" oninput="updatePersonaField('${persona}', 'aboutText', this.value)">${escapeHtml(data.aboutText)}</textarea>
      </div>

      <div class="cms-field">
        <label class="cms-label">Full About Me</label>
        <textarea class="cms-textarea" rows="6" oninput="updateFullAboutMe('${persona}', this.value)">${escapeHtml(fullAboutMe)}</textarea>
      </div>
    </div>`;
}

// ---- Hero Section (avatar / headline / tagline / resume / availability / marquee) ----

function renderHeroPanel(persona) {
  const data = getPersonaData(persona);

  return `
    <div class="cms-card">
      <h2 class="cms-card-title">Edit Hero Section</h2>
      ${renderHeroFields(persona, data)}
    </div>`;
}

// Shared by both the Designer's combined "Profile & About" panel and the
// Traveller/Mother "Hero Section" panel — same underlying hero fields either way.
function renderHeroFields(persona, data) {
  const isUploadedResume = data.resumeUrl && data.resumeUrl.indexOf("data:") === 0;
  const resumeField = isUploadedResume
    ? `<div class="cms-file-badge">${iconSvg('<path d="M14 2v6h6"></path><path d="M6 22h12a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"></path>', 15)}Resume uploaded<button type="button" class="cms-row-remove" onclick="clearResume('${persona}')">&times;</button></div>`
    : `<input class="cms-input" type="text" placeholder="https://..." value="${escapeAttr(data.resumeUrl)}" oninput="updatePersonaField('${persona}', 'resumeUrl', this.value)">`;

  return `
    <div class="cms-field">
      <label class="cms-label">Avatar</label>
      <div class="cms-avatar-row">
        <div class="cms-avatar-preview"><img id="cms-avatar-img" src="${escapeAttr(data.avatar)}" alt=""></div>
        <button class="cms-upload-btn" type="button" onclick="document.getElementById('cms-avatar-file').click()">
          ${iconSvg(UPLOAD_ICON)}
          Upload photo
        </button>
        <input type="file" id="cms-avatar-file" accept="image/*" style="display:none" onchange="handleAvatarUpload(event, '${persona}')">
      </div>
    </div>

    <div class="cms-field">
      <label class="cms-label">Headline</label>
      <input class="cms-input" type="text" value="${escapeAttr(data.headline)}" oninput="updatePersonaField('${persona}', 'headline', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Tagline</label>
      <input class="cms-input" type="text" value="${escapeAttr(data.tagline)}" oninput="updatePersonaField('${persona}', 'tagline', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Resume</label>
      ${resumeField}
      <button class="cms-upload-btn" type="button" style="margin-top:10px" onclick="document.getElementById('cms-resume-file').click()">${iconSvg(UPLOAD_ICON)}Upload resume (PDF)</button>
      <input type="file" id="cms-resume-file" accept="application/pdf,.pdf,.doc,.docx" style="display:none" onchange="handleResumeUpload(event, '${persona}')">
    </div>

    <div class="cms-field">
      <label class="cms-checkbox-item"><input type="checkbox" ${data.availableForWork ? "checked" : ""} onchange="updatePersonaField('${persona}', 'availableForWork', this.checked)">Available for work</label>
    </div>

    ${renderMarqueeImagesField(persona, data)}`;
}

// ---- About Me (short homepage blurb + full About page text) ----

function renderAboutMePanel(persona) {
  const data = getPersonaData(persona);
  const about = getAboutData();
  const fullAboutMe = about.personaText[persona] || "";

  return `
    <div class="cms-card">
      <h2 class="cms-card-title">Edit About Me</h2>

      <div class="cms-field">
        <label class="cms-label">Short About (Homepage)</label>
        <textarea class="cms-textarea" rows="3" oninput="updatePersonaField('${persona}', 'aboutText', this.value)">${escapeHtml(data.aboutText)}</textarea>
      </div>

      <div class="cms-field">
        <label class="cms-label">Full About Me</label>
        <textarea class="cms-textarea" rows="6" oninput="updateFullAboutMe('${persona}', this.value)">${escapeHtml(fullAboutMe)}</textarea>
      </div>
    </div>`;
}

function updatePersonaField(persona, field, value) {
  setPersonaField(persona, field, value);
  showToast("Saved");
}

function updateFullAboutMe(persona, value) {
  setAboutPersonaText(persona, value);
  showToast("Saved");
}

function handleAvatarUpload(event, persona) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    setPersonaField(persona, "avatar", dataUrl);
    const img = document.getElementById("cms-avatar-img");
    if (img) img.src = dataUrl;
    showToast("Photo updated");
  };
  reader.readAsDataURL(file);
}

function handleResumeUpload(event, persona) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    setPersonaField(persona, "resumeUrl", reader.result);
    renderPanel();
    showToast("Resume uploaded");
  };
  reader.readAsDataURL(file);
}

function clearResume(persona) {
  setPersonaField(persona, "resumeUrl", "");
  renderPanel();
  showToast("Resume removed");
}

// ---- Marquee images (per persona) ----

function renderMarqueeImagesField(persona, data) {
  const images = data.marqueeImages || [];
  const thumbs = images
    .map(
      (img, i) => `
      <div class="cms-marquee-thumb">
        <img src="${escapeAttr(img)}" alt="">
        <button type="button" class="cms-marquee-thumb-remove" onclick="removeMarqueeImage('${persona}', ${i})">&times;</button>
      </div>`
    )
    .join("");

  return `
    <div class="cms-field">
      <label class="cms-label">Marquee Images</label>
      <div class="cms-marquee-thumbs">${thumbs}</div>
      <button class="cms-upload-btn" type="button" onclick="document.getElementById('cms-marquee-file').click()">${iconSvg(UPLOAD_ICON)}Add image</button>
      <input type="file" id="cms-marquee-file" accept="image/*" style="display:none" onchange="handleMarqueeUpload(event, '${persona}')">
    </div>`;
}

function handleMarqueeUpload(event, persona) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const list = getPersonaList(persona, "marqueeImages").slice();
    list.push(reader.result);
    setPersonaList(persona, "marqueeImages", list);
    renderPanel();
    showToast("Image added");
  };
  reader.readAsDataURL(file);
}

function removeMarqueeImage(persona, index) {
  const list = getPersonaList(persona, "marqueeImages").slice();
  list.splice(index, 1);
  setPersonaList(persona, "marqueeImages", list);
  renderPanel();
  showToast("Image removed");
}

// ---- Site Settings (favicon) ----

function renderSitePanel() {
  const site = getSiteData();

  return `
    <div class="cms-card">
      <h2 class="cms-card-title">Site Settings</h2>

      <div class="cms-field">
        <label class="cms-label">Favicon</label>
        <div class="cms-avatar-row">
          <div class="cms-avatar-preview"><img id="cms-favicon-img" src="${escapeAttr(site.favicon)}" alt=""></div>
          <button class="cms-upload-btn" type="button" onclick="document.getElementById('cms-favicon-file').click()">
            ${iconSvg(UPLOAD_ICON)}
            Upload favicon
          </button>
          <input type="file" id="cms-favicon-file" accept="image/*" style="display:none" onchange="handleFaviconUpload(event)">
        </div>
      </div>
    </div>`;
}

function handleFaviconUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    setSiteField("favicon", dataUrl);
    const img = document.getElementById("cms-favicon-img");
    if (img) img.src = dataUrl;
    const headLink = document.querySelector('link[rel="icon"]');
    if (headLink) headLink.href = dataUrl;
    showToast("Favicon updated");
  };
  reader.readAsDataURL(file);
}

// ---- Selected Works / Blog Posts (share the same underlying "works" list) ----

const WORKS_CONFIG = {
  listField: "works",
  listTitle: (persona) => getPersonaData(persona).worksHeading || "Selected Works",
  editTitle: "Edit Work",
  secondMetaLabel: "Company",
  newItemLabel: "New item",
  // Designer authors content under Blog Posts — Selected Works there is just
  // a picker (backed by the existing "published" flag) for which posts
  // surface as homepage cards, not a separate list of its own.
  selectionOnlyFor: "designer",
};

const POSTS_CONFIG = {
  listField: "works",
  listTitle: "Blog Posts",
  editTitle: "Edit Post",
  secondMetaLabel: "Context",
  newItemLabel: "New item",
};

function newWorkLikeItem(label) {
  return {
    id: makeId("work"),
    title: label || "New item",
    description: "",
    year: "",
    company: "",
    tags: [],
    content: "",
    coverImage: "",
    featured: false,
    published: true,
  };
}

function renderWorkLikePanel(persona, cfg) {
  const list = getPersonaList(persona, cfg.listField);
  if (cmsView === "edit" && cmsEditIndex != null && list[cmsEditIndex]) {
    return renderWorkLikeEdit(persona, cfg, cmsEditIndex, list[cmsEditIndex]);
  }
  return renderWorkLikeList(persona, cfg, list);
}

function renderWorkLikeList(persona, cfg, list) {
  if (cfg.selectionOnlyFor === persona) {
    return renderWorkSelectionList(persona, cfg, list);
  }

  const rows = list
    .map(
      (item, i) => `
      <div class="cms-row-item">
        <div>
          <p class="cms-row-title">${escapeHtml(item.title)}</p>
          <p class="cms-row-meta">${escapeHtml(formatWorkMeta(item))}</p>
        </div>
        <div class="cms-row-actions">
          <button class="cms-icon-btn" type="button" title="Edit" onclick="goToEdit(${i})">${iconSvg(PENCIL_ICON, 15)}</button>
          <button class="cms-icon-btn cms-icon-btn-danger" type="button" title="Delete" onclick="deleteWorkLikeItem('${persona}', '${cfg.listField}', ${i})">${iconSvg(TRASH_ICON, 15)}</button>
        </div>
      </div>`
    )
    .join("");

  const listTitle = typeof cfg.listTitle === "function" ? cfg.listTitle(persona) : cfg.listTitle;

  return `
    <div class="cms-list-header">
      <h2 class="cms-list-header-title">${escapeHtml(listTitle)}</h2>
      <button class="cms-add-btn" type="button" onclick="addWorkLikeItem('${persona}', '${cfg.listField}', '${escapeAttr(cfg.newItemLabel)}')">${iconSvg(PLUS_ICON, 14)}New</button>
    </div>
    ${rows || '<p class="cms-empty-hint">No items yet — click "New" to add one.</p>'}`;
}

// Selected Works, in selection-only mode, is just a picker over the Blog
// Posts list: toggling "Show" flips the same `published` flag the homepage
// already filters on — no independent add/edit/delete here.
function renderWorkSelectionList(persona, cfg, list) {
  const listTitle = typeof cfg.listTitle === "function" ? cfg.listTitle(persona) : cfg.listTitle;

  const rows = list
    .map(
      (item, i) => `
      <div class="cms-row-item">
        <div>
          <p class="cms-row-title">${escapeHtml(item.title)}</p>
          <p class="cms-row-meta">${escapeHtml(formatWorkMeta(item))}</p>
        </div>
        <div class="cms-row-actions">
          <label class="cms-checkbox-item"><input type="checkbox" ${item.published !== false ? "checked" : ""} onchange="updateWorkLikeField('${persona}', '${cfg.listField}', ${i}, 'published', this.checked)">Show</label>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="cms-list-header">
      <h2 class="cms-list-header-title">${escapeHtml(listTitle)}</h2>
    </div>
    <p class="cms-card-subtitle" style="margin:-8px 0 16px 0">Pulled from Blog Posts — toggle which ones show here on the homepage. Add or edit content under Blog Posts.</p>
    ${rows || '<p class="cms-empty-hint">No blog posts yet — add one under Blog Posts first.</p>'}`;
}

function renderWorkLikeEdit(persona, cfg, index, item) {
  const tagPills = (item.tags || [])
    .map(
      (t, ti) => `
      <span class="cms-pill">${escapeHtml(t)}<button type="button" onclick="removeWorkTag('${persona}', '${cfg.listField}', ${index}, ${ti})">&times;</button></span>`
    )
    .join("");

  return `
    <button class="cms-back-to-list" type="button" onclick="goBackToList()">${iconSvg(BACK_ICON, 15)}Back to list</button>
    <h2 class="cms-edit-title">${escapeHtml(cfg.editTitle)}</h2>

    <div class="cms-field">
      <label class="cms-label">Cover Image</label>
      <button class="cms-upload-btn" type="button" onclick="document.getElementById('cms-cover-file').click()">${iconSvg(UPLOAD_ICON)}Upload image</button>
      <input type="file" id="cms-cover-file" accept="image/*" style="display:none" onchange="handleCoverUpload(event, '${persona}', '${cfg.listField}', ${index})">
    </div>

    <div class="cms-field">
      <label class="cms-label">Title</label>
      <input class="cms-input" type="text" value="${escapeAttr(item.title)}" oninput="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'title', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Subtitle / Description</label>
      <input class="cms-input" type="text" value="${escapeAttr(item.description)}" oninput="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'description', this.value)">
    </div>

    <div class="cms-field-row">
      <div class="cms-field">
        <label class="cms-label">Year</label>
        <input class="cms-input" type="text" value="${escapeAttr(item.year)}" oninput="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'year', this.value)">
      </div>
      <div class="cms-field">
        <label class="cms-label">${escapeHtml(cfg.secondMetaLabel)}</label>
        <input class="cms-input" type="text" value="${escapeAttr(item.company)}" oninput="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'company', this.value)">
      </div>
    </div>

    <div class="cms-field">
      <label class="cms-label">Tags</label>
      <div class="cms-pill-list">${tagPills}</div>
      <div class="cms-add-row">
        <input class="cms-input" type="text" id="cms-tag-input-${index}" placeholder="Add tag..." onkeydown="if(event.key==='Enter'){event.preventDefault();addWorkTag('${persona}', '${cfg.listField}', ${index}, this.value); this.value='';}">
        <button class="cms-add-row-btn" type="button" onclick="const el=document.getElementById('cms-tag-input-${index}'); addWorkTag('${persona}', '${cfg.listField}', ${index}, el.value); el.value='';">${iconSvg(PLUS_ICON, 16)}</button>
      </div>
    </div>

    <div class="cms-field">
      <label class="cms-label">Content</label>
      ${renderRichTextToolbar(persona, cfg.listField, index)}
      <div class="cms-richtext-editor" id="cms-content-editor-${index}" contenteditable="true" oninput="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'content', this.innerHTML)">${item.content || ""}</div>
    </div>

    <div class="cms-checkbox-row">
      <label class="cms-checkbox-item"><input type="checkbox" ${item.featured ? "checked" : ""} onchange="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'featured', this.checked)">Featured</label>
      <label class="cms-checkbox-item"><input type="checkbox" ${item.published !== false ? "checked" : ""} onchange="updateWorkLikeField('${persona}', '${cfg.listField}', ${index}, 'published', this.checked)">Published</label>
    </div>

    <button class="cms-save-btn" type="button" onclick="showToast('Saved'); goBackToList();">${iconSvg(SAVE_ICON, 16)}Save</button>`;
}

function updateWorkLikeField(persona, listField, index, field, value) {
  const list = getPersonaList(persona, listField).slice();
  if (!list[index]) return;
  list[index] = Object.assign({}, list[index], { [field]: value });
  setPersonaList(persona, listField, list);
  showToast("Saved");
}

// ---- Rich text toolbar (Works / Posts body content) ----
// Uses document.execCommand — deprecated but still the only dependency-free
// way to drive a contenteditable region across browsers, and this content is
// only ever authored by the site owner herself in her own browser.

const RICHTEXT_HEADINGS = [
  { value: "P", label: "Paragraph" },
  { value: "H1", label: "Heading 1" },
  { value: "H2", label: "Heading 2" },
  { value: "H3", label: "Heading 3" },
];

function renderRichTextToolbar(persona, listField, index) {
  const options = RICHTEXT_HEADINGS.map((h) => `<option value="${h.value}">${h.label}</option>`).join("");
  return `
    <div class="cms-richtext-toolbar">
      <select class="cms-richtext-select" onchange="applyRichHeading('${persona}', '${listField}', ${index}, this.value)">${options}</select>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichCommand('${persona}', '${listField}', ${index}, 'bold')"><b>B</b></button>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichCommand('${persona}', '${listField}', ${index}, 'italic')"><i>I</i></button>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichCommand('${persona}', '${listField}', ${index}, 'underline')"><u>U</u></button>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichCommand('${persona}', '${listField}', ${index}, 'insertUnorderedList')">&bull; List</button>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichCommand('${persona}', '${listField}', ${index}, 'insertOrderedList')">1. List</button>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichLink('${persona}', '${listField}', ${index})">Link</button>
      <button type="button" class="cms-richtext-btn" onmousedown="event.preventDefault()" onclick="applyRichCommand('${persona}', '${listField}', ${index}, 'removeFormat')">Clear</button>
    </div>`;
}

function getRichEditor(index) {
  return document.getElementById("cms-content-editor-" + index);
}

function saveRichContent(persona, listField, index) {
  const editor = getRichEditor(index);
  if (!editor) return;
  updateWorkLikeField(persona, listField, index, "content", editor.innerHTML);
}

function applyRichCommand(persona, listField, index, command, value) {
  const editor = getRichEditor(index);
  if (!editor) return;
  editor.focus();
  document.execCommand(command, false, value || null);
  saveRichContent(persona, listField, index);
}

function applyRichHeading(persona, listField, index, tag) {
  const editor = getRichEditor(index);
  if (!editor) return;
  editor.focus();
  document.execCommand("formatBlock", false, "<" + tag + ">");
  saveRichContent(persona, listField, index);
}

function applyRichLink(persona, listField, index) {
  const editor = getRichEditor(index);
  if (!editor) return;
  const url = window.prompt("Link URL:", "https://");
  if (!url) return;
  editor.focus();
  document.execCommand("createLink", false, url);
  saveRichContent(persona, listField, index);
}

function addWorkTag(persona, listField, index, value) {
  const tag = (value || "").trim();
  if (!tag) return;
  const list = getPersonaList(persona, listField).slice();
  if (!list[index]) return;
  const tags = (list[index].tags || []).concat(tag);
  list[index] = Object.assign({}, list[index], { tags });
  setPersonaList(persona, listField, list);
  renderPanel();
  showToast("Saved");
}

function removeWorkTag(persona, listField, index, tagIndex) {
  const list = getPersonaList(persona, listField).slice();
  if (!list[index]) return;
  const tags = (list[index].tags || []).slice();
  tags.splice(tagIndex, 1);
  list[index] = Object.assign({}, list[index], { tags });
  setPersonaList(persona, listField, list);
  renderPanel();
  showToast("Saved");
}

function handleCoverUpload(event, persona, listField, index) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    updateWorkLikeField(persona, listField, index, "coverImage", reader.result);
    showToast("Image updated");
  };
  reader.readAsDataURL(file);
}

function addWorkLikeItem(persona, listField, label) {
  const list = getPersonaList(persona, listField).slice();
  list.push(newWorkLikeItem(label));
  setPersonaList(persona, listField, list);
  goToEdit(list.length - 1);
  showToast("Added");
}

function deleteWorkLikeItem(persona, listField, index) {
  const list = getPersonaList(persona, listField).slice();
  list.splice(index, 1);
  setPersonaList(persona, listField, list);
  renderPanel();
  showToast("Deleted");
}

// ---- Experience (Work + Education, unified) ----

function newExperienceItem() {
  return {
    id: makeId("exp"),
    type: "work",
    organization: "New organization",
    role: "",
    period: "",
    location: "",
    description: "",
    highlights: [],
  };
}

function renderExperiencePanel(persona) {
  const list = getPersonaList(persona, "experience");
  if (cmsView === "edit" && cmsEditIndex != null && list[cmsEditIndex]) {
    return renderExperienceEdit(persona, cmsEditIndex, list[cmsEditIndex]);
  }
  return renderExperienceList(persona, list);
}

function renderExperienceList(persona, list) {
  const rows = list
    .map(
      (e, i) => `
      <div class="cms-row-item">
        <div>
          <p class="cms-row-title">${escapeHtml(e.organization)}</p>
          <p class="cms-row-meta">${escapeHtml(e.role)}${e.role ? " &bull; " : ""}${escapeHtml(formatExpMeta(e))}</p>
        </div>
        <div class="cms-row-actions">
          <button class="cms-icon-btn" type="button" title="Edit" onclick="goToEdit(${i})">${iconSvg(PENCIL_ICON, 15)}</button>
          <button class="cms-icon-btn cms-icon-btn-danger" type="button" title="Delete" onclick="deleteExperience('${persona}', ${i})">${iconSvg(TRASH_ICON, 15)}</button>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="cms-list-header">
      <h2 class="cms-list-header-title">Experience</h2>
      <button class="cms-add-btn" type="button" onclick="addExperience('${persona}')">${iconSvg(PLUS_ICON, 14)}New</button>
    </div>
    ${rows || '<p class="cms-empty-hint">No items yet — click "New" to add one.</p>'}`;
}

function renderExperienceEdit(persona, index, e) {
  const highlightRows = (e.highlights || [])
    .map(
      (h, hi) => `
      <div class="cms-highlight-row">
        <span>${escapeHtml(h)}</span>
        <button class="cms-row-remove" type="button" onclick="removeHighlight('${persona}', ${index}, ${hi})">&times;</button>
      </div>`
    )
    .join("");

  return `
    <button class="cms-back-to-list" type="button" onclick="goBackToList()">${iconSvg(BACK_ICON, 15)}Back to list</button>
    <h2 class="cms-edit-title">Edit Experience</h2>

    <div class="cms-field">
      <label class="cms-label">Type</label>
      <select class="cms-input" onchange="updateExperienceField('${persona}', ${index}, 'type', this.value)">
        <option value="work" ${e.type === "work" ? "selected" : ""}>Work</option>
        <option value="education" ${e.type === "education" ? "selected" : ""}>Education</option>
      </select>
    </div>

    <div class="cms-field">
      <label class="cms-label">Organization</label>
      <input class="cms-input" type="text" value="${escapeAttr(e.organization)}" oninput="updateExperienceField('${persona}', ${index}, 'organization', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Role / Degree</label>
      <input class="cms-input" type="text" value="${escapeAttr(e.role)}" oninput="updateExperienceField('${persona}', ${index}, 'role', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Period</label>
      <input class="cms-input" type="text" placeholder="2023 - Present" value="${escapeAttr(e.period)}" oninput="updateExperienceField('${persona}', ${index}, 'period', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Location</label>
      <input class="cms-input" type="text" placeholder="Full-time &bull; Singapore" value="${escapeAttr(e.location)}" oninput="updateExperienceField('${persona}', ${index}, 'location', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Description</label>
      <textarea class="cms-textarea" rows="3" oninput="updateExperienceField('${persona}', ${index}, 'description', this.value)">${escapeHtml(e.description)}</textarea>
    </div>

    <div class="cms-field">
      <label class="cms-label">Highlights / Roles</label>
      <div class="cms-highlight-list">${highlightRows}</div>
      <div class="cms-add-row">
        <input class="cms-input" type="text" id="cms-highlight-input-${index}" placeholder="Add highlight..." onkeydown="if(event.key==='Enter'){event.preventDefault();addHighlight('${persona}', ${index}, this.value); this.value='';}">
        <button class="cms-add-row-btn" type="button" onclick="const el=document.getElementById('cms-highlight-input-${index}'); addHighlight('${persona}', ${index}, el.value); el.value='';">${iconSvg(PLUS_ICON, 16)}</button>
      </div>
    </div>

    <button class="cms-save-btn" type="button" onclick="showToast('Saved'); goBackToList();">${iconSvg(SAVE_ICON, 16)}Save Experience</button>`;
}

function updateExperienceField(persona, index, field, value) {
  const list = getPersonaList(persona, "experience").slice();
  if (!list[index]) return;
  list[index] = Object.assign({}, list[index], { [field]: value });
  setPersonaList(persona, "experience", list);
  showToast("Saved");
}

function addHighlight(persona, index, value) {
  const text = (value || "").trim();
  if (!text) return;
  const list = getPersonaList(persona, "experience").slice();
  if (!list[index]) return;
  const highlights = (list[index].highlights || []).concat(text);
  list[index] = Object.assign({}, list[index], { highlights });
  setPersonaList(persona, "experience", list);
  renderPanel();
  showToast("Saved");
}

function removeHighlight(persona, index, highlightIndex) {
  const list = getPersonaList(persona, "experience").slice();
  if (!list[index]) return;
  const highlights = (list[index].highlights || []).slice();
  highlights.splice(highlightIndex, 1);
  list[index] = Object.assign({}, list[index], { highlights });
  setPersonaList(persona, "experience", list);
  renderPanel();
  showToast("Saved");
}

function addExperience(persona) {
  const list = getPersonaList(persona, "experience").slice();
  list.push(newExperienceItem());
  setPersonaList(persona, "experience", list);
  goToEdit(list.length - 1);
  showToast("Added");
}

function deleteExperience(persona, index) {
  const list = getPersonaList(persona, "experience").slice();
  list.splice(index, 1);
  setPersonaList(persona, "experience", list);
  renderPanel();
  showToast("Deleted");
}

// ---- Testimonials ----

function newTestimonialItem() {
  return { id: makeId("testi"), quote: "", name: "New person", role: "" };
}

function renderTestimonialsPanel(persona) {
  const list = getPersonaList(persona, "testimonials");
  if (cmsView === "edit" && cmsEditIndex != null && list[cmsEditIndex]) {
    return renderTestimonialEdit(persona, cmsEditIndex, list[cmsEditIndex]);
  }
  return renderTestimonialsList(persona, list);
}

function renderTestimonialsList(persona, list) {
  const rows = list
    .map(
      (t, i) => `
      <div class="cms-row-item">
        <div>
          <p class="cms-row-title">${escapeHtml(t.name)}</p>
          <p class="cms-row-meta">${escapeHtml(t.role)}</p>
        </div>
        <div class="cms-row-actions">
          <button class="cms-icon-btn" type="button" title="Edit" onclick="goToEdit(${i})">${iconSvg(PENCIL_ICON, 15)}</button>
          <button class="cms-icon-btn cms-icon-btn-danger" type="button" title="Delete" onclick="deleteTestimonial('${persona}', ${i})">${iconSvg(TRASH_ICON, 15)}</button>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="cms-list-header">
      <h2 class="cms-list-header-title">Testimonials</h2>
      <button class="cms-add-btn" type="button" onclick="addTestimonial('${persona}')">${iconSvg(PLUS_ICON, 14)}New</button>
    </div>
    ${rows || '<p class="cms-empty-hint">No items yet — click "New" to add one.</p>'}`;
}

function renderTestimonialEdit(persona, index, t) {
  return `
    <button class="cms-back-to-list" type="button" onclick="goBackToList()">${iconSvg(BACK_ICON, 15)}Back to list</button>
    <h2 class="cms-edit-title">Edit Testimonial</h2>

    <div class="cms-field">
      <label class="cms-label">Quote</label>
      <textarea class="cms-textarea" rows="3" oninput="updateTestimonialField('${persona}', ${index}, 'quote', this.value)">${escapeHtml(t.quote)}</textarea>
    </div>

    <div class="cms-field">
      <label class="cms-label">Name</label>
      <input class="cms-input" type="text" value="${escapeAttr(t.name)}" oninput="updateTestimonialField('${persona}', ${index}, 'name', this.value)">
    </div>

    <div class="cms-field">
      <label class="cms-label">Role</label>
      <input class="cms-input" type="text" placeholder="Engineering Lead @ Company" value="${escapeAttr(t.role)}" oninput="updateTestimonialField('${persona}', ${index}, 'role', this.value)">
    </div>

    <button class="cms-save-btn" type="button" onclick="showToast('Saved'); goBackToList();">${iconSvg(SAVE_ICON, 16)}Save</button>`;
}

function updateTestimonialField(persona, index, field, value) {
  const list = getPersonaList(persona, "testimonials").slice();
  if (!list[index]) return;
  list[index] = Object.assign({}, list[index], { [field]: value });
  setPersonaList(persona, "testimonials", list);
  showToast("Saved");
}

function addTestimonial(persona) {
  const list = getPersonaList(persona, "testimonials").slice();
  list.push(newTestimonialItem());
  setPersonaList(persona, "testimonials", list);
  goToEdit(list.length - 1);
  showToast("Added");
}

function deleteTestimonial(persona, index) {
  const list = getPersonaList(persona, "testimonials").slice();
  list.splice(index, 1);
  setPersonaList(persona, "testimonials", list);
  renderPanel();
  showToast("Deleted");
}

// ---- Countries Visited (Traveller) ----

function renderCountriesPanel(persona) {
  const list = getPersonaList(persona, "countriesVisited");

  const rows = list
    .map(
      (c, i) => `
      <div class="cms-row-item">
        <div class="cms-country-fields">
          <input class="cms-input cms-flag-input" type="text" maxlength="4" value="${escapeAttr(c.flag)}" oninput="updateCountryField('${persona}', ${i}, 'flag', this.value)">
          <input class="cms-input cms-country-name-input" type="text" value="${escapeAttr(c.name)}" oninput="updateCountryField('${persona}', ${i}, 'name', this.value)">
        </div>
        <div class="cms-row-actions">
          <button class="cms-icon-btn cms-icon-btn-danger" type="button" title="Delete" onclick="deleteCountry('${persona}', ${i})">${iconSvg(TRASH_ICON, 15)}</button>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="cms-list-header">
      <h2 class="cms-list-header-title">Countries Visited</h2>
      <button class="cms-add-btn" type="button" onclick="addCountry('${persona}')">${iconSvg(PLUS_ICON, 14)}New</button>
    </div>
    ${rows || '<p class="cms-empty-hint">No countries yet — click "New" to add one.</p>'}`;
}

function updateCountryField(persona, index, field, value) {
  const list = getPersonaList(persona, "countriesVisited").slice();
  if (!list[index]) return;
  list[index] = Object.assign({}, list[index], { [field]: value });
  setPersonaList(persona, "countriesVisited", list);
  showToast("Saved");
}

function addCountry(persona) {
  const list = getPersonaList(persona, "countriesVisited").slice();
  list.push({ flag: "🏳️", name: "New country" });
  setPersonaList(persona, "countriesVisited", list);
  renderPanel();
  showToast("Added");
}

function deleteCountry(persona, index) {
  const list = getPersonaList(persona, "countriesVisited").slice();
  list.splice(index, 1);
  setPersonaList(persona, "countriesVisited", list);
  renderPanel();
  showToast("Deleted");
}

// ---- Socials ----

function renderSocialsPanel(persona) {
  const list = getPersonaList(persona, "socials");

  const rows = list
    .map((s, i) => {
      const options = Object.keys(SOCIAL_PLATFORMS)
        .map(
          (key) =>
            `<option value="${key}" ${s.platform === key ? "selected" : ""}>${escapeHtml(SOCIAL_PLATFORMS[key].label)}</option>`
        )
        .join("");
      return `
      <div class="cms-row-item">
        <div class="cms-social-fields">
          <select class="cms-input cms-social-select" onchange="updateSocialField('${persona}', ${i}, 'platform', this.value)">${options}</select>
          <input class="cms-input cms-social-url-input" type="text" placeholder="https://..." value="${escapeAttr(s.url)}" oninput="updateSocialField('${persona}', ${i}, 'url', this.value)">
        </div>
        <div class="cms-row-actions">
          <button class="cms-icon-btn cms-icon-btn-danger" type="button" title="Delete" onclick="deleteSocial('${persona}', ${i})">${iconSvg(TRASH_ICON, 15)}</button>
        </div>
      </div>`;
    })
    .join("");

  return `
    <div class="cms-list-header">
      <h2 class="cms-list-header-title">Socials</h2>
      <button class="cms-add-btn" type="button" onclick="addSocial('${persona}')">${iconSvg(PLUS_ICON, 14)}New</button>
    </div>
    ${rows || '<p class="cms-empty-hint">No social links yet — click "New" to add one.</p>'}`;
}

function updateSocialField(persona, index, field, value) {
  const list = getPersonaList(persona, "socials").slice();
  if (!list[index]) return;
  list[index] = Object.assign({}, list[index], { [field]: value });
  setPersonaList(persona, "socials", list);
  showToast("Saved");
}

function addSocial(persona) {
  const list = getPersonaList(persona, "socials").slice();
  list.push({ platform: "website", url: "" });
  setPersonaList(persona, "socials", list);
  renderPanel();
  showToast("Added");
}

function deleteSocial(persona, index) {
  const list = getPersonaList(persona, "socials").slice();
  list.splice(index, 1);
  setPersonaList(persona, "socials", list);
  renderPanel();
  showToast("Deleted");
}

// ---- TikTok Videos (Mother) ----

function renderTikTokPanel(persona) {
  const data = getPersonaData(persona);
  const list = getPersonaList(persona, "tiktokVideos");

  const rows = list
    .map(
      (v, i) => `
      <div class="cms-row-item">
        <input class="cms-input cms-tiktok-url-input" type="text" placeholder="https://www.tiktok.com/@handle/video/..." value="${escapeAttr(v.url)}" oninput="updateTikTokField('${persona}', ${i}, this.value)">
        <div class="cms-row-actions">
          <button class="cms-icon-btn cms-icon-btn-danger" type="button" title="Delete" onclick="deleteTikTokVideo('${persona}', ${i})">${iconSvg(TRASH_ICON, 15)}</button>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="cms-field">
      <label class="cms-label">TikTok Handle</label>
      <input class="cms-input" type="text" placeholder="yourhandle" value="${escapeAttr(data.tiktokHandle)}" oninput="updatePersonaField('${persona}', 'tiktokHandle', this.value)">
    </div>
    <div class="cms-list-header" style="margin-top:24px">
      <h2 class="cms-list-header-title">Featured Videos</h2>
      <button class="cms-add-btn" type="button" onclick="addTikTokVideo('${persona}')">${iconSvg(PLUS_ICON, 14)}New</button>
    </div>
    <p class="cms-card-subtitle" style="margin:-8px 0 16px 0">Only the first 3 show on the homepage.</p>
    ${rows || '<p class="cms-empty-hint">No videos yet — click "New" to add one.</p>'}`;
}

function updateTikTokField(persona, index, value) {
  const list = getPersonaList(persona, "tiktokVideos").slice();
  if (!list[index]) return;
  list[index] = Object.assign({}, list[index], { url: value });
  setPersonaList(persona, "tiktokVideos", list);
  showToast("Saved");
}

function addTikTokVideo(persona) {
  const list = getPersonaList(persona, "tiktokVideos").slice();
  list.push({ url: "" });
  setPersonaList(persona, "tiktokVideos", list);
  renderPanel();
  showToast("Added");
}

function deleteTikTokVideo(persona, index) {
  const list = getPersonaList(persona, "tiktokVideos").slice();
  list.splice(index, 1);
  setPersonaList(persona, "tiktokVideos", list);
  renderPanel();
  showToast("Deleted");
}

// ---- Init ----

document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  renderHeader();
  renderPanel();
});
