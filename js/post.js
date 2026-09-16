// Post detail page renderer — shows the full body of a work item when the
// CMS has one written, otherwise falls back to "No content yet." like the
// live site does for posts with no body.

function findWork(persona, id) {
  const data = getPersonaData(persona);
  return (data.works || []).find((w) => w.id === id);
}

function renderPost() {
  const params = new URLSearchParams(window.location.search);
  const persona = PERSONAS.includes(params.get("persona")) ? params.get("persona") : "designer";
  const id = params.get("id") || params.get("title") || "";

  const work = findWork(persona, id) || { title: id, year: "", company: "", tags: [], content: "" };

  const bodyHtml = work.content
    ? work.content
        .split(/\n{2,}/)
        .map((p) => `<p class="post-body-text">${p}</p>`)
        .join("")
    : `<p class="post-empty">No content yet.</p>`;

  const content = `
    <button class="back-btn" type="button" onclick="goBackHome('${persona}')">&larr; Back</button>
    <div class="post-tags">
      ${work.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
    </div>
    <h1 class="post-title">${work.title}</h1>
    <p class="post-meta">${formatWorkMeta(work)}</p>
    ${bodyHtml}`;

  initNav(persona, (p) => {
    window.location.href = "index.html?persona=" + p;
  });
  transitionToPersona(persona, () => {
    document.getElementById("page-root").innerHTML = content;
  }, true);
}

function goBackHome(persona) {
  window.location.href = "index.html?persona=" + persona;
}

document.addEventListener("DOMContentLoaded", renderPost);
