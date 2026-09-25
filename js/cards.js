// Post card + navigation shared by the home page and the "all posts" list page.
// Both pages define a global `currentPersona` that goToPost() reads.

function renderPostCard(w) {
  const thumbStyle = w.coverImage
    ? ` style="background-image:url('${w.coverImage}');background-size:cover;background-position:center"`
    : "";
  return `
      <div class="work-card" onclick="goToPost('${w.id}')">
        <div class="work-thumb"${thumbStyle}></div>
        <div class="work-body">
          <h3 class="work-title">${w.title}</h3>
          <p class="work-meta">${formatWorkMeta(w)}</p>
          <div class="work-tags">
            ${(w.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
        </div>
      </div>`;
}

function goToPost(id) {
  window.location.href = "post.html?persona=" + currentPersona + "&id=" + encodeURIComponent(id);
}
