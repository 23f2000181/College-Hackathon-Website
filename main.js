/* ═══════════════════════════════════════════════
   HackVerse — Main JavaScript
   Three.js 3D Scene + Animations + Interactions
   ═══════════════════════════════════════════════ */

import * as THREE from 'three';
import gsap from 'gsap';
import { supabase } from '/js/supabase.js';

// ─── THREE.JS 3D HERO SCENE ───
class HeroScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this.particles = [];
    this.rays = [];

    this.init();
    this.createGeometries();
    this.createRayBursts();
    this.createParticles();
    this.addListeners();
    this.animate();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();

    const parent = this.canvas.parentElement;
    const width = parent.clientWidth || 800;
    const height = parent.clientHeight || 800;

    // Camera
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.camera.position.z = window.innerWidth < 768 ? 9 : 6;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights — neon palette
    const ambientLight = new THREE.AmbientLight(0xf8f9fc, 0.6);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff00e4, 1.5, 20);
    pointLight1.position.set(3, 3, 3);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x33ccff, 1.5, 20);
    pointLight2.position.set(-3, -2, 4);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffd700, 1, 20);
    pointLight3.position.set(0, 4, 2);
    this.scene.add(pointLight3);
  }

  createGeometries() {
    this.geometryGroup = new THREE.Group();

    // Central Icosahedron — neon pink wireframe
    const icoGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const icoMat = new THREE.MeshPhongMaterial({
      color: 0xff00e4,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    this.icosahedron = new THREE.Mesh(icoGeo, icoMat);
    this.geometryGroup.add(this.icosahedron);

    // Inner glow sphere — cyan glow
    const glowGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const glowMat = new THREE.MeshPhongMaterial({
      color: 0x33ccff,
      transparent: true,
      opacity: 0.08,
      emissive: 0x33ccff,
      emissiveIntensity: 0.15,
    });
    this.glowSphere = new THREE.Mesh(glowGeo, glowMat);
    this.geometryGroup.add(this.glowSphere);

    // Orbiting Torus 1 — accent cyan
    const torusGeo1 = new THREE.TorusGeometry(2, 0.015, 16, 100);
    const torusMat1 = new THREE.MeshPhongMaterial({
      color: 0x33ccff,
      transparent: true,
      opacity: 0.3,
      emissive: 0x33ccff,
      emissiveIntensity: 0.1,
    });
    this.torus1 = new THREE.Mesh(torusGeo1, torusMat1);
    this.torus1.rotation.x = Math.PI / 3;
    this.torus1.rotation.y = Math.PI / 6;
    this.geometryGroup.add(this.torus1);

    // Orbiting Torus 2 — golden yellow
    const torusGeo2 = new THREE.TorusGeometry(2.5, 0.01, 16, 100);
    const torusMat2 = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.2,
      emissive: 0xffd700,
      emissiveIntensity: 0.08,
    });
    this.torus2 = new THREE.Mesh(torusGeo2, torusMat2);
    this.torus2.rotation.x = -Math.PI / 4;
    this.torus2.rotation.z = Math.PI / 5;
    this.geometryGroup.add(this.torus2);

    // Small floating octahedrons — neon palette
    this.smallShapes = [];
    const smallColors = [0xff00e4, 0x33ccff, 0xffd700, 0x00e49f, 0xa855f7];
    for (let i = 0; i < 12; i++) {
      const size = 0.05 + Math.random() * 0.1;
      const geo = Math.random() > 0.5
        ? new THREE.OctahedronGeometry(size)
        : new THREE.TetrahedronGeometry(size);
      const mat = new THREE.MeshPhongMaterial({
        color: smallColors[i % smallColors.length],
        transparent: true,
        opacity: 0.4,
        emissive: smallColors[i % smallColors.length],
        emissiveIntensity: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);

      const angle = (i / 12) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 1.5;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * radius * 0.5 - 1
      );

      mesh.userData = {
        basePos: mesh.position.clone(),
        speed: 0.5 + Math.random() * 1.5,
        amplitude: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      };

      this.smallShapes.push(mesh);
      this.geometryGroup.add(mesh);
    }

    this.geometryGroup.position.set(0, 0.2, 0);
    this.scene.add(this.geometryGroup);
  }

  createRayBursts() {
    // Subtle ray lines radiating outward — neon tones
    const rayGroup = new THREE.Group();
    const rayColors = [0xff00e4, 0x33ccff, 0xffd700, 0xa855f7, 0x00e49f];

    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const length = 1.5 + Math.random() * 3;
      const startDist = 1.5 + Math.random() * 0.5;

      const startX = Math.cos(angle) * startDist;
      const startY = Math.sin(angle) * startDist;
      const endX = Math.cos(angle) * (startDist + length);
      const endY = Math.sin(angle) * (startDist + length);

      const points = [
        new THREE.Vector3(startX, startY, -2 + Math.random() * 0.5),
        new THREE.Vector3(endX, endY, -2 + Math.random() * 0.5),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: rayColors[i % rayColors.length],
        transparent: true,
        opacity: 0.08 + Math.random() * 0.12,
        linewidth: 1,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = {
        baseOpacity: material.opacity,
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      };

      this.rays.push(line);
      rayGroup.add(line);
    }

    this.scene.add(rayGroup);
  }

  createParticles() {
    // Floating particles — neon palette
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color(0xff00e4),
      new THREE.Color(0x33ccff),
      new THREE.Color(0xffd700),
      new THREE.Color(0x00e49f),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = 2 + Math.random() * 4;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particleSystem);
  }

  addListeners() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      this.camera.aspect = width / height;
      this.camera.position.z = window.innerWidth < 768 ? 9 : 6;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();

    // Smooth mouse follow
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    // Rotate main shapes
    if (this.icosahedron) {
      this.icosahedron.rotation.x = elapsed * 0.15 + this.mouse.y * 0.3;
      this.icosahedron.rotation.y = elapsed * 0.2 + this.mouse.x * 0.3;
    }

    if (this.glowSphere) {
      this.glowSphere.rotation.y = elapsed * 0.1;
      const pulse = Math.sin(elapsed * 2) * 0.05;
      this.glowSphere.scale.setScalar(1 + pulse);
    }

    // Orbit torus rings
    if (this.torus1) {
      this.torus1.rotation.z = elapsed * 0.3;
    }
    if (this.torus2) {
      this.torus2.rotation.y = elapsed * 0.2;
    }

    // Float small shapes
    this.smallShapes.forEach((mesh) => {
      const d = mesh.userData;
      mesh.position.y = d.basePos.y + Math.sin(elapsed * d.speed + d.phase) * d.amplitude;
      mesh.rotation.x = elapsed * d.speed * 0.5;
      mesh.rotation.z = elapsed * d.speed * 0.3;
    });

    // Animate rays opacity
    this.rays.forEach((line) => {
      const d = line.userData;
      line.material.opacity = d.baseOpacity * (0.5 + 0.5 * Math.sin(elapsed * d.speed + d.phase));
    });

    // Float particles
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(elapsed * 2 + i) * 0.01;
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
      this.particleSystem.rotation.y = elapsed * 0.02;
    }

    // Parallax camera movement
    this.geometryGroup.rotation.y = this.mouse.x * 0.3;
    this.geometryGroup.rotation.x = this.mouse.y * 0.15;

    this.renderer.render(this.scene, this.camera);
  }
}

