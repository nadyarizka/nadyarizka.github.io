// Full post list, opened from the home page's "See more" buttons.
//   ?list=all  every published post that has content (Selected Works' See more)
//   ?list=blog just the Blog Posts section's posts

let currentPersona = "designer";

function getListKind() {
  return new URLSearchParams(window.location.search).get("list") === "blog" ? "blog" : "all";
}

function renderPostListContent(persona) {
  currentPersona = persona;
  const data = getPersonaData(persona);
  const kind = getListKind();
  const posts = kind === "blog" && usesWorkSelection(data) ? getBlogPosts(data) : getAllListedPosts(data);
  const heading = kind === "blog" ? "Blog Posts" : "All Posts";

  const body = posts.length
    ? `<div class="works-list">${posts.map(renderPostCard).join("")}</div>`
    : `<p class="post-empty">Nothing here yet.</p>`;

  document.getElementById("page-root").innerHTML = `
    <button class="back-btn" type="button" onclick="goBack('${persona}')">&lsaquo; Back</button>
    <h1 class="about-h1">${heading}</h1>
    ${body}`;
}

function switchPersona(persona) {
  transitionToPersona(persona, () => renderPostListContent(persona), false);
}

function goBack(persona) {
  window.location.href = "index.html?persona=" + persona;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPublishedContent();
  const persona = getQueryPersona();
  document.getElementById("page-root").classList.add("page-narrow", "is-wide");
  initNav(persona, switchPersona);
  transitionToPersona(persona, () => renderPostListContent(persona), true);
});
