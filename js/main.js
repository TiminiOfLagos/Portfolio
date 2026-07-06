/* ============================================================
   Oluwadamilola Salami — Portfolio 2026
   GSAP (ScrollTrigger + SplitText) · Three.js hero · Lenis
   ============================================================ */

document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ------------------------------------------------------------
   Smooth scroll (Lenis) — desktop only, skipped for reduced motion
------------------------------------------------------------ */
let lenis = null;
if (!prefersReducedMotion && typeof Lenis !== "undefined") {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    });
  });
}

/* ------------------------------------------------------------
   Three.js hero — flowing noise gradient shader
------------------------------------------------------------ */
(function initHero() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || prefersReducedMotion) return;

  // Three.js loads lazily; on any failure the CSS gradient fallback stays visible.
  import("https://unpkg.com/three@0.165.0/build/three.module.js")
    .then((THREE) => startHero(THREE))
    .catch(() => {});

  function startHero(THREE) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  } catch (err) {
    return; // CSS gradient fallback stays visible
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2 uRes;
      uniform vec2 uMouse;

      // --- simplex-ish value noise + fbm ---
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
          mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
          u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = p * 2.03 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        vec2 p = uv;
        p.x *= uRes.x / uRes.y;

        float t = uTime * 0.055;

        // domain-warped fbm for silky flow
        vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t * 0.7 + 4.2));
        vec2 r = vec2(fbm(p * 1.4 + q * 1.6 + vec2(1.7, 9.2) + t * 0.6),
                      fbm(p * 1.4 + q * 1.6 + vec2(8.3, 2.8) - t * 0.4));
        float f = fbm(p * 1.4 + r * 1.8);

        // mouse warmth
        float m = 1.0 - smoothstep(0.0, 0.75, distance(uv, uMouse));

        vec3 base   = vec3(0.043, 0.039, 0.035);              // #0b0a09
        vec3 ember  = vec3(1.0, 0.357, 0.137);                // #ff5b23
        vec3 violet = vec3(0.24, 0.18, 0.48);
        vec3 cream  = vec3(0.95, 0.93, 0.90);

        vec3 col = base;
        col = mix(col, violet, smoothstep(0.25, 0.85, f) * 0.5);
        col = mix(col, ember, smoothstep(0.55, 0.95, f + q.x * 0.3) * 0.55);
        col += ember * m * 0.12;
        col += cream * smoothstep(0.82, 1.0, f) * 0.08;

        // vignette
        float vig = smoothstep(1.25, 0.35, distance(uv, vec2(0.5, 0.45)));
        col *= mix(0.55, 1.0, vig);

        // film grain
        float grain = (fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.035;
        col += grain;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const mouseTarget = new THREE.Vector2(0.5, 0.5);
  if (isFinePointer) {
    window.addEventListener("pointermove", (e) => {
      mouseTarget.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    }, { passive: true });
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  }
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let inView = true;
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0 })
    .observe(canvas);

  renderer.setAnimationLoop(() => {
    if (!inView || document.hidden) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(mouseTarget, 0.045);
    renderer.render(scene, camera);
  });
  }
})();

/* ------------------------------------------------------------
   Preloader → hero intro timeline
------------------------------------------------------------ */
(function initIntro() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return; // secondary pages have no preloader/hero intro
  const count = document.getElementById("preloaderCount");
  const heroLines = document.querySelectorAll("[data-hero-line]");
  const heroFades = document.querySelectorAll("[data-hero-fade]");

  // wrap hero title lines for mask reveal
  heroLines.forEach((line) => {
    const inner = document.createElement("span");
    inner.className = "line-inner";
    inner.innerHTML = line.innerHTML;
    line.innerHTML = "";
    line.appendChild(inner);
  });
  const heroInners = document.querySelectorAll(".hero__title-line .line-inner");

  if (prefersReducedMotion) {
    preloader.remove();
    return;
  }

  gsap.set(heroInners, { yPercent: 110 });

  const tl = gsap.timeline();
  const counter = { v: 0 };

  tl.to(".preloader__line", { y: 0, duration: 0.9, stagger: 0.12, ease: "power4.out" })
    .to(counter, {
      v: 100, duration: 1.1, ease: "power2.inOut",
      onUpdate: () => { count.textContent = Math.round(counter.v); },
    }, 0)
    .to(".preloader__line", { y: "-110%", duration: 0.7, stagger: 0.08, ease: "power3.in" }, ">-0.1")
    .to(preloader, {
      yPercent: -100, duration: 0.9, ease: "power4.inOut",
      onComplete: () => preloader.remove(),
    }, ">-0.25")
    .to(heroInners, { yPercent: 0, duration: 1.3, stagger: 0.14, ease: "power4.out" }, "<0.35")
    .to(heroFades, { opacity: 1, duration: 1.1, stagger: 0.12, ease: "power2.out" }, "<0.4");
})();

