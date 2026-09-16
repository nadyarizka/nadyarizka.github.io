// About page renderer — matches base44 About page markup/behavior,
// including the quirk where Work Experience/Education only render for Designer.

function chevronSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px">
    <path d="m9 18 6-6-6-6"></path>
  </svg>`;
}

function renderWorkEducation(data) {
  const expList = data.experience || [];
  const workItems = expList.filter((e) => e.type === "work");
  const eduItems = expList.filter((e) => e.type === "education");
  if (!workItems.length && !eduItems.length) return "";

  const workRows = workItems
    .map(
      (e) => `
      <div class="exp-row">
        <div class="exp-avatar" style="margin-top:2px">${(e.organization || "?").charAt(0).toUpperCase()}</div>
        <div class="exp-body">
          <p class="exp-company">${e.organization}</p>
          <p class="exp-meta">${formatExpMeta(e)}</p>
          <p class="exp-desc">${e.description}</p>
          <ul class="exp-bullets">
            ${(e.highlights || []).map((b) => `<li>${chevronSvg()}<span>${b}</span></li>`).join("")}
          </ul>
        </div>
      </div>`
    )
    .join("");

  const eduRows = eduItems
    .map(
      (e) => `
      <div class="exp-row">
        <div class="exp-avatar" style="margin-top:2px">${(e.organization || "?").charAt(0).toUpperCase()}</div>
        <div class="exp-body">
          <p class="exp-company">${e.organization}</p>
          <p class="exp-meta">${formatExpMeta(e)}</p>
          <p class="exp-desc">${e.description}</p>
        </div>
      </div>`
    )
    .join("");

  return `
    ${
      workItems.length
        ? `<section class="about-section"><h2>💼 Work Experience</h2><div class="exp-list" style="gap:24px">${workRows}</div></section>`
        : ""
    }
    ${
      eduItems.length
        ? `<section class="about-section"><h2>🎓 Education</h2><div class="exp-list" style="gap:24px">${eduRows}</div></section>`
        : ""
    }`;
}

function renderAboutContent(persona) {
  const about = getAboutData();
  const data = getPersonaData(persona);
  const introHtml = about.intro.map((p) => `<p>${p}</p>`).join("");
  const personaText = about.personaText[persona];

  const content = `
    <button class="back-btn" type="button" onclick="goBack('${persona}')">&lsaquo; Back</button>
    <div>
      <h1 class="about-h1">About Me</h1>
      <div class="about-intro">
        <p class="about-hi">👋 Hi there!</p>
        ${introHtml}
        <div class="about-persona-text">${personaText}</div>
      </div>
      <div class="cv-links">
        <span>🔗 Download CV only</span>
        <span>🔗 Download CV + Past Works</span>
      </div>
      ${renderWorkEducation(data)}
      <section class="about-section">
        <h2 class="tight">Skills</h2>
        <div class="hr"></div>
        <div class="grid-2">${about.skills.map((s) => `<p>• ${s}</p>`).join("")}</div>
      </section>
      <section class="about-section">
        <h2 class="tight">Tools</h2>
        <div class="hr"></div>
        <div class="grid-2">${about.tools.map((t) => `<p>• ${t}</p>`).join("")}</div>
      </section>
    </div>`;

  document.getElementById("page-root").innerHTML = content;
}

function switchPersona(persona) {
  transitionToPersona(persona, () => renderAboutContent(persona), false);
}

function goBack(persona) {
  window.location.href = "index.html?persona=" + persona;
}

document.addEventListener("DOMContentLoaded", () => {
  const persona = getQueryPersona();
  document.getElementById("page-root").classList.add("page-narrow");
  initNav(persona, switchPersona);
  transitionToPersona(persona, () => renderAboutContent(persona), true);
});
