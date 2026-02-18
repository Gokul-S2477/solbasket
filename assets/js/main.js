(function () {
  const doc = document;
  const header = doc.querySelector(".site-header");
  const navLinks = doc.getElementById("navLinks");
  const menuToggle = doc.getElementById("menuToggle");
  const themeToggle = doc.getElementById("themeToggle");
  const yearEl = doc.getElementById("year");
  const form = doc.getElementById("contactForm");
  const formStatus = doc.getElementById("formStatus");
  const HEADER_SCROLL_ENTER = 28;
  const HEADER_SCROLL_EXIT = 14;
  const THEME_STORAGE_KEY = "solbasket-theme";

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function getInitialTheme() {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (error) {
      // Ignore storage access failures and continue with fallback.
    }

    const current = doc.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") return current;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function updateThemeButton(theme) {
    if (!themeToggle) return;
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    const label = themeToggle.querySelector("[data-theme-label]");
    if (label) label.textContent = isDark ? "Light" : "Dark";
  }

  function applyTheme(theme, persist = true) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    doc.documentElement.setAttribute("data-theme", nextTheme);
    updateThemeButton(nextTheme);

    window.dispatchEvent(
      new CustomEvent("solbasket:theme", {
        detail: { theme: nextTheme }
      })
    );

    if (persist) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {
        // Ignore storage write failures.
      }
    }
  }

  applyTheme(getInitialTheme(), false);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = doc.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
  }

  let headerScrolled = null;
  let headerTicking = false;

  function setHeaderState() {
    if (!header) return;

    const y = window.scrollY;
    const nextScrolled =
      headerScrolled === null
        ? y > HEADER_SCROLL_ENTER
        : headerScrolled
          ? y > HEADER_SCROLL_EXIT
          : y > HEADER_SCROLL_ENTER;

    if (nextScrolled === headerScrolled) return;

    headerScrolled = nextScrolled;
    header.classList.toggle("scrolled", nextScrolled);
  }

  function onHeaderScroll() {
    if (headerTicking) return;
    headerTicking = true;

    window.requestAnimationFrame(() => {
      setHeaderState();
      headerTicking = false;
    });
  }

  setHeaderState();
  window.addEventListener("scroll", onHeaderScroll, { passive: true });

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const navDockItems = navLinks ? [...navLinks.querySelectorAll("a")] : [];
  if (navLinks && navDockItems.length) {
    const DOCK_DISTANCE = 185;
    const MAX_SCALE = 1.26;
    const MAX_LIFT = 11;
    const MAX_GLOW = 1;
    let dockActive = false;
    let dockPointerX = Number.POSITIVE_INFINITY;
    let dockTicking = false;

    function resetDock() {
      navDockItems.forEach((item) => {
        item.style.setProperty("--dock-scale", "1");
        item.style.setProperty("--dock-lift", "0px");
        item.style.setProperty("--dock-glow", "0");
      });
    }

    function smoothStep(value) {
      return value * value * (3 - (2 * value));
    }

    function syncDock() {
      dockTicking = false;

      if (!dockActive || window.innerWidth <= 920 || !Number.isFinite(dockPointerX)) {
        resetDock();
        return;
      }

      navDockItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const centerX = rect.left + (rect.width * 0.5);
        const distance = Math.abs(dockPointerX - centerX);
        const ratio = Math.max(0, 1 - (distance / DOCK_DISTANCE));
        const influence = smoothStep(ratio);
        const scale = 1 + (influence * (MAX_SCALE - 1));
        const lift = -(influence * MAX_LIFT);

        item.style.setProperty("--dock-scale", scale.toFixed(3));
        item.style.setProperty("--dock-lift", `${lift.toFixed(2)}px`);
        item.style.setProperty("--dock-glow", (influence * MAX_GLOW).toFixed(3));
      });
    }

    function queueDockSync() {
      if (dockTicking) return;
      dockTicking = true;
      window.requestAnimationFrame(syncDock);
    }

    navLinks.addEventListener(
      "pointerenter",
      (event) => {
        if (window.innerWidth <= 920) return;
        dockActive = true;
        dockPointerX = event.clientX;
        queueDockSync();
      },
      { passive: true }
    );

    navLinks.addEventListener(
      "pointermove",
      (event) => {
        if (!dockActive || window.innerWidth <= 920) return;
        dockPointerX = event.clientX;
        queueDockSync();
      },
      { passive: true }
    );

    navLinks.addEventListener("pointerleave", () => {
      dockActive = false;
      dockPointerX = Number.POSITIVE_INFINITY;
      queueDockSync();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth <= 920) {
        dockActive = false;
        dockPointerX = Number.POSITIVE_INFINITY;
      }
      queueDockSync();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        dockActive = false;
        dockPointerX = Number.POSITIVE_INFINITY;
      }
      queueDockSync();
    });

    resetDock();
  }

  doc.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = doc.querySelector(href);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const sections = [...doc.querySelectorAll("main section[id]")];
  const navAnchors = [...doc.querySelectorAll(".nav-links a[href^='#']")];
  if (sections.length && navAnchors.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          navAnchors.forEach((anchor) => {
            anchor.classList.toggle("active", anchor.getAttribute("href") === `#${id}`);
          });
        });
      },
      { threshold: 0.42 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  const revealTargets = [
    ...doc.querySelectorAll(
      ".stat-card, .about-block, .about-visual, .services-header, .services-module, .services-nav-item, .tools-copy, .tools-marquee, .community-card, .contact-info, .contact-form"
    )
  ];

  if (revealTargets.length) {
    revealTargets.forEach((element, index) => {
      element.classList.add("reveal-up");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 280)}ms`);
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  const valueRail = doc.getElementById("valueRail");
  const aboutVisual = doc.getElementById("aboutVisual");
  const aboutImage = doc.getElementById("aboutValueImage");
  const aboutTitle = doc.getElementById("aboutValueTitle");
  const aboutText = doc.getElementById("aboutValueText");
  const aboutList = doc.getElementById("aboutValueList");

  const aboutValues = {
    innovative: {
      title: "Innovate. Transform. Lead.",
      text: "Every project maps to conversion, retention, and operational performance goals. We build premium digital ecosystems that turn business intent into execution.",
      image: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1600&q=80",
      alt: "Solbasket innovative technology development workspace",
      bullets: [
        "Design conversion-focused digital experiences.",
        "Develop secure and scalable technology platforms.",
        "Enable teams with process intelligence and automation."
      ]
    },
    authentic: {
      title: "Authentic partnerships, clear execution.",
      text: "We work as a true implementation partner with transparent communication, practical roadmaps, and strong ownership from discovery to release.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
      alt: "Team collaboration session representing authentic partnership",
      bullets: [
        "Milestone-based planning and accountability.",
        "Business-first recommendations with practical scope.",
        "Consistent reporting and collaborative decision making."
      ]
    },
    disruptive: {
      title: "Disruptive systems for serious growth.",
      text: "Solbasket modernizes legacy workflows with automation, integration, and product engineering so teams can move faster with fewer bottlenecks.",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
      alt: "Advanced coding environment representing disruptive engineering",
      bullets: [
        "Automation across operations and approvals.",
        "Integration-ready platforms with reliable APIs.",
        "Performance architecture designed for scale."
      ]
    },
    visionary: {
      title: "Visionary strategy backed by data.",
      text: "From KPI tracking to forecasting and campaign intelligence, we connect strategy with measurable outcomes and long-term digital direction.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
      alt: "Business intelligence dashboard for visionary strategy",
      bullets: [
        "Executive-ready dashboard systems.",
        "Decision support with trend visibility.",
        "Continuous optimization tied to business targets."
      ]
    }
  };

  function renderAboutValue(key) {
    const value = aboutValues[key];
    if (!value || !aboutImage || !aboutTitle || !aboutText || !aboutList) return;

    if (aboutVisual) aboutVisual.classList.add("is-updating");

    window.setTimeout(() => {
      aboutImage.src = value.image;
      aboutImage.alt = value.alt;
      aboutTitle.textContent = value.title;
      aboutText.textContent = value.text;
      aboutList.innerHTML = value.bullets.map((item) => `<li>${item}</li>`).join("");
      if (aboutVisual) aboutVisual.classList.remove("is-updating");
    }, 120);
  }

  if (valueRail) {
    const buttons = [...valueRail.querySelectorAll(".value-pill")];
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-value");
        if (!key || !aboutValues[key]) return;

        buttons.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-selected", String(isActive));
        });

        renderAboutValue(key);
      });
    });
  }

  const servicePanels = [...doc.querySelectorAll(".service-panel")];
  const serviceNavItems = [...doc.querySelectorAll(".services-nav-item")];
  const servicesTrack = doc.getElementById("servicesTrack");
  const serviceMetrics = { start: 0, range: 1, end: 1 };
  let currentServiceStep = "1";
  let serviceTicking = false;
  let serviceResizeTicking = false;

  function setActiveService(step) {
    if (!servicePanels.length || !serviceNavItems.length) return;

    const normalizedStep = String(step);
    let found = false;

    servicePanels.forEach((panel, index) => {
      const panelStep = panel.getAttribute("data-step") || String(index + 1);
      const isActive = panelStep === normalizedStep;
      panel.classList.toggle("active", isActive);
      if (isActive) found = true;
    });

    serviceNavItems.forEach((item, index) => {
      const itemStep = item.getAttribute("data-step") || String(index + 1);
      const isActive = itemStep === normalizedStep;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
      item.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    currentServiceStep = normalizedStep;

    if (!found && servicePanels[0]) {
      const fallbackStep = servicePanels[0].getAttribute("data-step") || "1";
      if (fallbackStep !== normalizedStep) setActiveService(fallbackStep);
    }
  }

  function isDesktopServiceScroll() {
    return window.innerWidth > 920;
  }

  function getServiceIndex(step) {
    const normalizedStep = String(step);
    const index = servicePanels.findIndex((panel, i) => {
      const panelStep = panel.getAttribute("data-step") || String(i + 1);
      return panelStep === normalizedStep;
    });
    return index >= 0 ? index : 0;
  }

  function recalcServiceMetrics() {
    if (!servicesTrack || !servicePanels.length) return;

    if (!isDesktopServiceScroll()) {
      servicesTrack.style.height = "auto";
      serviceMetrics.start = 0;
      serviceMetrics.range = 1;
      serviceMetrics.end = 1;
      return;
    }

    servicesTrack.style.height = `${Math.max(520, servicePanels.length * 118)}vh`;
    const rect = servicesTrack.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const viewport = window.innerHeight;
    const headerSpace = (header ? header.offsetHeight : 0) + 22;

    serviceMetrics.start = absoluteTop - headerSpace;
    serviceMetrics.range = Math.max(servicesTrack.offsetHeight - viewport * 0.86, 1);
    serviceMetrics.end = serviceMetrics.start + serviceMetrics.range;
  }

  function isWithinServiceScrollRange() {
    const viewportPad = window.innerHeight * 0.9;
    const y = window.scrollY;
    return y >= (serviceMetrics.start - viewportPad) && y <= (serviceMetrics.end + viewportPad);
  }

  function getServiceStepFromScroll() {
    if (!servicePanels.length) return "1";
    const raw = (window.scrollY - serviceMetrics.start) / serviceMetrics.range;
    const progress = Math.max(0, Math.min(1, raw));
    const index = Math.min(servicePanels.length - 1, Math.floor(progress * servicePanels.length));
    return String(index + 1);
  }

  function syncServiceFromScroll() {
    if (!isDesktopServiceScroll() || !servicesTrack || !servicePanels.length) return;
    if (!isWithinServiceScrollRange()) return;
    const step = getServiceStepFromScroll();
    if (step !== currentServiceStep) setActiveService(step);
  }

  function onServiceScroll() {
    if (serviceTicking) return;
    serviceTicking = true;
    window.requestAnimationFrame(() => {
      syncServiceFromScroll();
      serviceTicking = false;
    });
  }

  function onServiceResize() {
    if (serviceResizeTicking) return;
    serviceResizeTicking = true;
    window.requestAnimationFrame(() => {
      recalcServiceMetrics();
      syncServiceFromScroll();
      serviceResizeTicking = false;
    });
  }

  function goToService(step, behavior = "smooth") {
    const normalizedStep = String(step);
    if (!servicePanels.length) return;

    if (!isDesktopServiceScroll() || !servicesTrack) {
      setActiveService(normalizedStep);
      return;
    }

    setActiveService(normalizedStep);
    const index = getServiceIndex(normalizedStep);
    const segment = serviceMetrics.range / servicePanels.length;
    const target = serviceMetrics.start + (segment * index) + 2;
    window.scrollTo({ top: target, behavior });
  }

  if (servicePanels.length && serviceNavItems.length) {
    const initialStep =
      serviceNavItems.find((item) => item.classList.contains("active"))?.getAttribute("data-step") ||
      servicePanels.find((panel) => panel.classList.contains("active"))?.getAttribute("data-step") ||
      servicePanels[0].getAttribute("data-step") ||
      "1";

    setActiveService(initialStep);
    recalcServiceMetrics();
    syncServiceFromScroll();

    serviceNavItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        const step = item.getAttribute("data-step") || String(index + 1);
        goToService(step);
      });

      item.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();

        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (index + direction + serviceNavItems.length) % serviceNavItems.length;
        const nextItem = serviceNavItems[nextIndex];
        const nextStep = nextItem.getAttribute("data-step") || String(nextIndex + 1);

        goToService(nextStep);
        nextItem.focus();
      });
    });

    window.addEventListener("scroll", onServiceScroll, { passive: true });
    window.addEventListener("resize", onServiceResize);
    window.addEventListener("orientationchange", onServiceResize);
    window.addEventListener("load", () => {
      recalcServiceMetrics();
      syncServiceFromScroll();
    });
  }

  const heroCard = doc.querySelector(".hero-card");
  const heroLanyard = doc.getElementById("heroLanyard");
  const lanyardCard = heroLanyard?.querySelector(".lanyard-card");
  if (heroCard && heroLanyard && lanyardCard) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const BASE_ANCHOR_Y = 18;
    const LEFT_ANCHOR_X = -18;
    const RIGHT_ANCHOR_X = 16;
    const ATTACH_OFFSET_X = 28;
    const ATTACH_OFFSET_Y = 2;
    const LIMIT_X = 154;
    const LIMIT_Y_MIN = -26;
    const LIMIT_Y_MAX = 214;

    const lanyardState = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: -2,
      av: 0,
      targetX: 0,
      targetY: 0,
      dragging: false,
      pointerId: null,
      grabOffsetX: 0,
      grabOffsetY: 0
    };

    let lanyardFrame = 0;
    let lanyardInView = true;
    let lanyardRunning = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function rotatePoint(x, y, radians) {
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      return { x: (x * cos) - (y * sin), y: (x * sin) + (y * cos) };
    }

    function getCardTop() {
      const top = Number.parseFloat(window.getComputedStyle(lanyardCard).top);
      return Number.isFinite(top) ? top : 92;
    }

    function updateLanyardStyles() {
      const cardTop = getCardTop();
      const angleRad = (lanyardState.angle * Math.PI) / 180;
      const leftAttach = rotatePoint(-ATTACH_OFFSET_X, ATTACH_OFFSET_Y, angleRad);
      const rightAttach = rotatePoint(ATTACH_OFFSET_X, ATTACH_OFFSET_Y, angleRad);

      const leftX = lanyardState.x + leftAttach.x;
      const leftY = cardTop + lanyardState.y + leftAttach.y;
      const rightX = lanyardState.x + rightAttach.x;
      const rightY = cardTop + lanyardState.y + rightAttach.y;

      const leftDx = leftX - LEFT_ANCHOR_X;
      const leftDy = leftY - BASE_ANCHOR_Y;
      const rightDx = rightX - RIGHT_ANCHOR_X;
      const rightDy = rightY - BASE_ANCHOR_Y;

      const leftLength = clamp(Math.hypot(leftDx, leftDy), 50, 306);
      const rightLength = clamp(Math.hypot(rightDx, rightDy), 50, 306);
      const leftAngle = (Math.atan2(leftDy, leftDx) * (180 / Math.PI)) - 90;
      const rightAngle = (Math.atan2(rightDy, rightDx) * (180 / Math.PI)) - 90;

      heroLanyard.style.setProperty("--lanyard-x", `${lanyardState.x.toFixed(2)}px`);
      heroLanyard.style.setProperty("--lanyard-y", `${lanyardState.y.toFixed(2)}px`);
      heroLanyard.style.setProperty("--lanyard-card-rotate", `${lanyardState.angle.toFixed(2)}deg`);
      heroLanyard.style.setProperty("--lanyard-shadow-x", `${(lanyardState.angle * 0.28).toFixed(2)}px`);
      heroLanyard.style.setProperty("--lanyard-shadow-y", `${(16 + Math.abs(lanyardState.angle * 0.22) + Math.abs(lanyardState.y * 0.06)).toFixed(2)}px`);
      heroLanyard.style.setProperty("--strap-left-length", `${leftLength.toFixed(2)}px`);
      heroLanyard.style.setProperty("--strap-right-length", `${rightLength.toFixed(2)}px`);
      heroLanyard.style.setProperty("--strap-left-angle", `${leftAngle.toFixed(2)}deg`);
      heroLanyard.style.setProperty("--strap-right-angle", `${rightAngle.toFixed(2)}deg`);
    }

    function updateDragTarget(event) {
      if (!lanyardState.dragging || event.pointerId !== lanyardState.pointerId) return;
      const zoneRect = heroLanyard.getBoundingClientRect();
      const baseCenterX = zoneRect.left + (zoneRect.width * 0.5);
      const baseCenterY = zoneRect.top + getCardTop();

      const desiredX = event.clientX - lanyardState.grabOffsetX - baseCenterX;
      const desiredY = event.clientY - lanyardState.grabOffsetY - baseCenterY;
      lanyardState.targetX = clamp(desiredX, -LIMIT_X, LIMIT_X);
      lanyardState.targetY = clamp(desiredY, LIMIT_Y_MIN, LIMIT_Y_MAX);
    }

    function endDrag(event) {
      if (!lanyardState.dragging) return;
      if (event && lanyardState.pointerId !== null && event.pointerId !== lanyardState.pointerId) return;

      if (event && lanyardCard.releasePointerCapture) {
        try {
          lanyardCard.releasePointerCapture(event.pointerId);
        } catch (error) {
          // Ignore release errors when capture was already cleared.
        }
      }

      lanyardState.dragging = false;
      lanyardState.pointerId = null;
      lanyardState.targetX = clamp(lanyardState.targetX * 0.35, -38, 38);
      lanyardState.targetY = 0;
      heroLanyard.classList.remove("is-dragging");
    }

    function startLanyardLoop() {
      if (lanyardRunning) return;
      lanyardRunning = true;
      lanyardFrame = window.requestAnimationFrame(animateLanyard);
    }

    function stopLanyardLoop() {
      if (!lanyardRunning) return;
      lanyardRunning = false;
      if (lanyardFrame) window.cancelAnimationFrame(lanyardFrame);
      lanyardFrame = 0;
    }

    function syncLanyardState() {
      if (lanyardInView && !document.hidden) startLanyardLoop();
      else stopLanyardLoop();
    }

    function animateLanyard(now = 0) {
      if (!lanyardRunning) return;

      if (!lanyardState.dragging) {
        const idleX = Math.sin(now * 0.00055) * (reduceMotion ? 0.6 : 2.8);
        const idleY = Math.cos((now * 0.00046) + 0.9) * (reduceMotion ? 0.3 : 1.2);
        lanyardState.targetX += (idleX - lanyardState.targetX) * 0.03;
        lanyardState.targetY += (idleY - lanyardState.targetY) * 0.03;
      }

      const springX = lanyardState.dragging ? 0.3 : (reduceMotion ? 0.045 : 0.062);
      const springY = lanyardState.dragging ? 0.28 : (reduceMotion ? 0.04 : 0.056);
      const damping = lanyardState.dragging ? 0.8 : (reduceMotion ? 0.9 : 0.94);

      lanyardState.vx += (lanyardState.targetX - lanyardState.x) * springX;
      lanyardState.vy += (lanyardState.targetY - lanyardState.y) * springY;
      lanyardState.vx *= damping;
      lanyardState.vy *= damping;
      lanyardState.x += lanyardState.vx;
      lanyardState.y += lanyardState.vy;

      const idleAngle = -2 + (Math.sin(now * 0.00072) * (reduceMotion ? 0.4 : 1.15));
      const angleTarget = lanyardState.dragging
        ? clamp((lanyardState.x * 0.12) + (lanyardState.vx * 4.4), -28, 28)
        : clamp(idleAngle + (lanyardState.x * 0.08) + (lanyardState.vx * 3.2), -18, 18);
      lanyardState.av += (angleTarget - lanyardState.angle) * (lanyardState.dragging ? 0.24 : 0.14);
      lanyardState.av *= lanyardState.dragging ? 0.78 : 0.84;
      lanyardState.angle += lanyardState.av;

      updateLanyardStyles();

      lanyardFrame = window.requestAnimationFrame(animateLanyard);
    }

    lanyardCard.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const cardRect = lanyardCard.getBoundingClientRect();
      lanyardState.dragging = true;
      lanyardState.pointerId = event.pointerId;
      lanyardState.grabOffsetX = event.clientX - (cardRect.left + (cardRect.width * 0.5));
      lanyardState.grabOffsetY = event.clientY - (cardRect.top + 14);
      heroLanyard.classList.add("is-dragging");
      if (lanyardCard.setPointerCapture) lanyardCard.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    window.addEventListener("pointermove", updateDragTarget, { passive: true });
    window.addEventListener("pointerup", endDrag, { passive: true });
    window.addEventListener("pointercancel", endDrag, { passive: true });
    window.addEventListener("blur", () => {
      endDrag();
    });

    if ("IntersectionObserver" in window) {
      const lanyardObserver = new IntersectionObserver(
        (entries) => {
          lanyardInView = entries.some((entry) => entry.isIntersecting);
          syncLanyardState();
        },
        { threshold: 0.08 }
      );
      lanyardObserver.observe(heroCard);
    }

    updateLanyardStyles();
    syncLanyardState();
    document.addEventListener("visibilitychange", syncLanyardState);
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!formStatus) return;

      formStatus.textContent = "Thanks. Your request has been captured. We will contact you shortly.";
      form.reset();
    });
  }
})();
