// Bridges the CMS's single in-memory working copy (SITE/ABOUT/SITE_SETTINGS
// from data.js, mutated directly by store.js's setters) to the live GitHub
// Pages site. There is no separate local draft/override layer — GitHub is
// the only place edits persist. Two jobs:
//
//   1. loadPublishedContent() — on every page (public + admin), fetch the
//      last-saved snapshot (data/content.json) and merge it into SITE/
//      ABOUT/SITE_SETTINGS *before* anything renders, so visitors (and a
//      freshly opened CMS) see real saved content, not just the hardcoded
//      defaults baked into data.js.
//
//   2. saveToGithub() — CMS-only. Snapshots the current in-memory state and
//      commits it to data/content.json. Called by cms.js's debounced
//      scheduleSave()/flushSave() — see cms.js for the "Saving… / Saved"
//      status flow that wraps this.

const PUBLISHED_CONTENT_PATH = "/data/content.json";

async function loadPublishedContent() {
  try {
    const res = await fetch(PUBLISHED_CONTENT_PATH + "?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return; // nothing saved yet (or running from file://) — data.js defaults stand
    const published = await res.json();
    if (!published || typeof published !== "object") return;

    if (published.site) {
      PERSONAS.forEach((persona) => {
        if (published.site[persona]) Object.assign(SITE[persona], published.site[persona]);
      });
    }
    if (published.about) Object.assign(ABOUT, published.about);
    if (published.siteSettings) Object.assign(SITE_SETTINGS, published.siteSettings);

    if (typeof applyStoredFavicon === "function") applyStoredFavicon();
  } catch (e) {
    // Offline, blocked, or malformed content.json — fall back to data.js defaults.
  }
}

// ---- File uploads ----
// Every image (and the resume) uploads straight to GitHub the moment it's
// picked in the CMS — see uploadFileDirectly. Nothing waits around as
// base64 anywhere. extractDataUris/substituteTokens below exist purely as a
// defense-in-depth sweep over the save snapshot (e.g. rich text pasted with
// an embedded image data: URI), not as the primary path.

const DATA_URI_RE = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([\s\S]*)$/;

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function extensionForMime(mime) {
  return MIME_EXTENSIONS[mime] || "bin";
}

function extractDataUris(node, found) {
  if (Array.isArray(node)) return node.map((item) => extractDataUris(item, found));
  if (node && typeof node === "object") {
    const out = {};
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) out[key] = extractDataUris(node[key], found);
    }
    return out;
  }
  if (typeof node === "string" && DATA_URI_RE.test(node)) {
    // U+E000 (Private Use Area) — printable, valid UTF-8, never appears in
    // real content, and doesn't make tools mistake this file for binary the
    // way a literal NULL byte would.
    const token = "ASSET" + found.length + "";
    found.push(node);
    return token;
  }
  return node;
}

function substituteTokens(node, pathByIndex) {
  if (Array.isArray(node)) return node.map((item) => substituteTokens(item, pathByIndex));
  if (node && typeof node === "object") {
    const out = {};
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) out[key] = substituteTokens(node[key], pathByIndex);
    }
    return out;
  }
  if (typeof node === "string") {
    const m = /^ASSET(\d+)$/.exec(node);
    if (m) return pathByIndex[Number(m[1])];
  }
  return node;
}

async function shortHashFromBase64(base64) {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (window.crypto && window.crypto.subtle) {
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 20);
  }
  // Fallback (very old browsers without SubtleCrypto): a fast non-crypto hash.
  let h = 5381;
  for (let i = 0; i < bytes.length; i++) h = ((h << 5) + h + bytes[i]) >>> 0;
  return h.toString(16);
}

// Uploads one already-prepared file (an image, the resume, anything) straight
// to the repo as its own small commit and returns the resulting path. This
// is the only way a file reaches the CMS now — there's no local fallback,
// which is the point: nothing sits as base64 in this browser waiting to be
// saved later. Returns null if there's no token (the CMS gates editing
// behind having one, so this is mainly a defensive check) or `dataUrl` isn't
// actually a data: URI.
async function uploadFileDirectly(dataUrl, message) {
  const token = getGithubToken();
  if (!token) return null;
  const match = DATA_URI_RE.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  const ext = extensionForMime(mime);
  const hash = await shortHashFromBase64(base64);
  const path = `assets/uploads/${hash}.${ext}`;
  await commitFilesToGitHub(token, [{ path, content: base64, encoding: "base64" }], message || "Upload file via CMS");
  return "/" + path;
}

function computeCurrentSnapshot() {
  const site = {};
  PERSONAS.forEach((persona) => {
    site[persona] = getPersonaData(persona);
  });
  return {
    site,
    about: getAboutData(),
    siteSettings: getSiteData(),
  };
}

// ---- The save flow ----
// One content.json commit reflecting the current in-memory state exactly —
// no merging, no pruning, nothing to reconcile with a separate draft, since
// there isn't one.
async function saveToGithub() {
  const token = getGithubToken();
  if (!token) throw new Error("Connect a GitHub token first.");

  const snapshot = computeCurrentSnapshot();

  // Defense-in-depth sweep — see the comment above extractDataUris. Normally
  // finds nothing, since every upload path already goes straight to GitHub.
  const foundAssets = [];
  const withTokens = extractDataUris(snapshot, foundAssets);
  const files = [];
  const pathByIndex = [];
  for (let i = 0; i < foundAssets.length; i++) {
    const match = DATA_URI_RE.exec(foundAssets[i]);
    if (!match) {
      pathByIndex[i] = foundAssets[i];
      continue;
    }
    try {
      const mime = match[1];
      const base64 = match[2];
      const ext = extensionForMime(mime);
      const hash = await shortHashFromBase64(base64);
      const path = `assets/uploads/${hash}.${ext}`;
      pathByIndex[i] = "/" + path;
      files.push({ path, content: base64, encoding: "base64" });
    } catch (e) {
      // Malformed/corrupted entry — leave it as-is rather than failing the
      // whole save over one bad field.
      pathByIndex[i] = foundAssets[i];
    }
  }

  const finalSnapshot = substituteTokens(withTokens, pathByIndex);
  finalSnapshot.savedAt = new Date().toISOString();

  files.push({
    path: "data/content.json",
    content: JSON.stringify(finalSnapshot, null, 2),
    encoding: "utf-8",
  });

  await commitFilesToGitHub(token, files, "Save content via CMS");

  // If the sweep caught anything, swap the in-memory state over to the
  // uploaded paths so the next save doesn't re-upload identical base64.
  if (foundAssets.length) {
    PERSONAS.forEach((persona) => Object.assign(SITE[persona], finalSnapshot.site[persona]));
    Object.assign(ABOUT, finalSnapshot.about);
    Object.assign(SITE_SETTINGS, finalSnapshot.siteSettings);
  }

  return finalSnapshot;
}
