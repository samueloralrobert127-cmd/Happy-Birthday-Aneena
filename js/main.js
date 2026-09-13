(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =====================================================
     FIREFLIES — lightweight, CSS-driven, no canvas needed
     ===================================================== */
  function spawnFireflies(container, count) {
    if (!container) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const f = document.createElement("span");
      const startX = Math.random() * 100;
      const startY = 60 + Math.random() * 40;
      const dur = 9 + Math.random() * 10;
      const delay = Math.random() * 10;
      const fx = (Math.random() * 80 - 40).toFixed(0) + "px";
      const fy = (-(60 + Math.random() * 60)).toFixed(0) + "px";
      const fx2 = (Math.random() * 100 - 50).toFixed(0) + "px";
      const fy2 = (-(140 + Math.random() * 100)).toFixed(0) + "px";
      f.style.left = startX + "%";
      f.style.top = startY + "%";
      f.style.animationDuration = dur + "s";
      f.style.animationDelay = delay + "s";
      f.style.setProperty("--fx", fx);
      f.style.setProperty("--fy", fy);
      f.style.setProperty("--fx2", fx2);
      f.style.setProperty("--fy2", fy2);
      frag.appendChild(f);
    }
    container.appendChild(frag);
  }

  spawnFireflies(document.getElementById("gateFireflies"), prefersReducedMotion ? 6 : 16);
  spawnFireflies(document.getElementById("ambientFireflies"), prefersReducedMotion ? 8 : 22);

  /* =====================================================
     GATE / START
     ===================================================== */
  const gate = document.getElementById("gate");
  const startButton = document.getElementById("startButton");
  const audio = document.getElementById("bgAudio");
  const soundToggle = document.getElementById("soundToggle");
  const body = document.body;

  body.classList.add("is-locked");

  function openGate() {
    gate.classList.add("is-hidden");
    body.classList.remove("is-locked");
    soundToggle.classList.add("is-visible");

    audio.volume = 0.75;
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // Autoplay blocked — leave the toggle so the visitor can start it manually.
        soundToggle.classList.add("is-muted");
      });
    }

    document.querySelectorAll(".screen--intro [data-reveal]").forEach((el, i) => {
      setTimeout(() => el.classList.add("is-visible"), 300 + i * 500);
    });
    const cue = document.querySelector(".scroll-cue");
    if (cue) setTimeout(() => cue.classList.add("is-visible"), 1600);
  }

  startButton.addEventListener("click", openGate);

  /* =====================================================
     SOUND TOGGLE
     ===================================================== */
  soundToggle.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      soundToggle.classList.remove("is-muted");
      soundToggle.setAttribute("aria-pressed", "true");
    } else {
      audio.pause();
      soundToggle.classList.add("is-muted");
      soundToggle.setAttribute("aria-pressed", "false");
    }
  });

  /* =====================================================
     SCROLL REVEALS — text lines, fragments, cards
     ===================================================== */
  const revealTargets = document.querySelectorAll(
    "[data-reveal], .memory-card"
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  // Scroll cue on screen 1 also needs its own trigger (it's not a data-reveal line itself,
  // but should appear once the intro lines are in view via the gate-open sequence above,
  // and again on repeat visits via scroll).
  const scrollCue = document.querySelector(".scroll-cue");
  if (scrollCue) {
    const cueObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && scrollCue.classList.add("is-visible")),
      { threshold: 0.5 }
    );
    cueObserver.observe(document.querySelector(".screen--intro"));
  }

  /* =====================================================
     BIRTHDAY CONFETTI — one orchestrated burst, canvas-based
     ===================================================== */
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  let confettiPieces = [];
  let confettiRunning = false;
  let confettiRAF = null;

  const COLORS = ["#D8A65C", "#E9C588", "#C48770", "#EFE8D8", "#4B6357"];

  function resizeCanvas() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function makePiece() {
    return {
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      speedY: 1 + Math.random() * 2.2,
      speedX: (Math.random() - 0.5) * 1.4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      sway: Math.random() * Math.PI * 2,
    };
  }

  function startConfetti() {
    if (confettiRunning) return;
    confettiRunning = true;
    canvas.classList.add("is-active");
    const count = prefersReducedMotion ? 0 : window.innerWidth < 640 ? 60 : 110;
    confettiPieces = Array.from({ length: count }, makePiece);

    let elapsed = 0;
    const maxDuration = 6500; // ms — one orchestrated burst, then it settles away
    let lastTime = performance.now();

    function tick(now) {
      const dt = now - lastTime;
      lastTime = now;
      elapsed += dt;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      confettiPieces.forEach((p) => {
        p.sway += 0.02;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.sway) * 0.6;
        p.rotation += p.rotationSpeed;
        if (p.y > window.innerHeight + 20) {
          p.y = -20;
          p.x = Math.random() * window.innerWidth;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = elapsed > maxDuration - 1200 ? Math.max(0, 1 - (elapsed - (maxDuration - 1200)) / 1200) : 1;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      ctx.restore();

      if (elapsed < maxDuration && confettiRunning) {
        confettiRAF = requestAnimationFrame(tick);
      } else {
        stopConfetti();
      }
    }

    if (!prefersReducedMotion) {
      confettiRAF = requestAnimationFrame(tick);
    }
  }

  function stopConfetti() {
    confettiRunning = false;
    canvas.classList.remove("is-active");
    if (confettiRAF) cancelAnimationFrame(confettiRAF);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const birthdayScreen = document.querySelector(".screen--birthday");
  if (birthdayScreen) {
    const birthdayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startConfetti();
            birthdayObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    birthdayObserver.observe(birthdayScreen);
  }

  /* =====================================================
     REPLAY
     ===================================================== */
  const replayButton = document.getElementById("replayButton");
  if (replayButton) {
    replayButton.addEventListener("click", () => {
      document.querySelectorAll(".is-visible").forEach((el) => {
        if (el.id !== "soundToggle" && !el.classList.contains("ambient")) {
          el.classList.remove("is-visible");
        }
      });
      stopConfetti();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      gate.classList.remove("is-hidden");
      body.classList.add("is-locked");

      // re-observe everything that just lost its visible state
      revealTargets.forEach((el) => revealObserver.observe(el));
      if (birthdayScreen) {
        new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                startConfetti();
                obs.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.4 }
        ).observe(birthdayScreen);
      }
    });
  }
})();
