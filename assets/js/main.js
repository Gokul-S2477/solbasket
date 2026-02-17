(function () {
  const doc = document;
  const header = doc.querySelector(".site-header");
  const navLinks = doc.getElementById("navLinks");
  const menuToggle = doc.getElementById("menuToggle");
  const yearEl = doc.getElementById("year");
  const form = doc.getElementById("contactForm");
  const formStatus = doc.getElementById("formStatus");
  const HEADER_SCROLL_ENTER = 28;
  const HEADER_SCROLL_EXIT = 14;

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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
  const serviceMetrics = { start: 0, range: 1 };
  let currentServiceStep = "1";
  let serviceTicking = false;

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
      return;
    }

    servicesTrack.style.height = `${Math.max(520, servicePanels.length * 118)}vh`;
    const rect = servicesTrack.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const viewport = window.innerHeight;
    const headerSpace = (header ? header.offsetHeight : 0) + 22;

    serviceMetrics.start = absoluteTop - headerSpace;
    serviceMetrics.range = Math.max(servicesTrack.offsetHeight - viewport * 0.86, 1);
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
    window.addEventListener("resize", () => {
      recalcServiceMetrics();
      syncServiceFromScroll();
    });
    window.addEventListener("load", () => {
      recalcServiceMetrics();
      syncServiceFromScroll();
    });
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
