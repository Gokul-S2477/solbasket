(function () {
  const doc = document;
  const root = doc.documentElement;
  const progressBar = doc.getElementById("progress-bar");
  const header = doc.querySelector(".site-header");
  const navLinks = doc.getElementById("navLinks");
  const menuToggle = doc.getElementById("menuToggle");
  const cursorGlow = doc.querySelector(".cursor-glow");
  const yearEl = doc.getElementById("year");
  const themeToggle = doc.getElementById("themeToggle");
  const themeIcon = doc.getElementById("themeIcon");
  const themeLabel = doc.getElementById("themeLabel");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const STORAGE_KEY = "solbasket_theme";
  const initialTheme = localStorage.getItem(STORAGE_KEY) || "light";
  root.setAttribute("data-theme", initialTheme);
  updateThemeButton(initialTheme);

  function updateThemeButton(theme) {
    if (!themeIcon || !themeLabel) return;
    if (theme === "dark") {
      themeIcon.textContent = "☀";
      themeLabel.textContent = "Light";
    } else {
      themeIcon.textContent = "◐";
      themeLabel.textContent = "Dark";
    }
  }

  function emitThemeChange(theme) {
    window.dispatchEvent(new CustomEvent("solbasket:theme", { detail: { theme } }));
  }

  emitThemeChange(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
      updateThemeButton(next);
      emitThemeChange(next);
    });
  }

  function updateHeaderAndProgress() {
    const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
    const scrollHeight = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (header) header.classList.toggle("scrolled", scrollTop > 54);
  }

  window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });
  updateHeaderAndProgress();

  if (cursorGlow && !prefersReducedMotion) {
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;

    window.addEventListener("mousemove", (event) => {
      tx = event.clientX;
      ty = event.clientY;
    });

    function animateCursor() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      cursorGlow.style.left = `${cx}px`;
      cursorGlow.style.top = `${cy}px`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();
  }

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
  }

  doc.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = doc.querySelector(href);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  const sections = [...doc.querySelectorAll("main section[id]")];
  const navAnchors = [...doc.querySelectorAll(".nav-links a")];
  if (sections.length && navAnchors.length) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          const targetId = entry.target.classList.contains("service-section") ? "services" : id;
          navAnchors.forEach((a) => {
            const active = a.getAttribute("href") === `#${targetId}`;
            a.classList.toggle("active", active);
          });
        });
      },
      { threshold: 0.48 }
    );

    sections.forEach((section) => activeObserver.observe(section));
  }

  doc.querySelectorAll(".magnetic").forEach((item) => {
    item.addEventListener("mousemove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });

    item.addEventListener("mouseleave", () => {
      item.style.transform = "translate(0, 0)";
    });
  });

  const tiltCards = doc.querySelectorAll(".tilt-card, .hero-stats article, .visual");
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      if (prefersReducedMotion) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 6;
      const ry = (px - 0.5) * 7;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  const webDemo = doc.getElementById("webLiveDemo");
  if (webDemo && !prefersReducedMotion) {
    const pointer = doc.getElementById("demoPointer");
    const clickFx = doc.getElementById("demoClick");
    const navItems = [...webDemo.querySelectorAll(".demo-nav-item")];
    const targets = [...webDemo.querySelectorAll(".demo-target")];
    const views = [...webDemo.querySelectorAll(".demo-view")];
    const sequence = [...navItems, ...targets.slice(0, 6)];
    let idx = 0;

    function moveDemoPointer(targetEl) {
      if (!pointer || !clickFx || !targetEl) return;
      const demoRect = webDemo.getBoundingClientRect();
      const rect = targetEl.getBoundingClientRect();
      const x = rect.left - demoRect.left + rect.width * 0.52;
      const y = rect.top - demoRect.top + rect.height * 0.52;

      pointer.style.left = `${x}px`;
      pointer.style.top = `${y}px`;

      clickFx.style.left = `${x + 4}px`;
      clickFx.style.top = `${y + 4}px`;
      clickFx.classList.remove("pulse");
      void clickFx.offsetWidth;
      clickFx.classList.add("pulse");
    }

    function activateDemoItem(targetEl) {
      if (!targetEl) return;
      navItems.forEach((item) => item.classList.remove("active"));
      targets.forEach((item) => item.classList.remove("is-clicked"));

      if (targetEl.classList.contains("demo-nav-item")) {
        targetEl.classList.add("active");
        const view = targetEl.getAttribute("data-view");
        views.forEach((section) => section.classList.toggle("active", section.getAttribute("data-view") === view));
      }
      if (targetEl.classList.contains("demo-target")) targetEl.classList.add("is-clicked");
    }

    moveDemoPointer(sequence[0]);
    activateDemoItem(sequence[0]);

    window.setInterval(() => {
      const targetEl = sequence[idx % sequence.length];
      moveDemoPointer(targetEl);
      activateDemoItem(targetEl);
      idx += 1;
    }, 1250);
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".hero .tag", { y: 24, opacity: 0, duration: 0.7 })
      .from(".hero h1", { y: 36, opacity: 0, duration: 0.95 }, "-=0.42")
      .from(".hero-copy > p:not(.tag)", { y: 24, opacity: 0, duration: 0.82 }, "-=0.58")
      .from(".hero-actions .btn", { y: 16, opacity: 0, duration: 0.64, stagger: 0.1, ease: "power2.out" }, "-=0.45")
      .from(".hero-stats article", { y: 16, opacity: 0, duration: 0.58, stagger: 0.08, ease: "power2.out" }, "-=0.36")
      .from(".hero-visual", { x: 30, opacity: 0, duration: 0.9 }, "-=0.9");

    doc.querySelectorAll("[data-reveal]").forEach((node) => {
      // Hero elements already have a dedicated intro timeline; skip shared reveal
      // to avoid double-animation states that can hide the visual after load.
      if (node.closest(".hero")) return;

      const mode = node.getAttribute("data-reveal");
      const from = { opacity: 0, y: 28 };
      if (mode === "fade-left") from.x = 30;
      if (mode === "fade-right") from.x = -30;
      if (mode === "fade-up") from.y = 16;

      gsap.fromTo(node, from, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.86,
        ease: "power3.out",
        scrollTrigger: {
          trigger: node,
          start: "top 87%",
          toggleActions: "play none none reverse"
        }
      });
    });

    gsap.utils.toArray(".bar-fill").forEach((bar) => {
      const fill = Number(bar.getAttribute("data-fill") || 0);
      gsap.to(bar, {
        width: `${fill}%`,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bar,
          start: "top 88%"
        }
      });
    });
  }

  const counters = doc.querySelectorAll(".counter");
  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.getAttribute("data-target") || 0);
          const start = performance.now();
          const duration = 1200;

          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.floor(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          obs.unobserve(el);
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  const liveValues = doc.querySelectorAll(".live-value");
  liveValues.forEach((node) => {
    const start = Number(node.getAttribute("data-start") || 50);
    const max = Number(node.getAttribute("data-max") || 95);
    let value = start;
    node.textContent = String(value);

    window.setInterval(() => {
      const delta = Math.random() > 0.5 ? 1 : -1;
      value = Math.max(start - 6, Math.min(max, value + delta));
      node.textContent = String(value);
    }, 1300 + Math.floor(Math.random() * 700));
  });

  const hero = doc.querySelector(".hero");
  const heroCopy = doc.querySelector(".hero-copy");
  if (hero && heroCopy && !prefersReducedMotion) {
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;

    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      tx = (event.clientX - rect.left - rect.width / 2) / rect.width;
      ty = (event.clientY - rect.top - rect.height / 2) / rect.height;
    });

    hero.addEventListener("mouseleave", () => {
      tx = 0;
      ty = 0;
    });

    function animateHero() {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      heroCopy.style.transform = `translate3d(${x * 10}px, ${y * 8}px, 0)`;
      requestAnimationFrame(animateHero);
    }

    animateHero();
  }

  const form = doc.getElementById("contactForm");
  const statusEl = doc.getElementById("formStatus");
  if (form && statusEl) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector(".submit-btn");
      if (submitBtn) submitBtn.textContent = "Sending...";

      window.setTimeout(() => {
        statusEl.textContent = "Message sent successfully. We will connect with you shortly.";
        statusEl.classList.add("show");
        if (submitBtn) submitBtn.textContent = "Request Sent";

        window.setTimeout(() => {
          form.reset();
          if (submitBtn) submitBtn.textContent = "Send Proposal Request";
        }, 900);
      }, 700);
    });
  }
})();
