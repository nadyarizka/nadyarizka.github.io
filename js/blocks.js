// Block content model shared by the public post page and the CMS editor.
// A post body is an array of blocks:
//   text:     { id, type: p|h1|h2|h3|ul|ol|quote|callout, html, icon? }
//   divider:  { id, type: "divider" }
//   image:    { id, type: "image", src, caption, widthPct }
//   columns:  { id, type: "columns", ratio, columns: [[block...], [block...]] }
// Text `html` is limited to a small inline whitelist (see sanitizeInline).

const BLOCK_TEXT_TYPES = ["p", "h1", "h2", "h3", "ul", "ol", "quote", "callout"];
const LAYOUT_WIDTHS = ["narrow", "wide", "full"];

// Downscales and re-encodes an uploaded image so a phone photo (routinely
// several MB straight off the camera) doesn't sit in localStorage as a
// multi-megabyte data: URI. Shared by every CMS upload button (avatar,
// favicon, marquee, cover image) and the block editor's own image blocks —
// see readImage() in editor.js, which now just delegates here.
//   opts.format: "png" keeps transparency (e.g. a favicon on any background)
//   at the cost of a larger file; default "jpeg" flattens onto white, which
//   is fine (and much smaller) for ordinary photos.
function readAndCompressImage(file, maxDimension, opts) {
  maxDimension = maxDimension || 1200;
  const keepAlpha = opts && opts.format === "png";
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml" || (file.type === "image/gif" && file.size < 400000)) {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!keepAlpha) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(keepAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

function makeBlockId() {
  return "b" + Math.random().toString(36).slice(2, 9);
}

function newBlock(type, props) {
  const b = { id: makeBlockId(), type };
  if (BLOCK_TEXT_TYPES.indexOf(type) !== -1) b.html = "";
  if (type === "callout") b.icon = "💡";
  if (type === "image") {
    b.src = "";
    b.caption = "";
    b.widthPct = 100;
  }
  if (type === "columns") {
    b.ratio = 50;
    b.columns = [[newBlock("p")], [newBlock("p")]];
  }
  return Object.assign(b, props || {});
}

function escapeBlockText(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeBlockAttr(s) {
  return escapeBlockText(s).replace(/"/g, "&quot;");
}

const INLINE_ALLOWED = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, CODE: 1, BR: 1, A: 1 };

// Keeps only simple inline formatting and safe links; everything else is
// unwrapped (its text stays) or dropped (script/style).
function sanitizeInline(html) {
  if (!html) return "";
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) {
        child.remove();
        return;
      }
      const tag = child.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") {
        child.remove();
        return;
      }
      walk(child);
      const href = tag === "A" ? child.getAttribute("href") || "" : "";
      const safeLink = /^(https?:|mailto:|\/|#)/i.test(href);
      if (!INLINE_ALLOWED[tag] || (tag === "A" && !safeLink)) {
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        child.remove();
        return;
      }
      Array.from(child.attributes).forEach((a) => child.removeAttribute(a.name));
      if (tag === "A") {
        child.setAttribute("href", href);
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener");
      }
    });
  };
  walk(tpl.content);

  const out = tpl.innerHTML;
  return out === "<br>" ? "" : out;
}

// Best-effort import of the older rich-text HTML (or plain paragraphs) so
// posts written before the block editor keep their content.
function htmlToBlocks(html) {
  if (!html || !String(html).trim()) return [];
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return String(html)
      .split(/\n{2,}/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => newBlock("p", { html: escapeBlockText(t).replace(/\n/g, "<br>") }));
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const out = [];
  Array.from(doc.body.childNodes).forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.textContent.trim();
      if (t) out.push(newBlock("p", { html: escapeBlockText(t) }));
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName;
    if (/^H[1-3]$/.test(tag)) {
      out.push(newBlock(tag.toLowerCase(), { html: sanitizeInline(n.innerHTML) }));
    } else if (tag === "UL" || tag === "OL") {
      Array.from(n.children).forEach((li) =>
        out.push(newBlock(tag.toLowerCase(), { html: sanitizeInline(li.innerHTML) }))
      );
    } else if (tag === "BLOCKQUOTE") {
      out.push(newBlock("quote", { html: sanitizeInline(n.innerHTML) }));
    } else if (tag === "HR") {
      out.push(newBlock("divider"));
    } else if (tag === "IMG") {
      out.push(newBlock("image", { src: n.getAttribute("src") || "" }));
    } else {
      out.push(newBlock("p", { html: sanitizeInline(n.innerHTML) }));
    }
  });
  return out;
}

function getPostBlocks(item) {
  if (!item) return [];
  if (Array.isArray(item.blocks)) return item.blocks;
  return htmlToBlocks(item.content);
}

function blocksHaveContent(blocks) {
  return (blocks || []).some((b) => {
    if (b.type === "columns") return (b.columns || []).some((c) => blocksHaveContent(c));
    if (b.type === "divider") return true;
    if (b.type === "image") return !!b.src;
    return !!(b.html && b.html.replace(/<br>/g, "").trim());
  });
}

function blockToHtml(b) {
  const inner = sanitizeInline(b.html || "");
  switch (b.type) {
    case "h1":
    case "h2":
    case "h3":
      return `<${b.type}>${inner}</${b.type}>`;
    case "quote":
      return `<blockquote>${inner}</blockquote>`;
    case "callout":
      return `<div class="pb-callout"><span class="pb-callout-icon">${escapeBlockText(b.icon || "💡")}</span><div class="pb-callout-body">${inner}</div></div>`;
    case "divider":
      return "<hr>";
    case "image": {
      if (!b.src) return "";
      const width = Math.max(10, Math.min(100, Number(b.widthPct) || 100));
      const caption = b.caption ? `<figcaption>${escapeBlockText(b.caption)}</figcaption>` : "";
      return `<figure class="pb-image" style="width:${width}%"><img src="${escapeBlockAttr(b.src)}" alt="${escapeBlockAttr(b.caption || "")}" loading="lazy">${caption}</figure>`;
    }
    case "columns": {
      const ratio = Math.max(15, Math.min(85, Number(b.ratio) || 50));
      const cols = (b.columns || []).map((c) => `<div class="pb-col">${blocksToHtml(c)}</div>`).join("");
      return `<div class="pb-columns" style="grid-template-columns:${ratio}fr ${100 - ratio}fr">${cols}</div>`;
    }
    default:
      return inner ? `<p>${inner}</p>` : "<p>&nbsp;</p>";
  }
}

function blocksToHtml(blocks) {
  const list = (blocks || []).slice();
  while (list.length) {
    const last = list[list.length - 1];
    if (BLOCK_TEXT_TYPES.indexOf(last.type) !== -1 && !(last.html || "").trim()) list.pop();
    else break;
  }

  let out = "";
  let i = 0;
  while (i < list.length) {
    const b = list[i];
    if (b.type === "ul" || b.type === "ol") {
      const tag = b.type;
      let items = "";
      while (i < list.length && list[i].type === tag) {
        items += `<li>${sanitizeInline(list[i].html || "")}</li>`;
        i++;
      }
      out += `<${tag}>${items}</${tag}>`;
      continue;
    }
    out += blockToHtml(b);
    i++;
  }
  return out;
}
