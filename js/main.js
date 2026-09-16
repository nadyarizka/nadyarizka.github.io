// Home page renderer — matches base44 Home page markup/behavior.

let currentPersona = "designer";

function downloadIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" x2="12" y1="15" y2="3"></line>
  </svg>`;
}

function renderMarquee(data) {
  // Always repeat the persona's unique unit-set enough times that the track
  // is comfortably wider than any viewport — otherwise a persona with few
  // unique units (e.g. Mother's single unit) doesn't fill the row, so the
  // marquee looks static/broken instead of rolling continuously.
  const images = data.marqueeImages || [];
  const units = images.length || data.marqueeUnits || 1;
  const ITEM_WIDTH = 360;
  const GAP = 16;
  const ITEM_FULL = ITEM_WIDTH + GAP;
  const MIN_TOTAL_ITEMS = 12;
  const SPEED_PX_PER_SEC = 51;

  const repeat = Math.ceil(MIN_TOTAL_ITEMS / units);
  const totalItems = repeat * units;
  const shiftPx = units * ITEM_FULL; // width of exactly one unit-set, so the loop is seamless
  const durationSec = (shiftPx / SPEED_PX_PER_SEC).toFixed(2);

  const items = [];
  for (let i = 0; i < totalItems; i++) {
    const img = images.length ? images[i % images.length] : null;
    const style = img ? ` style="background-image:url('${img}');background-size:cover;background-position:center"` : "";
    items.push(`<div class="marquee-item"><div class="marquee-item-inner"${style}></div></div>`);
  }

  const trackStyle = `--marquee-shift:-${shiftPx}px; --marquee-duration:${durationSec}s;`;
  return `<div class="marquee-outer"><div class="marquee-track" style="${trackStyle}">${items.join("")}</div></div>`;
}

function renderWorks(data) {
  const cards = data.works
    .filter((w) => w.published !== false)
    .map(
      (w) => `
      <div class="work-card" onclick="goToPost('${w.id}')">
        <div class="work-thumb"${w.coverImage ? ` style="background-image:url('${w.coverImage}');background-size:cover;background-position:center"` : ""}></div>
        <div class="work-body">
          <h3 class="work-title">${w.title}</h3>
          <p class="work-meta">${formatWorkMeta(w)}</p>
          <div class="work-tags">
            ${w.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
        </div>
      </div>`
    )
    .join("");

  const seeMoreHtml = data.worksSeeMore
    ? `<div class="works-see-more"><button class="btn-see-more" type="button" onclick="goToAbout()">See more</button></div>`
    : "";

  return `
    <section class="block">
      <h2 class="section-title" style="margin-bottom:16px">${data.worksHeading}</h2>
      <div class="works-list">${cards}</div>
      ${seeMoreHtml}
    </section>`;
}

function renderCountriesVisited(data) {
  if (!data.countriesVisited || !data.countriesVisited.length) return "";
  const chips = data.countriesVisited
    .map((c) => `<span class="country-chip">${c.flag} ${c.name}</span>`)
    .join("");

  return `
    <section class="block">
      <h2 class="section-title" style="margin-bottom:16px">Countries Visited</h2>
      <div class="country-chip-list">${chips}</div>
    </section>`;
}

function renderExperience(data) {
  if (!data.showExperience) return "";
  const items = (data.experience || []).filter((e) => e.type === "work").slice(0, 3);
  if (!items.length) return "";
  const rows = items
    .map(
      (e) => `
      <div class="exp-row">
        <div class="exp-avatar">${(e.organization || "?").charAt(0).toUpperCase()}</div>
        <div class="exp-body">
          <p class="exp-company">${e.organization}</p>
          <p class="exp-meta">${formatExpMeta(e)}</p>
          <p class="exp-title">${e.role}</p>
        </div>
      </div>`
    )
    .join("");

  return `
    <section class="block">
      <h2 class="section-title" style="margin-bottom:20px">Recent Experience</h2>
      <div class="exp-list">${rows}</div>
    </section>`;
}

function renderTestimonials(data) {
  if (!data.showTestimonials || !data.testimonials || !data.testimonials.length) return "";
  const cards = data.testimonials
    .map(
      (t) => `
      <div class="testi-card">
        <p class="testi-quote">"${t.quote}"</p>
        <div class="testi-person">
          <div class="testi-avatar">${(t.name || "?").charAt(0).toUpperCase()}</div>
          <div>
            <p class="testi-name">${t.name}</p>
            <p class="testi-role">${t.role}</p>
          </div>
        </div>
      </div>`
    )
    .join("");

  return `
    <section class="block" style="margin-bottom:0">
      <h2 class="testi-title">What they say?</h2>
      <div class="testi-grid">${cards}</div>
    </section>`;
}

function renderHomeContent(persona) {
  currentPersona = persona;
  const data = getPersonaData(persona);

  const resumeOnclick = data.resumeUrl
    ? ` onclick="window.open('${data.resumeUrl}', '_blank')"`
    : "";
  const statusPill = data.availableForWork
    ? `<span class="pill-available"><span class="dot-green"></span>Available for work</span>`
    : `<span class="pill-unavailable"><span class="dot-gray"></span>Currently not available</span>`;
  const actionsHtml = data.showResumeActions
    ? `
    <div class="profile-actions">
      <button class="btn-resume" type="button"${resumeOnclick}>${downloadIconSvg()}Download resume</button>
      ${statusPill}
    </div>`
    : "";

  const stickersHtml = (data.stickers || [])
    .map((s, i) => `<div class="sticker sticker-${i + 1}"><span>${s}</span></div>`)
    .join("");

  const content = `
    <div class="card">
      ${stickersHtml}
      <div class="profile">
        <div class="avatar-wrap">
          <div class="avatar"><img src="${data.avatar}" alt="Nadya"></div>
          <div class="avatar-badge">${data.badgeEmoji || ""}</div>
        </div>
        <p class="greeting">${data.greeting}</p>
        <p class="tagline">${data.tagline}</p>
        ${actionsHtml}
      </div>
      ${renderMarquee(data)}
      <section class="block first">
        <h2 class="section-title">${data.aboutHeading}</h2>
        <p class="about-text">${data.aboutText}</p>
        <button class="btn-see-more" type="button" onclick="goToAbout()">See more</button>
      </section>
      ${renderWorks(data)}
      ${renderCountriesVisited(data)}
      ${renderExperience(data)}
      ${renderTestimonials(data)}
    </div>`;

  document.getElementById("page-root").innerHTML = content;
}

function switchPersona(persona) {
  transitionToPersona(persona, () => renderHomeContent(persona), false);
}

function goToAbout() {
  window.location.href = "about.html?persona=" + currentPersona;
}

function goToPost(id) {
  window.location.href = "post.html?persona=" + currentPersona + "&id=" + encodeURIComponent(id);
}

document.addEventListener("DOMContentLoaded", () => {
  const persona = getQueryPersona();
  initNav(persona, switchPersona);
  transitionToPersona(persona, () => renderHomeContent(persona), true);
});
