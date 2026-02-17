(function () {
  const canvas = document.getElementById("ai-canvas");
  if (!canvas || !window.THREE) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rootEl = document.documentElement;
  const host = canvas.closest("[data-ai-sphere-zone]") || canvas.parentElement || document.body;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
  camera.position.set(0, 0.2, 7.2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const root = new THREE.Group();
  scene.add(root);

  const ambient = new THREE.AmbientLight(0xdbe8ff, 0.85);
  const key = new THREE.PointLight(0x72b5ff, 1.25, 24);
  key.position.set(2.8, 2.2, 3.1);
  const rim = new THREE.PointLight(0xaf90ff, 0.95, 18);
  rim.position.set(-2.5, -1.8, 2.4);
  scene.add(ambient, key, rim);

  const coreMat = new THREE.MeshPhongMaterial({
    color: 0xe8f3ff,
    emissive: 0x5b96ff,
    emissiveIntensity: 0.5,
    shininess: 110,
    transparent: true,
    opacity: 0.95
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.06, 72, 72), coreMat);
  root.add(core);

  const shellMat = new THREE.MeshBasicMaterial({ color: 0xa7c8ff, wireframe: true, transparent: true, opacity: 0.18 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.22, 36, 36), shellMat);
  root.add(shell);

  function makeRing(radius, tube, color, xTilt, yTilt, opacity) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 24, 180), mat);
    mesh.rotation.x = xTilt;
    mesh.rotation.y = yTilt;
    return mesh;
  }

  const rings = [
    makeRing(1.84, 0.026, 0x6eaeff, Math.PI * 0.54, Math.PI * 0.07, 0.72),
    makeRing(2.2, 0.022, 0xa18dff, Math.PI * 0.22, Math.PI * 0.5, 0.66),
    makeRing(2.56, 0.018, 0x8cc3ff, Math.PI * 0.72, Math.PI * 0.26, 0.58)
  ];
  rings.forEach((r) => root.add(r));

  const particles = [];
  const particleGroup = new THREE.Group();
  root.add(particleGroup);

  for (let i = 0; i < 28; i += 1) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x7fb8ff : 0xb493ff, transparent: true, opacity: 0.86 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.022, 10, 10), mat);
    mesh.userData = {
      radius: 1.55 + Math.random() * 1.7,
      speed: 0.12 + Math.random() * 0.32,
      phase: Math.random() * Math.PI * 2,
      height: 0.42 + Math.random() * 0.45
    };
    particles.push(mesh);
    particleGroup.add(mesh);
  }

  const linkMaterial = new THREE.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.26 });
  const links = [];
  for (let i = 0; i < 10; i += 1) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geo, linkMaterial);
    links.push(line);
    root.add(line);
  }

  function glowTexture() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, "rgba(210,230,255,1)");
    grad.addColorStop(0.35, "rgba(145,194,255,0.72)");
    grad.addColorStop(0.75, "rgba(172,147,255,0.26)");
    grad.addColorStop(1, "rgba(172,147,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0.82, depthWrite: false }));
  glow.scale.set(5.6, 5.6, 1);
  root.add(glow);

  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  function applyTheme(theme) {
    const dark = theme === "dark";
    ambient.color.setHex(dark ? 0x94a9cf : 0xdbe8ff);
    key.color.setHex(dark ? 0x7aaeff : 0x72b5ff);
    rim.color.setHex(dark ? 0xb79dff : 0xaf90ff);
    coreMat.emissive.setHex(dark ? 0x6aa4ff : 0x5b96ff);
    shellMat.color.setHex(dark ? 0x88a8db : 0xa7c8ff);
    linkMaterial.color.setHex(dark ? 0x87abdf : 0x9fc4ff);
    rings[0].material.color.setHex(dark ? 0x78b2ff : 0x6eaeff);
    rings[1].material.color.setHex(dark ? 0xb09dff : 0xa18dff);
    rings[2].material.color.setHex(dark ? 0x9fd0ff : 0x8cc3ff);
  }

  applyTheme(rootEl.getAttribute("data-theme") || "light");
  window.addEventListener("solbasket:theme", (event) => {
    applyTheme(event.detail?.theme || "light");
  });

  function resize() {
    const w = host.clientWidth || 420;
    const h = host.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  if (host && !prefersReducedMotion) {
    host.addEventListener("mousemove", (event) => {
      const rect = host.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target.y = mouse.x * 0.24;
      target.x = -mouse.y * 0.14;
    });

    host.addEventListener("mouseleave", () => {
      target.x = 0;
      target.y = 0;
    });
  }

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();
    const motion = prefersReducedMotion ? 0.26 : 1;

    current.x += (target.x - current.x) * 0.045;
    current.y += (target.y - current.y) * 0.045;

    core.rotation.y += 0.0025 * motion;
    core.rotation.x += 0.0014 * motion;
    shell.rotation.y -= 0.0015 * motion;

    rings[0].rotation.z += 0.0032 * motion;
    rings[1].rotation.y -= 0.0028 * motion;
    rings[2].rotation.x += 0.0022 * motion;

    particles.forEach((p, i) => {
      const d = p.userData;
      const th = t * d.speed + d.phase;
      p.position.set(
        Math.cos(th) * d.radius,
        Math.sin(th * 1.4 + d.phase) * d.height,
        Math.sin(th) * d.radius
      );
      p.scale.setScalar(0.88 + Math.sin(t * 1.8 + i) * 0.14);
    });

    for (let i = 0; i < links.length; i += 1) {
      const a = particles[(i * 2) % particles.length].position;
      const b = particles[(i * 2 + 7) % particles.length].position;
      links[i].geometry.setFromPoints([a, b]);
    }

    const pulse = 1 + Math.sin(t * 1.9) * 0.04 * motion;
    core.scale.set(pulse, pulse, pulse);
    glow.material.opacity = 0.72 + Math.sin(t * 1.7) * 0.12;

    root.rotation.x = current.x + Math.sin(t * 0.45) * 0.028 * motion;
    root.rotation.y = current.y + Math.cos(t * 0.5) * 0.034 * motion;
    root.position.y = Math.sin(t * 0.72) * 0.14 * motion;

    camera.position.x += ((mouse.x * 0.16) - camera.position.x) * 0.03;
    camera.position.y += ((0.2 + mouse.y * 0.08) - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
})();
