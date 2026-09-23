// Notion-style block editor for Works / Blog Posts (CMS only).
// Blocks are described in blocks.js. Everything here is dependency-free:
// contenteditable text blocks, a "/" menu, drag handles, image drag-and-drop
// (resized client-side so they fit in browser storage), and a two-column
// layout with a draggable divider.

(function () {
  const TEXT = BLOCK_TEXT_TYPES;
  const KNOWN = TEXT.concat(["divider", "image", "columns"]);

  const MENU_ITEMS = [
    { type: "p", label: "Text", hint: "Just start writing", icon: "Aa", keys: "text paragraph plain" },
    { type: "h1", label: "Heading 1", hint: "Big section heading", icon: "H1", keys: "heading title h1" },
    { type: "h2", label: "Heading 2", hint: "Medium section heading", icon: "H2", keys: "heading subtitle h2" },
    { type: "h3", label: "Heading 3", hint: "Small section heading", icon: "H3", keys: "heading h3" },
    { type: "ul", label: "Bulleted list", hint: "A simple bulleted list", icon: "•", keys: "bullet unordered list ul" },
    { type: "ol", label: "Numbered list", hint: "A list with numbering", icon: "1.", keys: "number ordered list ol" },
    { type: "quote", label: "Quote", hint: "Capture a quote", icon: "❝", keys: "quote blockquote" },
    { type: "callout", label: "Callout", hint: "Make writing stand out", icon: "💡", keys: "callout note highlight" },
    { type: "divider", label: "Divider", hint: "Visually divide sections", icon: "—", keys: "divider line hr separator" },
    { type: "image", label: "Image", hint: "Upload or drag one in", icon: "🖼", keys: "image picture photo upload" },
    { type: "columns", label: "2 columns", hint: "Side-by-side layout", icon: "▥", keys: "columns column layout two side" },
  ];

  const PLACEHOLDER = {
    p: "Type '/' for commands",
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    ul: "List item",
    ol: "List item",
    quote: "Quote",
    callout: "Write a callout",
  };

  const WIDTH_LABELS = { narrow: "Narrow", wide: "Wide", full: "Full" };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function closestEl(node, selector) {
    const e = node && (node.nodeType === 1 ? node : node.parentElement);
    return e && e.closest ? e.closest(selector) : null;
  }

  function textOf(html) {
    const d = document.createElement("div");
    d.innerHTML = html || "";
    return d.textContent;
  }

  function reId(b) {
    b.id = makeBlockId();
    if (b.columns) b.columns.forEach((col) => col.forEach(reId));
  }

  function cloneBlock(b) {
    const c = JSON.parse(JSON.stringify(b));
    reId(c);
    return c;
  }

  // Downscale/re-encode lives in blocks.js now, shared with the CMS's other
  // upload buttons (avatar, favicon, marquee, cover image) — see there.
  function readImage(file) {
    return readAndCompressImage(file);
  }

  function caretAtStart(t) {
    const s = getSelection();
    if (!s.rangeCount || !s.isCollapsed || !t.contains(s.anchorNode)) return false;
    const r = document.createRange();
    r.selectNodeContents(t);
    r.setEnd(s.anchorNode, s.anchorOffset);
    return r.toString().length === 0;
  }

  function caretAtEnd(t) {
    const s = getSelection();
    if (!s.rangeCount || !s.isCollapsed || !t.contains(s.anchorNode)) return false;
    const r = document.createRange();
    r.selectNodeContents(t);
    r.setStart(s.anchorNode, s.anchorOffset);
    return r.toString().length === 0;
  }

  function setCaret(t, at) {
    const r = document.createRange();
    if (typeof at === "number") {
      const walker = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
      let remaining = at;
      let node = null;
      let placed = false;
      while ((node = walker.nextNode())) {
        if (remaining <= node.length) {
          r.setStart(node, remaining);
          r.collapse(true);
          placed = true;
          break;
        }
        remaining -= node.length;
      }
      if (!placed) {
        r.selectNodeContents(t);
        r.collapse(false);
      }
    } else {
      r.selectNodeContents(t);
      r.collapse(at === "start");
    }
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }

  function mount(root, options) {
    const ac = new AbortController();
    const signal = ac.signal;

    const state = {
      blocks: JSON.parse(JSON.stringify(options.blocks || [])),
      layoutWidth: LAYOUT_WIDTHS.indexOf(options.layoutWidth) !== -1 ? options.layoutWidth : "narrow",
    };

    let timer = null;
    let dragId = null;
    let dropState = null;
    let menu = null;
    let pop = null;

    function repair(arr) {
      arr.forEach((b) => {
        if (!b.id) b.id = makeBlockId();
        if (KNOWN.indexOf(b.type) === -1) b.type = "p";
        if (TEXT.indexOf(b.type) !== -1 && typeof b.html !== "string") b.html = "";
        if (b.type === "columns") {
          if (!Array.isArray(b.columns) || b.columns.length < 2) {
            b.columns = [[newBlock("p")], [newBlock("p")]];
          }
          b.columns = b.columns.slice(0, 2);
          b.ratio = Math.max(20, Math.min(80, Number(b.ratio) || 50));
          b.columns.forEach(repair);
        }
      });
    }
    repair(state.blocks);

    // ---- Shell ----

    root.replaceChildren();
    root.classList.add("be-root");

    const bar = el("div", "be-bar");
    const barLeft = el("div", "be-bar-left");
    barLeft.appendChild(el("span", "be-bar-label", "Page width"));
    const widthGroup = el("div", "be-width-group");
    LAYOUT_WIDTHS.forEach((w) => {
      const b = el("button", "be-width-btn", WIDTH_LABELS[w]);
      b.type = "button";
      b.dataset.w = w;
      b.addEventListener("click", () => {
        state.layoutWidth = w;
        paintWidth();
        notify();
      });
      widthGroup.appendChild(b);
    });
    barLeft.appendChild(widthGroup);
    const usage = el("span", "be-usage");
    bar.append(barLeft, usage);

    const scroller = el("div", "be-scroll");
    const surface = el("div", "be-surface");
    const tail = el("div", "be-tail");
    const dropLine = el("div", "be-drop-line");
    scroller.appendChild(surface);
    const hint = el(
      "p",
      "be-hint",
      "Type “/” for blocks · drag images in from your computer · drag ⋮⋮ to rearrange · drop a block on the left or right edge of another to make columns"
    );
    root.append(bar, scroller, hint);

    const float = el("div", "be-float");
    float.style.display = "none";
    document.body.appendChild(float);

    // ---- Tree helpers ----

    function find(id, arr, parent, colIndex) {
      arr = arr || state.blocks;
      for (let i = 0; i < arr.length; i++) {
        const b = arr[i];
        if (b.id === id) return { arr, index: i, block: b, parent: parent || null, colIndex: colIndex == null ? -1 : colIndex };
        if (b.type === "columns") {
          for (let c = 0; c < b.columns.length; c++) {
            const r = find(id, b.columns[c], b, c);
            if (r) return r;
          }
        }
      }
      return null;
    }

    function containsId(b, id) {
      if (b.id === id) return true;
      return (b.columns || []).some((col) => col.some((x) => containsId(x, id)));
    }

    function normalize(arr) {
      const top = !arr;
      arr = arr || state.blocks;
      for (let i = 0; i < arr.length; i++) {
        const b = arr[i];
        if (b.type !== "columns") continue;
        b.columns = b.columns.filter((c) => c.length);
        if (b.columns.length === 0) {
          arr.splice(i, 1);
          i--;
        } else if (b.columns.length === 1) {
          arr.splice.apply(arr, [i, 1].concat(b.columns[0]));
          i--;
        } else {
          b.columns.forEach((c) => normalize(c));
        }
      }
      if (top) {
        const last = arr[arr.length - 1];
        if (!last || TEXT.indexOf(last.type) === -1) arr.push(newBlock("p"));
      }
    }

    // ---- Persistence ----

    function updateUsage() {
      let used = 0;
      try {
        used = (localStorage.getItem(STORE_KEY) || "").length;
      } catch (e) {}
      const mb = used / 1048576;
      usage.textContent = "Browser storage: " + mb.toFixed(1) + " MB of ~5 MB";
      usage.classList.toggle("warn", mb > 3.8);
    }

    function flush() {
      if (timer == null) return;
      clearTimeout(timer);
      timer = null;
      if (options.onChange) {
        options.onChange({
          blocks: JSON.parse(JSON.stringify(state.blocks)),
          layoutWidth: state.layoutWidth,
        });
      }
      updateUsage();
    }

    function notify() {
      clearTimeout(timer);
      timer = setTimeout(flush, 500);
    }

    // ---- Rendering ----

    function paintWidth() {
      surface.className = "be-surface be-w-" + state.layoutWidth;
      widthGroup.querySelectorAll(".be-width-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.w === state.layoutWidth);
      });
    }

    function render(focus) {
      closeMenu();
      closePop();
      hideIndicator();
      normalize();
      surface.replaceChildren();
      surface.appendChild(buildList(state.blocks));
      surface.appendChild(tail);
      surface.appendChild(dropLine);
      paintWidth();
      if (focus) focusBlock(focus.id, focus.at);
    }

    function buildList(arr) {
      const frag = document.createDocumentFragment();
      let n = 0;
      arr.forEach((b) => {
        n = b.type === "ol" ? n + 1 : 0;
        frag.appendChild(buildBlock(b, n));
      });
      return frag;
    }

    function buildBlock(b, num) {
      const w = el("div", "be-block be-t-" + b.type);
      w.dataset.id = b.id;
      w.appendChild(buildGutter(b));
      const body = el("div", "be-body");
      if (TEXT.indexOf(b.type) !== -1) body.appendChild(buildText(b, num));
      else if (b.type === "divider") body.appendChild(el("hr", "be-hr"));
      else if (b.type === "image") body.appendChild(buildImage(b));
      else if (b.type === "columns") body.appendChild(buildColumns(b));
      w.appendChild(body);
      return w;
    }

    function buildGutter(b) {
      const g = el("div", "be-gutter");
      const add = el("div", "be-gbtn", "+");
      add.title = "Add a block below";
      add.addEventListener("mousedown", (e) => e.preventDefault());
      add.addEventListener("click", () => {
        const f = find(b.id);
        if (!f) return;
        const p = newBlock("p");
        f.arr.splice(f.index + 1, 0, p);
        render({ id: p.id, at: "start" });
        openMenu(p.id, "");
        notify();
      });
      const handle = el("div", "be-gbtn be-drag", "⋮⋮");
      handle.title = "Drag to move · click for options";
      handle.draggable = true;
      handle.addEventListener("dragstart", (e) => {
        dragId = b.id;
        e.dataTransfer.setData("text/plain", "be-block");
        e.dataTransfer.effectAllowed = "move";
        const wrap = handle.closest(".be-block");
        try {
          e.dataTransfer.setDragImage(wrap, 0, 0);
        } catch (err) {}
        wrap.classList.add("be-dragging");
      });
      handle.addEventListener("dragend", () => {
        dragId = null;
        dropState = null;
        hideIndicator();
        surface.querySelectorAll(".be-dragging").forEach((n) => n.classList.remove("be-dragging"));
      });
      handle.addEventListener("click", () => openPop(b.id, handle));
      g.append(add, handle);
      return g;
    }

    function buildText(b, num) {
      const row = el("div", "be-row");
      if (b.type === "ul") row.appendChild(el("span", "be-marker", "•"));
      if (b.type === "ol") row.appendChild(el("span", "be-marker", num + "."));
      if (b.type === "callout") {
        const icon = el("button", "be-callout-icon", b.icon || "💡");
        icon.type = "button";
        icon.title = "Change icon";
        icon.addEventListener("click", () => {
          const v = window.prompt("Emoji for this callout", b.icon || "💡");
          if (v && v.trim()) {
            b.icon = v.trim();
            render();
            notify();
          }
        });
        row.appendChild(icon);
      }
      const t = el("div", "be-text");
      t.contentEditable = "true";
      t.dataset.placeholder = PLACEHOLDER[b.type] || "";
      t.innerHTML = sanitizeInline(b.html || "");
      t.addEventListener("input", () => onTextInput(b.id, t));
      t.addEventListener("keydown", (e) => onTextKeydown(e, b.id, t));
      t.addEventListener("paste", (e) => onPaste(e, b.id));
      row.appendChild(t);
      return row;
    }

    function buildImage(b) {
      const fig = el("div", "be-image");
      if (!b.src) {
        const empty = el("button", "be-image-empty", "🖼  Drag an image here, or click to upload");
        empty.type = "button";
        empty.addEventListener("click", () => pickImageFor(b.id));
        fig.appendChild(empty);
        return fig;
      }

      const frame = el("div", "be-image-frame");
      frame.style.width = (b.widthPct || 100) + "%";
      const img = document.createElement("img");
      img.src = b.src;
      img.alt = "";
      img.draggable = false;

      const cap = el("div", "be-caption");
      cap.contentEditable = "true";
      cap.dataset.placeholder = "Add a caption";
      cap.textContent = b.caption || "";
      cap.addEventListener("input", () => {
        b.caption = cap.textContent;
        notify();
      });
      cap.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          cap.blur();
        }
      });
      cap.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData.getData("text/plain") || "").replace(/\s+/g, " ");
        document.execCommand("insertText", false, text);
      });

      const tip = el("div", "be-img-tip");
      const handle = el("div", "be-img-handle");
      handle.title = "Drag to resize";
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        frame.classList.add("resizing");
        const container = fig.getBoundingClientRect();
        const left = frame.getBoundingClientRect().left;
        const move = (ev) => {
          let pct = Math.round(((ev.clientX - left) / container.width) * 100);
          pct = Math.max(15, Math.min(100, pct));
          if (pct > 96) pct = 100;
          b.widthPct = pct;
          frame.style.width = pct + "%";
          tip.textContent = pct + "%";
        };
        const up = () => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", up);
          frame.classList.remove("resizing");
          notify();
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", up);
      });

      frame.append(img, handle, tip, cap);
      fig.appendChild(frame);
      return fig;
    }

    function buildColumns(b) {
      const wrap = el("div", "be-columns");
      const template = (r) => r + "fr 32px " + (100 - r) + "fr";
      wrap.style.gridTemplateColumns = template(b.ratio);

      b.columns.forEach((col, c) => {
        const colEl = el("div", "be-col");
        colEl.dataset.cid = b.id;
        colEl.dataset.col = String(c);
        colEl.appendChild(buildList(col));
        const add = el("div", "be-col-add");
        add.addEventListener("click", () => {
          const last = col[col.length - 1];
          if (last && last.type === "p" && !(last.html || "").trim()) {
            focusBlock(last.id, "end");
          } else {
            const p = newBlock("p");
            col.push(p);
            render({ id: p.id, at: "start" });
            notify();
          }
        });
        colEl.appendChild(add);
        wrap.appendChild(colEl);

        if (c === 0) {
          // The gap is shared with the second column's block handle, so only a
          // slim strip of it (the "hit" element) grabs the resize drag.
          const rs = el("div", "be-col-resizer");
          const hit = el("div", "be-col-resizer-hit");
          hit.title = "Drag to resize columns";
          const tip = el("div", "be-ratio-tip");
          hit.appendChild(tip);
          hit.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            hit.setPointerCapture(e.pointerId);
            rs.classList.add("active");
            const rect = wrap.getBoundingClientRect();
            const move = (ev) => {
              let r = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
              r = Math.max(20, Math.min(80, r));
              if (Math.abs(r - 50) <= 2) r = 50;
              b.ratio = r;
              wrap.style.gridTemplateColumns = template(r);
              tip.textContent = r + " / " + (100 - r);
            };
            const up = () => {
              hit.removeEventListener("pointermove", move);
              hit.removeEventListener("pointerup", up);
              rs.classList.remove("active");
              notify();
            };
            hit.addEventListener("pointermove", move);
            hit.addEventListener("pointerup", up);
          });
          rs.appendChild(hit);
          wrap.appendChild(rs);
        }
      });
      return wrap;
    }

    function focusBlock(id, at) {
      const w = surface.querySelector('.be-block[data-id="' + id + '"]');
      if (!w) return;
      const t = w.querySelector(":scope > .be-body .be-text");
      if (!t) return;
      t.focus();
      setCaret(t, at || "start");
    }

    tail.addEventListener("click", () => {
      const last = state.blocks[state.blocks.length - 1];
      if (last && last.type === "p" && !(last.html || "").trim()) {
        focusBlock(last.id, "end");
        return;
      }
      const p = newBlock("p");
      state.blocks.push(p);
      render({ id: p.id, at: "start" });
      notify();
    });

    // ---- Text editing ----

    function shortcut(text) {
      const t = text.replace(/ /g, " ");
      const h = /^(#{1,3}) $/.exec(t);
      if (h) return "h" + h[1].length;
      if (/^[-*] $/.test(t)) return "ul";
      if (/^1[.)] $/.test(t)) return "ol";
      if (/^> $/.test(t)) return "quote";
      if (t === "---") return "divider";
      return null;
    }

    function onTextInput(id, t) {
      const f = find(id);
      if (!f) return;
      if (t.innerHTML === "<br>") t.innerHTML = "";
      const txt = t.textContent;

      if (f.block.type === "p") {
        const sc = shortcut(txt);
        if (sc) {
          applyType(id, sc);
          notify();
          return;
        }
      }

      f.block.html = sanitizeInline(t.innerHTML);
      const sm = /^\/([\w -]*)$/.exec(txt);
      if (sm) openMenu(id, sm[1]);
      else if (menu && menu.blockId === id) closeMenu();
      notify();
    }

    function onTextKeydown(e, id, t) {
      if (e.isComposing) return;

      if (menu && menu.blockId === id) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const n = menu.items.length;
          setMenuIndex((menu.index + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          chooseMenu(menu.index);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeMenu();
          return;
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) document.execCommand("insertLineBreak");
        else splitBlock(id, t);
        return;
      }
      if (e.key === "Backspace" && caretAtStart(t)) {
        if (backspaceAtStart(id)) e.preventDefault();
        return;
      }
      if (e.key === "ArrowUp" && !e.shiftKey && caretAtStart(t)) {
        if (focusNeighbor(t, -1)) e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown" && !e.shiftKey && caretAtEnd(t)) {
        if (focusNeighbor(t, 1)) e.preventDefault();
      }
    }

    function focusNeighbor(t, dir) {
      const all = Array.from(surface.querySelectorAll(".be-text, .be-caption"));
      const n = all[all.indexOf(t) + dir];
      if (!n) return false;
      n.focus();
      setCaret(n, dir < 0 ? "end" : "start");
      return true;
    }

    function splitBlock(id, t) {
      const f = find(id);
      if (!f) return;
      const b = f.block;
      const sel = getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) range.deleteContents();

      const rest = document.createRange();
      rest.selectNodeContents(t);
      rest.setStart(range.endContainer, range.endOffset);
      const holder = document.createElement("div");
      holder.appendChild(rest.extractContents());
      const tailHtml = sanitizeInline(holder.innerHTML);
      const headHtml = sanitizeInline(t.innerHTML === "<br>" ? "" : t.innerHTML);

      const wrapper = b.type === "ul" || b.type === "ol" || b.type === "quote" || b.type === "callout";
      if (wrapper && !textOf(headHtml).trim() && !textOf(tailHtml).trim()) {
        b.type = "p";
        b.html = "";
        delete b.icon;
        render({ id: b.id, at: "start" });
        notify();
        return;
      }

      b.html = headHtml;
      const nb = newBlock(b.type === "ul" || b.type === "ol" ? b.type : "p", { html: tailHtml });
      f.arr.splice(f.index + 1, 0, nb);
      render({ id: nb.id, at: "start" });
      notify();
    }

    function backspaceAtStart(id) {
      const f = find(id);
      if (!f) return false;
      const b = f.block;

      if (b.type !== "p") {
        b.type = "p";
        delete b.icon;
        render({ id: b.id, at: "start" });
        notify();
        return true;
      }

      const prev = f.arr[f.index - 1];
      if (prev && TEXT.indexOf(prev.type) !== -1) {
        const joinAt = textOf(prev.html).length;
        prev.html = sanitizeInline((prev.html || "") + (b.html || ""));
        f.arr.splice(f.index, 1);
        render({ id: prev.id, at: joinAt });
        notify();
        return true;
      }

      const empty = !textOf(b.html).trim();
      const alone = f.arr.length === 1;
      if (empty && !alone && (prev || f.index === 0)) {
        f.arr.splice(f.index, 1);
        const back = prev && TEXT.indexOf(prev.type) !== -1 ? { id: prev.id, at: "end" } : null;
        render(back);
        notify();
      }
      return true;
    }

    function onPaste(e, id) {
      const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(
        (x) => x.type.indexOf("image/") === 0
      );
      if (files.length) {
        e.preventDefault();
        insertImageFiles(files, { kind: "block", id, pos: "after" });
        return;
      }
      e.preventDefault();
      const text = ((e.clipboardData && e.clipboardData.getData("text/plain")) || "").replace(/\r/g, "");
      if (!text) return;
      const parts = text.split(/\n{2,}/).map((p) => p.replace(/\n/g, " "));
      document.execCommand("insertText", false, parts[0]);
      if (parts.length > 1) {
        const f = find(id);
        if (!f) return;
        const extra = parts.slice(1).map((p) => newBlock("p", { html: escapeBlockText(p) }));
        f.arr.splice.apply(f.arr, [f.index + 1, 0].concat(extra));
        render({ id: extra[extra.length - 1].id, at: "end" });
        notify();
      }
    }

    // ---- "/" menu ----

    function openMenu(blockId, query) {
      const f = find(blockId);
      const t = surface.querySelector('.be-block[data-id="' + blockId + '"] .be-text');
      if (!f || !t) return;
      const q = query.trim().toLowerCase();
      const items = MENU_ITEMS.filter(
        (it) => !(f.parent && it.type === "columns") && (!q || (it.label + " " + it.keys).toLowerCase().indexOf(q) !== -1)
      );
      if (!items.length) {
        closeMenu();
        return;
      }
      if (!menu || menu.blockId !== blockId) {
        closeMenu();
        menu = { blockId, index: 0, items, el: el("div", "be-menu") };
        document.body.appendChild(menu.el);
      }
      menu.items = items;
      menu.index = Math.min(menu.index, items.length - 1);
      paintMenu();

      const rect = t.getBoundingClientRect();
      menu.el.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 300)) + "px";
      let top = rect.bottom + 6;
      const h = menu.el.offsetHeight;
      if (top + h > window.innerHeight - 8) top = Math.max(8, rect.top - h - 6);
      menu.el.style.top = top + "px";
    }

    function paintMenu() {
      menu.el.replaceChildren();
      menu.items.forEach((it, i) => {
        const row = el("div", "be-menu-item" + (i === menu.index ? " active" : ""));
        const text = el("div", "be-menu-text");
        text.append(el("div", "be-menu-label", it.label), el("div", "be-menu-hint", it.hint));
        row.append(el("span", "be-menu-icon", it.icon), text);
        row.addEventListener("mousedown", (e) => e.preventDefault());
        row.addEventListener("click", () => chooseMenu(i));
        row.addEventListener("mousemove", () => {
          if (menu && menu.index !== i) setMenuIndex(i);
        });
        menu.el.appendChild(row);
      });
    }

    function setMenuIndex(i) {
      menu.index = i;
      Array.from(menu.el.children).forEach((row, n) => row.classList.toggle("active", n === i));
      const active = menu.el.children[i];
      if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
    }

    function closeMenu() {
      if (menu) {
        menu.el.remove();
        menu = null;
      }
    }

    function chooseMenu(i) {
      if (!menu) return;
      const it = menu.items[i];
      const id = menu.blockId;
      closeMenu();
      applyType(id, it.type);
      notify();
    }

    function applyType(id, type) {
      const f = find(id);
      if (!f) return;
      const b = f.block;

      if (TEXT.indexOf(type) !== -1) {
        b.type = type;
        b.html = "";
        if (type === "callout") b.icon = b.icon || "💡";
        else delete b.icon;
        render({ id, at: "start" });
      } else if (type === "divider") {
        b.type = "divider";
        delete b.html;
        const p = newBlock("p");
        f.arr.splice(f.index + 1, 0, p);
        render({ id: p.id, at: "start" });
      } else if (type === "image") {
        b.type = "image";
        delete b.html;
        b.src = "";
        b.caption = "";
        b.widthPct = 100;
        render();
      } else if (type === "columns") {
        b.type = "columns";
        delete b.html;
        b.ratio = 50;
        b.columns = [[newBlock("p")], [newBlock("p")]];
        render({ id: b.columns[0][0].id, at: "start" });
      }
    }

    // ---- Block options popover ----

    function openPop(id, anchor) {
      closePop();
      const f = find(id);
      if (!f) return;
      const p = el("div", "be-pop");
      const item = (label, fn, danger) => {
        const b = el("button", "be-pop-item" + (danger ? " danger" : ""), label);
        b.type = "button";
        b.addEventListener("click", () => {
          closePop();
          fn();
        });
        p.appendChild(b);
      };
      item("Duplicate", () => {
        const c = cloneBlock(f.block);
        f.arr.splice(f.index + 1, 0, c);
        render({ id: c.id, at: "end" });
        notify();
      });
      if (f.block.type === "image") item("Replace image", () => pickImageFor(id));
      if (f.block.type === "columns") {
        item("Equal widths", () => {
          f.block.ratio = 50;
          render();
          notify();
        });
      }
      item(
        "Delete",
        () => {
          f.arr.splice(f.index, 1);
          render();
          notify();
        },
        true
      );
      document.body.appendChild(p);
      const r = anchor.getBoundingClientRect();
      p.style.left = Math.min(r.left, window.innerWidth - 190) + "px";
      let top = r.bottom + 4;
      if (top + p.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - p.offsetHeight - 4);
      p.style.top = top + "px";
      pop = p;
    }

    function closePop() {
      if (pop) {
        pop.remove();
        pop = null;
      }
    }

    // ---- Images, drag and drop ----

    function pickImageFor(id) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (file) insertImageFiles([file], { kind: "replace", id });
      });
      input.click();
    }

    function placeBlock(b, t) {
      if (t.kind === "block") {
        const f = find(t.id);
        if (f) {
          if ((t.pos === "left" || t.pos === "right") && !f.parent) {
            const anchor = f.block;
            f.arr[f.index] = {
              id: makeBlockId(),
              type: "columns",
              ratio: 50,
              columns: t.pos === "left" ? [[b], [anchor]] : [[anchor], [b]],
            };
            return;
          }
          f.arr.splice(f.index + (t.pos === "before" || t.pos === "left" ? 0 : 1), 0, b);
          return;
        }
      } else if (t.kind === "zone") {
        const f = find(t.columnsId);
        if (f && f.block.columns[t.col]) {
          f.block.columns[t.col].push(b);
          return;
        }
      }
      state.blocks.push(b);
    }

    function moveBlock(id, t) {
      const f = find(id);
      if (!f) return;
      const b = f.block;
      if (t.kind === "block") {
        if (t.id === id) return;
        if (b.type === "columns" && containsId(b, t.id)) return;
        const tf = find(t.id);
        if (!tf) return;
        if (b.type === "columns" && tf.parent) return;
      }
      if (t.kind === "zone" && b.type === "columns") return;
      f.arr.splice(f.index, 1);
      placeBlock(b, t);
      render();
      notify();
    }

    async function insertImageFiles(files, target) {
      let t = target;
      for (const file of files) {
        let src;
        try {
          src = await readImage(file);
        } catch (err) {
          if (options.onError) options.onError("Couldn't read “" + file.name + "”");
          continue;
        }

        if (t.kind === "replace") {
          const f = find(t.id);
          if (f) {
            f.block.src = src;
            f.block.widthPct = f.block.widthPct || 100;
            t = { kind: "block", id: t.id, pos: "after" };
          }
          continue;
        }

        const anchor = t.kind === "block" ? find(t.id) : null;
        if (anchor && anchor.block.type === "image" && !anchor.block.src && t.pos !== "left" && t.pos !== "right") {
          anchor.block.src = src;
          t = { kind: "block", id: anchor.block.id, pos: "after" };
          continue;
        }

        const nb = newBlock("image", { src });
        placeBlock(nb, t);
        t = { kind: "block", id: nb.id, pos: "after" };
      }
      render();
      notify();
    }

    function dropTarget(e) {
      const tgt = e.target instanceof Element ? e.target : null;
      const wrap = tgt && tgt.closest(".be-block");
      const col = tgt && tgt.closest(".be-col");

      if (col && (!wrap || wrap.contains(col))) {
        return { kind: "zone", columnsId: col.dataset.cid, col: Number(col.dataset.col) };
      }
      if (wrap && surface.contains(wrap)) {
        const id = wrap.dataset.id;
        const f = find(id);
        const r = wrap.getBoundingClientRect();
        const dragged = dragId ? find(dragId) : null;
        const draggingColumns = dragged && dragged.block.type === "columns";
        const sideOk = f && !f.parent && f.block.type !== "columns" && !draggingColumns;
        const edge = Math.min(64, r.width * 0.12);
        if (sideOk && e.clientX < r.left + edge) return { kind: "block", id, pos: "left" };
        if (sideOk && e.clientX > r.right - edge) return { kind: "block", id, pos: "right" };
        return { kind: "block", id, pos: e.clientY < r.top + r.height / 2 ? "before" : "after" };
      }
      return { kind: "end" };
    }

    function showIndicator(t) {
      const s = surface.getBoundingClientRect();
      let x = 0;
      let y = 0;
      let w = 0;
      let h = 3;
      if (t.kind === "block") {
        const wrap = surface.querySelector('.be-block[data-id="' + t.id + '"]');
        if (!wrap) return hideIndicator();
        const r = wrap.getBoundingClientRect();
        if (t.pos === "left" || t.pos === "right") {
          x = (t.pos === "left" ? r.left : r.right) - s.left - 1;
          y = r.top - s.top;
          w = 3;
          h = r.height;
        } else {
          x = r.left - s.left;
          y = (t.pos === "before" ? r.top : r.bottom) - s.top - 1;
          w = r.width;
        }
      } else if (t.kind === "zone") {
        const colEl = surface.querySelector('.be-col[data-cid="' + t.columnsId + '"][data-col="' + t.col + '"]');
        if (!colEl) return hideIndicator();
        const r = colEl.getBoundingClientRect();
        x = r.left - s.left;
        y = r.bottom - s.top - 3;
        w = r.width;
      } else {
        const last = surface.querySelector(":scope > .be-block:last-of-type") || surface.lastElementChild;
        const r = (last || surface).getBoundingClientRect();
        x = r.left - s.left;
        y = r.bottom - s.top;
        w = r.width;
      }
      dropLine.style.cssText =
        "display:block;left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px";
    }

    function hideIndicator() {
      dropLine.style.display = "none";
    }

    function hasFiles(e) {
      return Array.from((e.dataTransfer && e.dataTransfer.types) || []).indexOf("Files") !== -1;
    }

    scroller.addEventListener("dragover", (e) => {
      if (!dragId && !hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = dragId ? "move" : "copy";
      dropState = dropTarget(e);
      showIndicator(dropState);
    });

    scroller.addEventListener("dragleave", (e) => {
      if (!scroller.contains(e.relatedTarget)) hideIndicator();
    });

    scroller.addEventListener("drop", (e) => {
      const files = Array.from(e.dataTransfer.files || []).filter((x) => x.type.indexOf("image/") === 0);
      const t = dropTarget(e);
      if (files.length) {
        e.preventDefault();
        hideIndicator();
        insertImageFiles(files, t);
      } else if (dragId) {
        e.preventDefault();
        const id = dragId;
        dragId = null;
        hideIndicator();
        moveBlock(id, t);
      }
    });

    // Stop a stray file drop elsewhere on the page from navigating away.
    document.addEventListener(
      "dragover",
      (e) => {
        if (hasFiles(e)) e.preventDefault();
      },
      { signal }
    );
    document.addEventListener(
      "drop",
      (e) => {
        if (hasFiles(e)) e.preventDefault();
      },
      { signal }
    );

    // ---- Floating text toolbar ----

    function syncSelectionHost() {
      const s = getSelection();
      const host = s && closestEl(s.anchorNode, ".be-text");
      const w = host && host.closest(".be-block");
      if (host && w) onTextInput(w.dataset.id, host);
    }

    function floatBtn(label, title, fn, cls) {
      const b = el("button", "be-float-btn" + (cls ? " " + cls : ""), label);
      b.type = "button";
      b.title = title;
      b.dataset.cmd = cls || "";
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", fn);
      float.appendChild(b);
    }

    function fmt(cmd) {
      document.execCommand(cmd, false, null);
      syncSelectionHost();
      updateFloat();
    }

    function fmtLink() {
      const s = getSelection();
      if (!s.rangeCount) return;
      if (closestEl(s.anchorNode, "a")) {
        document.execCommand("unlink");
        syncSelectionHost();
        return;
      }
      const saved = s.getRangeAt(0).cloneRange();
      const url = window.prompt("Link URL", "https://");
      if (!url) return;
      s.removeAllRanges();
      s.addRange(saved);
      document.execCommand("createLink", false, url);
      syncSelectionHost();
    }

    floatBtn("B", "Bold (⌘B)", () => fmt("bold"), "bold");
    floatBtn("I", "Italic (⌘I)", () => fmt("italic"), "italic");
    floatBtn("U", "Underline (⌘U)", () => fmt("underline"), "underline");
    floatBtn("Link", "Add or remove a link", fmtLink, "link");

    function hideFloat() {
      float.style.display = "none";
    }

    function updateFloat() {
      const s = getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return hideFloat();
      const host = closestEl(s.anchorNode, ".be-text");
      const other = closestEl(s.focusNode, ".be-text");
      if (!host || host !== other || !surface.contains(host)) return hideFloat();
      const rect = s.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return hideFloat();

      float.style.display = "flex";
      ["bold", "italic", "underline"].forEach((cmd) => {
        const btn = float.querySelector('[data-cmd="' + cmd + '"]');
        if (btn) btn.classList.toggle("on", document.queryCommandState(cmd));
      });
      const w = float.offsetWidth;
      const left = Math.max(8, Math.min(window.innerWidth - w - 8, rect.left + rect.width / 2 - w / 2));
      let top = rect.top - float.offsetHeight - 8;
      if (top < 8) top = rect.bottom + 8;
      float.style.left = left + "px";
      float.style.top = top + "px";
    }

    document.addEventListener("selectionchange", updateFloat, { signal });
    window.addEventListener("scroll", () => {
      closeMenu();
      updateFloat();
    }, { signal, capture: true, passive: true });

    document.addEventListener(
      "mousedown",
      (e) => {
        if (menu && !menu.el.contains(e.target)) closeMenu();
        if (pop && !pop.contains(e.target)) closePop();
      },
      { signal }
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") {
          closePop();
          hideFloat();
        }
      },
      { signal }
    );
    window.addEventListener("pagehide", flush, { signal });

    // ---- Start ----

    render();
    updateUsage();

    return {
      flush,
      destroy() {
        flush();
        ac.abort();
        closeMenu();
        closePop();
        float.remove();
        root.replaceChildren();
        root.classList.remove("be-root");
      },
    };
  }

  window.BlockEditor = { mount };
})();