/* ------------------------------------------------------------
   Scroll reveals
------------------------------------------------------------ */
if (!prefersReducedMotion) {
  // generic reveals
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // about statement — word-by-word color scrub (after fonts load so
  // line-breaking is measured against the real typefaces)
  const statement = document.getElementById("aboutStatement");
  if (statement) {
    document.fonts.ready.then(() => {
      const split = new SplitText(statement, { type: "words", wordsClass: "w" });
      gsap.fromTo(split.words,
        { opacity: 0.14 },
        {
          opacity: 1, stagger: 0.06, ease: "none",
          scrollTrigger: { trigger: statement, start: "top 78%", end: "bottom 45%", scrub: true },
        });
      ScrollTrigger.refresh();
    });
  }

  // stat counters
  document.querySelectorAll(".stat__num").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });

  // work cards slide in
  gsap.utils.toArray(".work__card").forEach((item, i) => {
    gsap.from(item, {
      opacity: 0, y: 50, duration: 0.9, ease: "power3.out", delay: (i % 2) * 0.08,
      scrollTrigger: { trigger: item, start: "top 92%" },
    });
  });

  // contact big lines mask reveal
  const contactLines = gsap.utils.toArray("[data-contact-line]");
  contactLines.forEach((line) => {
    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    inner.innerHTML = line.innerHTML;
    line.innerHTML = "";
    line.appendChild(inner);
    gsap.from(inner, {
      yPercent: 110, duration: 1.2, ease: "power4.out",
      scrollTrigger: { trigger: line, start: "top 90%" },
    });
  });

  // hero parallax out
  gsap.to(".hero__content", {
    yPercent: -12, opacity: 0.25, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
}

/* ------------------------------------------------------------
   Work cards — per-project hue for the visual gradient
------------------------------------------------------------ */
document.querySelectorAll(".work__card").forEach((item) => {
  item.style.setProperty("--h", item.dataset.hue);
});

/* ------------------------------------------------------------
   Menu overlay
------------------------------------------------------------ */
(function initMenu() {
  const burger = document.getElementById("navBurger");
  const menu = document.getElementById("menu");
  if (!burger || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
  };

  burger.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();

/* ------------------------------------------------------------
   Custom cursor + magnetic elements (desktop)
------------------------------------------------------------ */
(function initCursor() {
  if (!isFinePointer || prefersReducedMotion) return;
  const cursor = document.getElementById("cursor");
  const label = document.getElementById("cursorLabel");
  if (!cursor) return;

  const xTo = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3.out" });
  window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("cursor--hover"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("cursor--hover"));
  });
  document.querySelectorAll(".work__card").forEach((el) => {
    el.addEventListener("pointerenter", () => { label.textContent = "View"; cursor.classList.add("cursor--label"); });
    el.addEventListener("pointerleave", () => cursor.classList.remove("cursor--label"));
  });

  // magnetic pull
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  });
})();

/* ------------------------------------------------------------
   Nav — hide on scroll down, glass on scroll; Lagos clock
------------------------------------------------------------ */
(function initNav() {
  const nav = document.getElementById("nav");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("nav--scrolled", y > 40);
    nav.classList.toggle("nav--hidden", y > 300 && y > lastY);
    lastY = y;
  }, { passive: true });

  const timeEl = document.getElementById("localTime");
  if (timeEl) {
    const tick = () => {
      timeEl.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
      }).format(new Date());
    };
    tick();
    setInterval(tick, 30000);
  }
})();