// ─── NAVBAR SCROLL EFFECT ───
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      menuBtn.classList.toggle('active');
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        menuBtn.classList.remove('active');
      });
    });
  }
}

// ─── SCROLL REVEAL ANIMATIONS ───
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-item, .dept-card, .about-float-card');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Staggered reveal
          const el = entry.target;
          const siblings = Array.from(el.parentElement?.children || []);
          const siblingIndex = siblings.indexOf(el);
          const delay = siblingIndex * 100;

          setTimeout(() => {
            el.classList.add('revealed');
          }, delay);

          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

// ─── STAT COUNTER ANIMATION ───
function initStatCounters() {
  const stats = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((stat) => observer.observe(stat));
}

function animateCounter(el, target) {
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ─── SMOOTH ANCHOR SCROLL ───
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.getElementById('navbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

// ─── MIND BLOWING TITLE AND HERO PAGE REVEAL ───
function initMindBlowingTitleReveal() {
  const title = document.getElementById('main-title');
  if (!title) return;

  const text = title.textContent;
  title.innerHTML = '';
  title.style.opacity = 1;
  title.style.transform = 'none';
  title.style.filter = 'none';
  
  const spanArr = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const span = document.createElement('span');
    if (char === ' ') {
      span.innerHTML = '&nbsp;';
      span.style.display = 'inline-block';
    } else {
      span.textContent = char;
      span.style.display = 'inline-block';
      if (i >= 10) span.classList.add('is-gradient');
    }
    title.appendChild(span);
    spanArr.push(span);
  }

  // Set initial 3D transform for individual letters
  gsap.set(spanArr, {
    opacity: 0,
    scale: 4,
    z: 200,
    rotationX: () => Math.random() * 500 - 250,
    rotationY: () => Math.random() * 500 - 250,
    y: () => (Math.random() - 0.5) * 600,
    x: () => (Math.random() - 0.5) * 600,
    filter: 'blur(20px)'
  });

  const tl = gsap.timeline({
    onComplete: () => {
      // Begin Hero Page Reveal
      document.body.classList.remove('loading');
      const entranceTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      entranceTl
        .to(['#navbar', '.marquee-container'], { opacity: 1, duration: 1 })
        .to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .to('.hero-tagline', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .to('.hero-stats', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .to(['#departments', '#features', '#about', '.cta', 'footer'], { opacity: 1, duration: 1 }, '-=0.8');
    }
  });

  // Small initial delay so canvas can render before insane explosion
  tl.to(spanArr, {
    delay: 0.8,
    duration: 1.5,
    opacity: 1,
    scale: 1,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    ease: 'expo.out',
    stagger: 0.08,
  });

  // Make it glow hard
  tl.to(spanArr, {
    duration: 1.2,
    textShadow: '0 0 25px rgba(255, 106, 0, 0.9)',
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 1
  }, '-=0.5');
}

// ─── CARD TILT EFFECT ───
function initCardTilt() {
  const cards = document.querySelectorAll('[data-tilt]');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// ─── SECTION LABEL ANIMATIONS ───
function initSectionLabels() {
  const labels = document.querySelectorAll('.section-label');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.from(entry.target, {
            opacity: 0,
            x: -20,
            duration: 0.6,
            ease: 'power2.out',
          });

          const title = entry.target.nextElementSibling;
          const subtitle = title?.nextElementSibling;

          if (title?.classList.contains('section-title')) {
            gsap.from(title, {
              opacity: 0,
              y: 20,
              duration: 0.7,
              ease: 'power2.out',
              delay: 0.15,
            });
          }
          if (subtitle?.classList.contains('section-subtitle') || subtitle?.classList.contains('about-desc')) {
            gsap.from(subtitle, {
              opacity: 0,
              y: 15,
              duration: 0.6,
              ease: 'power2.out',
              delay: 0.3,
            });
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  labels.forEach((label) => observer.observe(label));
}

// ─── DYNAMIC STATS FROM SUPABASE ───
async function loadDynamicStats() {
  try {
    // Fetch team count
    const { count: teamCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    // Update participants stat (teams * 4)
    const participantEl = document.getElementById('stat-participants');
    if (participantEl && teamCount !== null) {
      participantEl.dataset.count = teamCount * 4;
    }

    // Fetch PS counts per department
    const { data: allPS } = await supabase
      .from('problem_statements')
      .select('department');

    if (allPS) {
      // Count per dept
      const deptCounts = {};
      allPS.forEach((ps) => {
        deptCounts[ps.department] = (deptCounts[ps.department] || 0) + 1;
      });

      // Update department cards
      document.querySelectorAll('.dept-problems[data-dept]').forEach((el) => {
        const dept = el.dataset.dept;
        const count = deptCounts[dept] || 0;
        el.textContent = `${count} Problem${count !== 1 ? 's' : ''}`;
      });

      // Update total PS stat in hero
      const psEl = document.getElementById('stat-ps');
      if (psEl) {
        psEl.dataset.count = allPS.length;
      }
    }
  } catch (e) {
    // Fallback: just show static values
    document.querySelectorAll('.dept-problems[data-dept]').forEach((el) => {
      el.textContent = '5 Problems';
    });
  }
}

// ─── SCROLL SPY — HIGHLIGHT ACTIVE NAV LINK ───
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove('active'));
          const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    },
    { threshold: 0.15, rootMargin: '-100px 0px -50% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

// ─── RULES & FAQ MODAL ───
function initRulesModal() {
  const openBtn = document.getElementById('open-rules-modal');
  const closeBtn = document.getElementById('close-rules-modal');
  const overlay = document.getElementById('rules-modal');
  if (!openBtn || !overlay) return;

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });
}

// ─── INITIALIZE EVERYTHING ───
document.addEventListener('DOMContentLoaded', async () => {
  await loadDynamicStats();
  new HeroScene('hero-canvas-tl');
  new HeroScene('hero-canvas-br');
  initNavbar();
  initScrollReveal();
  initStatCounters();
  initSmoothScroll();
  initMindBlowingTitleReveal();
  initCardTilt();
  initSectionLabels();
  initScrollSpy();
  initRulesModal();

  // Department cards → redirect to login
  document.querySelectorAll('.dept-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.href = '/login.html';
    });
  });
});

