// Shared floating nav pill — renders Designer / Traveller / Mother switcher,
// plus the crossfade helpers used to make persona switches feel smooth.

let navButtons = {};
let navIndicator = null;
let navActivePersona = null;

// Builds the nav once per page load. Re-used on every persona switch so the
// pill indicator can slide between buttons instead of popping in fresh.
function initNav(activePersona, onSwitch) {
  const nav = document.getElementById("nav-root");
  nav.innerHTML = "";
  navButtons = {};

  const wrap = document.createElement("div");
  wrap.className = "nav-wrap";

  const pill = document.createElement("div");
  pill.className = "nav-pill";

  const indicator = document.createElement("div");
  indicator.className = "nav-indicator";
  pill.appendChild(indicator);
  navIndicator = indicator;

  PERSONAS.forEach((persona) => {
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.type = "button";

    const label = document.createElement("span");
    label.textContent = PERSONA_LABELS[persona];
    btn.appendChild(label);

    btn.addEventListener("click", () => {
      if (persona === navActivePersona) return;
      if (typeof onSwitch === "function") {
        onSwitch(persona);
      } else {
        window.location.href = "index.html?persona=" + persona;
      }
    });

    pill.appendChild(btn);
    navButtons[persona] = btn;
  });

  wrap.appendChild(pill);
  nav.appendChild(wrap);

  setActiveNav(activePersona, false);
}

// Slides the indicator to the active button. `animate: false` snaps instantly
// (used on first paint so nothing glides in from nowhere).
function setActiveNav(persona, animate) {
  navActivePersona = persona;
  Object.keys(navButtons).forEach((p) => {
    navButtons[p].classList.toggle("active", p === persona);
  });

  const btn = navButtons[persona];
  if (!btn || !navIndicator) return;

  if (!animate) {
    navIndicator.style.transition = "none";
  }
  navIndicator.style.transform = "translateX(" + btn.offsetLeft + "px)";
  navIndicator.style.width = btn.offsetWidth + "px";
  if (!animate) {
    void navIndicator.offsetWidth; // force reflow before re-enabling transitions
    navIndicator.style.transition = "";
  }
}

function getQueryPersona() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get("persona");
  return PERSONAS.includes(p) ? p : "designer";
}

function setPersonaOnDocument(persona) {
  document.documentElement.setAttribute("data-persona", persona);
}

// Two stacked dotted-background layers crossfade into each other so the
// accent color change never hard-cuts.
const DOT_COLORS = {
  designer: "#d1d5db",
  traveller: "#bfdbfe",
  mother: "#fbcfe8",
};

let dotsActiveLayer = "a";

function dotsGradient(persona) {
  return "radial-gradient(circle, " + DOT_COLORS[persona] + " 1px, transparent 1px)";
}

function initDots(persona) {
  const a = document.getElementById("dots-a");
  const b = document.getElementById("dots-b");
  if (!a || !b) return;
  a.style.backgroundImage = dotsGradient(persona);
  a.style.opacity = "0.6";
  b.style.opacity = "0";
  dotsActiveLayer = "a";
}

function transitionDots(persona) {
  const nextLayer = dotsActiveLayer === "a" ? "b" : "a";
  const nextEl = document.getElementById("dots-" + nextLayer);
  const curEl = document.getElementById("dots-" + dotsActiveLayer);
  if (!nextEl || !curEl) return;

  nextEl.style.backgroundImage = dotsGradient(persona);
  requestAnimationFrame(() => {
    nextEl.style.opacity = "0.6";
    curEl.style.opacity = "0";
  });
  dotsActiveLayer = nextLayer;
}

// Shared orchestration: fades the page content out, swaps it for the new
// persona's markup, then fades it back in — while the nav pill and dotted
// background animate in step alongside it.
let pendingTransitionTimeout = null;

function transitionToPersona(persona, renderFn, isInitial) {
  const root = document.getElementById("page-root");
  setActiveNav(persona, !isInitial);

  if (isInitial) {
    initDots(persona);
    setPersonaOnDocument(persona);
    renderFn();
    return;
  }

  if (pendingTransitionTimeout) {
    window.clearTimeout(pendingTransitionTimeout);
  }

  transitionDots(persona);
  root.classList.add("is-hidden");
  pendingTransitionTimeout = window.setTimeout(() => {
    pendingTransitionTimeout = null;
    setPersonaOnDocument(persona);
    renderFn();
    void root.offsetWidth; // force reflow so the fade-in transition runs
    root.classList.remove("is-hidden");
  }, 240);
}
