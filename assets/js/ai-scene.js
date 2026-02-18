(function () {
  const zone = document.querySelector("[data-ai-character-zone]");
  const buddy = document.getElementById("aiBuddy");
  if (!zone || !buddy) return;

  const eyePairs = [...buddy.querySelectorAll("[data-eye]")]
    .map((eye) => ({
      eye,
      pupil: eye.querySelector("[data-pupil]")
    }))
    .filter((item) => item.pupil);

  if (!eyePairs.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    active: false
  };
  const targetOffsets = eyePairs.map(() => ({ x: 0, y: 0 }));
  const currentOffsets = eyePairs.map(() => ({ x: 0, y: 0 }));
  const headTilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const REACTIONS = ["is-happy", "is-surprised", "is-curious", "is-excited"];
  const MAX_TRAVEL = 9;
  const ACTIVE_EASE = prefersReducedMotion ? 0.16 : 0.24;
  const IDLE_EASE = prefersReducedMotion ? 0.12 : 0.18;
  const HEAD_EASE = prefersReducedMotion ? 0.12 : 0.16;
  const REACTION_DURATION = prefersReducedMotion ? 360 : 760;
  const BLINK_DURATION = 115;

  let reactionTimer = 0;
  let clickPopTimer = 0;
  let blinkTimer = 0;
  let blinkStepTimer = 0;
  let inView = true;
  let running = false;
  let frameId = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clearReactions() {
    REACTIONS.forEach((className) => buddy.classList.remove(className));
  }

  function triggerReaction(className) {
    clearReactions();
    buddy.classList.add(className);
    window.clearTimeout(reactionTimer);
    reactionTimer = window.setTimeout(() => {
      buddy.classList.remove(className);
    }, REACTION_DURATION);
  }

  function triggerClickReaction() {
    const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    triggerReaction(reaction);

    buddy.classList.add("is-click-pop");
    window.clearTimeout(clickPopTimer);
    clickPopTimer = window.setTimeout(() => {
      buddy.classList.remove("is-click-pop");
    }, 380);
  }

  function runBlinkSequence() {
    if (prefersReducedMotion) return;

    const totalBlinks = Math.random() > 0.7 ? 2 : 1;
    let pending = totalBlinks;

    const closeEye = () => {
      buddy.classList.add("is-blink");
      blinkStepTimer = window.setTimeout(() => {
        buddy.classList.remove("is-blink");
        pending -= 1;

        if (pending > 0) {
          blinkStepTimer = window.setTimeout(closeEye, 90);
        } else {
          scheduleBlink();
        }
      }, BLINK_DURATION);
    };

    closeEye();
  }

  function scheduleBlink() {
    if (prefersReducedMotion) return;
    window.clearTimeout(blinkTimer);
    blinkTimer = window.setTimeout(runBlinkSequence, 1800 + Math.random() * 2600);
  }

  function updateTargets() {
    eyePairs.forEach((item, index) => {
      const rect = item.eye.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;

      let tx = 0;
      let ty = 0;
      if (pointer.active) {
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const travel = Math.min(MAX_TRAVEL, dist * 0.2);
        tx = (dx / dist) * travel;
        ty = (dy / dist) * travel;
      }

      targetOffsets[index].x = tx;
      targetOffsets[index].y = ty;
    });

    if (pointer.active) {
      const rect = zone.getBoundingClientRect();
      const nx = clamp((pointer.x - (rect.left + rect.width * 0.5)) / (rect.width * 0.5), -1, 1);
      const ny = clamp((pointer.y - (rect.top + rect.height * 0.5)) / (rect.height * 0.5), -1, 1);
      headTilt.targetX = -ny * 7;
      headTilt.targetY = nx * 10;
    } else {
      headTilt.targetX = 0;
      headTilt.targetY = 0;
    }
  }

  function animate() {
    if (!running) return;

    updateTargets();
    const ease = pointer.active ? ACTIVE_EASE : IDLE_EASE;

    currentOffsets.forEach((offset, index) => {
      offset.x += (targetOffsets[index].x - offset.x) * ease;
      offset.y += (targetOffsets[index].y - offset.y) * ease;
      eyePairs[index].pupil.style.transform = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`;
    });

    headTilt.x += (headTilt.targetX - headTilt.x) * HEAD_EASE;
    headTilt.y += (headTilt.targetY - headTilt.y) * HEAD_EASE;
    buddy.style.setProperty("--head-tilt-x", `${headTilt.x}deg`);
    buddy.style.setProperty("--head-tilt-y", `${headTilt.y}deg`);

    frameId = window.requestAnimationFrame(animate);
  }

  function startLoop() {
    if (running) return;
    running = true;
    frameId = window.requestAnimationFrame(animate);
  }

  function stopLoop() {
    if (!running) return;
    running = false;
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function syncRunState() {
    if (inView && !document.hidden) startLoop();
    else stopLoop();
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "pointerdown",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      triggerClickReaction();
    },
    { passive: true }
  );

  window.addEventListener("blur", () => {
    pointer.active = false;
  });

  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) pointer.active = false;
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        syncRunState();
      },
      { threshold: 0.08 }
    );
    observer.observe(zone);
  }

  document.addEventListener("visibilitychange", syncRunState);

  scheduleBlink();
  syncRunState();
})();
