document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.querySelector(".projects-scroll");
  const footer = document.querySelector(".footer");
  const projects = document.querySelectorAll(".projects-grid .project");
  const filterBtns = document.querySelectorAll(".footer .filter-link");

  const meBtn = document.querySelector(".footer .me-link");
  const mePage = document.querySelector("#mePage");
  const meHit = document.querySelector("#mePage .me-hit");

  // ✅ Project Panel
  const projectPanel = document.querySelector("#projectPanel");
  const projectCloseBtns = document.querySelectorAll("[data-project-close]");
  const panelTitle = document.querySelector(".project-panel-title");
  const panelTags = document.querySelector(".project-panel-tags");
  const panelVideo = document.querySelector(".project-panel-video");
  const panelGallery = document.querySelector(".project-panel-gallery");
  const panelEmpty = document.querySelector(".project-panel-empty");
  const panelDesc = document.querySelector(".project-panel-desc"); // ✅ HTML container (div)

  // ----------------
  // ✅ LOADER (100% piloté par le CSS)
  // ----------------
  const siteLoader = document.querySelector("#siteLoader");
  const loaderBar = document.querySelector("#loaderBar");

  const parseTimeToMs = (val) => {
    const raw = String(val || "")
      .split(",")[0]
      .trim();
    if (!raw) return 0;
    if (raw.endsWith("ms")) return parseFloat(raw) || 0;
    if (raw.endsWith("s")) return (parseFloat(raw) || 0) * 1000;
    return parseFloat(raw) || 0;
  };

  const getVarMs = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    const ms = parseTimeToMs(v);
    return ms || fallback || 0;
  };

  const setReady = () => {
    document.body.classList.add("is-ready");
    if (siteLoader) siteLoader.setAttribute("aria-hidden", "true");

    const fadeMs = getVarMs("--loader-fade", 450);
    window.setTimeout(() => {
      document.body.classList.add("grid-ready");
    }, fadeMs);
  };

  if (!siteLoader || !loaderBar) {
    document.body.classList.add("is-ready", "grid-ready");
    if (siteLoader) siteLoader.setAttribute("aria-hidden", "true");
  } else {
    let pageLoaded = false;
    let animDone = false;
    let doneCalled = false;

    const tryDone = () => {
      if (doneCalled) return;
      if (pageLoaded && animDone) {
        doneCalled = true;
        setReady();
      }
    };

    window.addEventListener("load", () => {
      pageLoaded = true;
      tryDone();
    });

    loaderBar.addEventListener("animationend", (e) => {
      if (e.target !== loaderBar) return;
      animDone = true;
      tryDone();
    });

    const cssDur = getVarMs("--loader-duration", 0);
    const barStyles = getComputedStyle(loaderBar);
    const animName = (barStyles.animationName || "").trim();
    const animDur = parseTimeToMs(barStyles.animationDuration);
    const fallbackMs = Math.max(cssDur, animDur, 0) + 80;

    window.setTimeout(() => {
      animDone = true;
      tryDone();
    }, fallbackMs);

    if (!animName || animName === "none" || animDur === 0) {
      animDone = true;
      tryDone();
    }
  }

  // ⚠️ guard après init loader
  if (!scroller || !footer || !projects.length) return;

  // ----------------
  // ✅ FOOTER HEIGHT SYNC
  // ----------------
  function syncFooterHeight() {
    const h = Math.ceil(footer.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--footer-h", `${h}px`);
  }

  syncFooterHeight();
  window.addEventListener("resize", syncFooterHeight);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncFooterHeight);
  }

  // ----------------
  // ✅ MOBILE FILTERS (hamburger + sheet)
  // ----------------
  const isMobile = () => window.matchMedia("(max-width: 640px)").matches;

  const filtersToggle = document.createElement("button");
  filtersToggle.type = "button";
  filtersToggle.className = "filters-toggle";
  filtersToggle.setAttribute("aria-expanded", "false");
  filtersToggle.setAttribute("aria-controls", "filtersPanel");

  filtersToggle.innerHTML = `
    <span class="burger" aria-hidden="true">
      <span></span><span></span><span></span>
    </span>
  `;
  filtersToggle.setAttribute("aria-label", "Open filters");
  filtersToggle.title = "Filters";

  const filtersPanel = document.createElement("div");
  filtersPanel.className = "filters-panel";
  filtersPanel.id = "filtersPanel";
  filtersPanel.setAttribute("aria-hidden", "true");

  filtersPanel.innerHTML = `
    <button type="button" class="filters-backdrop" aria-label="Close filters"></button>
    <div class="filters-sheet" role="dialog" aria-modal="true" aria-label="Filters">
      <div class="filters-sheet-list"></div>
    </div>
  `;
  document.body.appendChild(filtersPanel);

  const filtersBackdrop = filtersPanel.querySelector(".filters-backdrop");
  const filtersList = filtersPanel.querySelector(".filters-sheet-list");

  footer.insertBefore(filtersToggle, footer.firstChild);

  let panelFilterButtons = [];

  function openFilters() {
    if (!isMobile()) return;
    document.body.classList.add("filters-open");
    filtersPanel.setAttribute("aria-hidden", "false");
    filtersToggle.setAttribute("aria-expanded", "true");
  }

  function closeFilters() {
    document.body.classList.remove("filters-open");
    filtersPanel.setAttribute("aria-hidden", "true");
    filtersToggle.setAttribute("aria-expanded", "false");
  }

  function toggleFilters() {
    document.body.classList.contains("filters-open")
      ? closeFilters()
      : openFilters();
  }

  function updateFiltersToggleLabel() {
    const active = document.querySelector(".footer .filter-link.is-active");
    const label = active ? active.textContent.trim() : "All";
    filtersToggle.setAttribute(
      "aria-label",
      `Open filters (current: ${label})`
    );
    filtersToggle.title = `Filters: ${label}`;
  }

  function rebuildPanelButtons() {
    filtersList.innerHTML = "";
    panelFilterButtons = [];

    filterBtns.forEach((link) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filters-item";
      btn.textContent = link.textContent.trim();
      btn.dataset.filter = (link.dataset.filter || "all").toLowerCase();

      btn.addEventListener("click", () => {
        setActive(link);
        closeMe();
        closeProject();
        filterProjects(btn.dataset.filter);
        closeFilters();
      });

      filtersList.appendChild(btn);
      panelFilterButtons.push(btn);
    });
  }

  rebuildPanelButtons();

  filtersToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMe();
    closeProject();
    toggleFilters();
  });

  filtersBackdrop.addEventListener("click", closeFilters);

  // ----------------
  // ✅ TITLES auto (hover)
  // ----------------
  projects.forEach((p) => {
    const existing = (p.dataset.title || "").trim();
    if (existing) return;
    const img = p.querySelector("img");
    const alt = (img?.alt || "").trim();
    p.dataset.title = alt || "Project";
  });

  // ----------------
  // FILTERS
  // ----------------
  function setActive(btn) {
    filterBtns.forEach((b) => {
      b.classList.remove("is-active");
      b.removeAttribute("aria-current");
    });

    if (btn) {
      btn.classList.add("is-active");
      btn.setAttribute("aria-current", "page");
    }

    const activeFilter = (btn?.dataset.filter || "all").toLowerCase();
    panelFilterButtons.forEach((pb) => {
      pb.classList.toggle("is-active", pb.dataset.filter === activeFilter);
    });

    updateFiltersToggleLabel();
    syncFooterHeight();
  }

  function filterProjects(filter) {
    projects.forEach((p) => {
      const tags = (p.dataset.tags || "")
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const show = filter === "all" || tags.includes(filter);
      p.classList.toggle("is-hidden", !show);
    });

    scroller.scrollLeft = 0;
  }

  // ----------------
  // ME
  // ----------------
  function openMe() {
    closeFilters();
    document.body.classList.add("me-open");
    if (mePage) mePage.setAttribute("aria-hidden", "false");
    if (meBtn) meBtn.setAttribute("aria-expanded", "true");
  }

  function closeMe() {
    document.body.classList.remove("me-open");
    if (mePage) mePage.setAttribute("aria-hidden", "true");
    if (meBtn) meBtn.setAttribute("aria-expanded", "false");
  }

  function toggleMe() {
    document.body.classList.contains("me-open") ? closeMe() : openMe();
  }

  // ----------------
  // ✅ FULL WIDTH pour video-sequence / motiondesign
  // ----------------
  function isWideProject(projectEl) {
    const tags = (projectEl.dataset.tags || "")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return tags.includes("video-sequence") || tags.includes("motiondesign");
  }

  // ----------------
  // PROJECT PANEL
  // ----------------
  function fillVideoFromProject(projectEl) {
    if (!panelVideo) return false;
    panelVideo.innerHTML = "";
    panelVideo.classList.remove("is-3videos");

    const rawMany = (projectEl.dataset.videos || "").trim();
    const rawOneOrMany = (projectEl.dataset.video || "").trim();

    let sources = [];

    const addSources = (str) => {
      if (!str) return;
      str
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => sources.push(s));
    };

    addSources(rawMany);
    addSources(rawOneOrMany);

    sources = [...new Set(sources)];
    if (sources.length === 0) return false;

    if (sources.length === 3) panelVideo.classList.add("is-3videos");

    sources.forEach((src, i) => {
      const v = document.createElement("video");
      v.src = src;
      v.controls = true;
      v.playsInline = true;
      v.preload = "metadata";

      v.style.display = "block";

      if (sources.length !== 3) {
        v.style.margin = "0 auto";
        v.style.marginBottom = i === sources.length - 1 ? "0" : "12px";
      }

      panelVideo.appendChild(v);
    });

    return true;
  }

  function fillGalleryFromProject(projectEl, opts = {}) {
    const { fallbackToThumb = true } = opts;

    if (panelGallery) panelGallery.innerHTML = "";

    const raw = (projectEl.dataset.images || "").trim();
    let sources = raw
      ? raw
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (sources.length === 0 && fallbackToThumb) {
      const img = projectEl.querySelector("img");
      if (img?.src) sources = [img.src];
    }

    if (panelGallery && sources.length > 0) {
      sources.forEach((src, i) => {
        const im = document.createElement("img");
        im.src = src;
        im.alt = `Project image ${i + 1}`;
        panelGallery.appendChild(im);
      });
    }

    return sources.length;
  }

  // ✅ helpers: texte
  const escapeHTML = (str) =>
    String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  function getProjectTextHTML(projectEl) {
    // 1) Priorité : bloc HTML libre
    const block = projectEl.querySelector(".project-text");
    const html = (block?.innerHTML || "").trim();
    if (html) return html;

    // 2) Fallback : data-desc (ancien système)
    const rawDesc = (projectEl.dataset.desc || "").trim();
    if (!rawDesc) return "";

    const lines = rawDesc
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return "";

    const first = `<h3>${escapeHTML(lines[0])}</h3>`;
    const rest = lines
      .slice(1)
      .map((l) => `<p>${escapeHTML(l)}</p>`)
      .join("");

    return first + rest;
  }

  function openProject(projectEl) {
    if (!projectPanel) return;

    closeFilters();

    document.body.classList.toggle("project-wide", isWideProject(projectEl));
    document.body.classList.add("project-open");
    projectPanel.setAttribute("aria-hidden", "false");

    const img = projectEl.querySelector("img");
    const tags = (projectEl.dataset.tags || "").trim();

    const layout = (projectEl.dataset.videoLayout || "").trim().toLowerCase();
    document.body.classList.toggle(
      "layout-triple-vertical",
      layout === "triple-vertical"
    );

    const title =
      (projectEl.dataset.title || "").trim() || img?.alt || "Project";
    if (panelTitle) panelTitle.textContent = title;

    if (panelTags) panelTags.textContent = tags ? `Tags: ${tags}` : "";

    const hasVideo = fillVideoFromProject(projectEl);
    const imgCount = fillGalleryFromProject(projectEl, {
      fallbackToThumb: !hasVideo,
    });

    // ✅ TEXTE HTML (depuis .project-text, sinon data-desc fallback)
    const textHTML = getProjectTextHTML(projectEl);
    if (panelDesc) {
      panelDesc.innerHTML = textHTML;
      panelDesc.hidden = !textHTML;
    }

    if (panelEmpty) panelEmpty.hidden = hasVideo || imgCount > 0 || !!textHTML;
  }

  function closeProject() {
    if (!projectPanel) return;

    document.body.classList.remove("project-open");
    document.body.classList.remove("project-wide");
    document.body.classList.remove("layout-triple-vertical");

    projectPanel.setAttribute("aria-hidden", "true");

    if (panelGallery) panelGallery.innerHTML = "";
    if (panelVideo) panelVideo.innerHTML = "";

    // stop vidéos si besoin
    if (panelVideo) {
      panelVideo.querySelectorAll("video").forEach((v) => {
        try {
          v.pause();
          v.currentTime = 0;
        } catch {}
      });
    }

    if (panelDesc) {
      panelDesc.innerHTML = "";
      panelDesc.hidden = true;
    }

    if (panelEmpty) panelEmpty.hidden = true;
  }

  projects.forEach((p) => {
    p.addEventListener("click", (e) => {
      if (document.body.classList.contains("me-open")) return;
      if (document.body.classList.contains("filters-open")) return;
      if (p.classList.contains("is-hidden")) return;

      e.preventDefault();
      openProject(p);
    });
  });

  projectCloseBtns.forEach((btn) =>
    btn.addEventListener("click", closeProject)
  );

  // ----------------
  // EVENTS
  // ----------------
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const filter = (btn.dataset.filter || "all").toLowerCase();
      setActive(btn);
      closeMe();
      closeProject();
      closeFilters();
      filterProjects(filter);
    });
  });

  if (meBtn) {
    meBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeProject();
      closeFilters();
      toggleMe();
    });
  }

  if (meHit) {
    meHit.addEventListener("click", (e) => {
      e.preventDefault();
      closeMe();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMe();
      closeProject();
      closeFilters();
    }
  });

  const allBtn = document.querySelector(
    '.footer .filter-link[data-filter="all"]'
  );
  setActive(allBtn);
  filterProjects("all");
});
