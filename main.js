/* =============================================================
   SKIN GLOW · main.js — vanilla, sin dependencias obligatorias
   ============================================================= */
(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $  = function (s, sc) { return (sc || document).querySelector(s); };
  var $$ = function (s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---------- Splash ---------- */
  function initSplash() {
    var splash = $("#splash");
    if (!splash) return;
    var done = function () { splash.classList.add("is-done"); };
    setTimeout(done, 900);           // salida normal
    setTimeout(done, 2600);          // red de seguridad 1
    window.addEventListener("load", done);  // red de seguridad 2
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = $("#nav");
    var toggle = $("#navToggle");
    var mobile = $("#navMobile");

    var onScroll = function () {
      if (!nav) return;
      nav.classList.toggle("is-stuck", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
        mobile.hidden = open;
      });
      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          mobile.hidden = true;
        });
      });
    }

    // Enlace activo según sección visible
    var links = $$(".nav-links a");
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l, i) { l.classList.toggle("is-current", sections[i] === en.target); });
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      sections.forEach(function (s) { if (s) io.observe(s); });
    }
  }

  /* ---------- Reveals ---------- */
  function initReveals() {
    var els = $$(".reveal");
    if (!els.length) return;

    var show = function (el, i) {
      setTimeout(function () { el.classList.add("is-visible"); }, Math.min(i * 70, 350));
    };

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var siblings = $$(".reveal", en.target.parentNode);
        show(en.target, Math.max(siblings.indexOf(en.target), 0));
        obs.unobserve(en.target);
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });

    // Red de seguridad: nada puede quedarse invisible
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.4) el.classList.add("is-visible");
      });
    }, 1800);
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-visible"); }); }, 9000);
  }

  /* ---------- Ticker: duplicar contenido para bucle continuo ---------- */
  function initTicker() {
    var track = $("[data-ticker]");
    if (!track || track.dataset.cloned === "1") return;
    track.innerHTML = track.innerHTML + track.innerHTML;
    track.dataset.cloned = "1";
  }

  /* ---------- Servicios: índice interactivo + visor ---------- */
  function initServices() {
    var items = $$("[data-svc-item]");
    var photos = $$(".svc-photo");
    if (!items.length) return;

    function activate(item) {
      items.forEach(function (it) {
        var on = it === item;
        it.classList.toggle("is-active", on);
        var btn = $(".svc-btn", it);
        if (btn) btn.setAttribute("aria-expanded", String(on));
      });
      if (!item) return;
      var src = item.getAttribute("data-photo");
      photos.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-svc-photo") === src);
      });
    }

    items.forEach(function (item) {
      var btn = $(".svc-btn", item);
      if (btn) {
        btn.addEventListener("click", function () {
          var isOpen = item.classList.contains("is-active");
          activate(isOpen && !fineHover ? null : item);
        });
        btn.addEventListener("focus", function () { if (fineHover) activate(item); });
      }
      if (fineHover) {
        item.addEventListener("mouseenter", function () { activate(item); });
      }
    });
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var dur = 1400, t0 = null;
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.05 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Antes / Después ---------- */
  function initBeforeAfter() {
    var root = $("[data-ba]");
    if (!root) return;
    var media = $(".ba-media", root);
    var clip = $("[data-ba-clip]", root);
    var handle = $("[data-ba-handle]", root);
    if (!media || !clip || !handle) return;

    var dragging = false;

    function setPct(pct) {
      pct = Math.max(2, Math.min(98, pct));
      clip.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      handle.style.left = pct + "%";
      handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function fromEvent(e) {
      var rect = media.getBoundingClientRect();
      var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - rect.left;
      setPct((x / rect.width) * 100);
    }

    media.addEventListener("pointerdown", function (e) {
      dragging = true; media.setPointerCapture && media.setPointerCapture(e.pointerId); fromEvent(e);
    });
    window.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    window.addEventListener("pointerup", function () { dragging = false; });
    media.addEventListener("touchmove", function (e) { if (dragging) fromEvent(e); }, { passive: true });

    handle.addEventListener("keydown", function (e) {
      var cur = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
      if (e.key === "ArrowLeft") { setPct(cur - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { setPct(cur + 4); e.preventDefault(); }
    });

    setPct(50);

    // Pequeña invitación al entrar en pantalla
    if (!reduced && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          obs.unobserve(en.target);
          var t0 = null;
          var wink = function (ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min((ts - t0) / 1500, 1);
            setPct(50 + Math.sin(p * Math.PI * 2) * 12);
            if (p < 1) requestAnimationFrame(wink); else setPct(50);
          };
          requestAnimationFrame(wink);
        });
      }, { threshold: 0.2 });
      io.observe(media);
    }
  }

  /* ---------- Testimonios ---------- */
  function initQuotes() {
    var root = $("[data-quotes]");
    if (!root) return;
    var quotes = $$("[data-quote]", root);
    var dotsWrap = $("[data-quote-dots]", root);
    if (quotes.length < 2) return;

    var idx = 0, timer = null;

    var dots = quotes.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Testimonio " + (i + 1));
      b.addEventListener("click", function () { go(i, true); });
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });

    function go(n, manual) {
      idx = (n + quotes.length) % quotes.length;
      quotes.forEach(function (q, i) { q.classList.toggle("is-active", i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      if (manual) restart();
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(idx + 1); }, 7000);
    }

    var prev = $("[data-quote-prev]", root);
    var next = $("[data-quote-next]", root);
    prev && prev.addEventListener("click", function () { go(idx - 1, true); });
    next && next.addEventListener("click", function () { go(idx + 1, true); });

    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", restart);

    go(0);
    restart();
  }

  /* ---------- Botones magnéticos ---------- */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.22;
        el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Parallax suave del hero (GSAP si está) ---------- */
  function initHeroParallax() {
    var img = $("[data-parallax]");
    if (!img || !window.gsap || !window.ScrollTrigger) return;
    gsap.to(img, {
      yPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: 0.6 }
    });
  }

  /* ---------- Formulario ---------- */
  function initForm() {
    var form = $("#bookForm");
    if (!form) return;
    var status = $("[data-form-status]", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var required = ["f-name", "f-phone", "f-service"];
      var ok = true;
      required.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var bad = !el.value.trim();
        el.parentNode.classList.toggle("is-error", bad);
        if (bad) ok = false;
      });

      if (!ok) {
        status.textContent = "Revisa los campos marcados, por favor.";
        status.className = "form-status is-err";
        return;
      }

      var btn = $("button[type=submit]", form);
      if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
      status.textContent = "";

      setTimeout(function () {
        status.textContent = "¡Gracias! Hemos recibido tu solicitud. Te escribimos por WhatsApp en menos de 24 h.";
        status.className = "form-status is-ok";
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = "Solicitar cita"; }
      }, 900);
    });

    // Limpia el error al escribir
    $$("input, select, textarea", form).forEach(function (el) {
      el.addEventListener("input", function () { el.parentNode.classList.remove("is-error"); });
    });
  }

  /* ---------- Año del footer ---------- */
  function initYear() {
    var y = $("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initTicker, "initTicker");
    safe(initReveals, "initReveals");
    safe(initServices, "initServices");
    safe(initCounters, "initCounters");
    safe(initBeforeAfter, "initBeforeAfter");
    safe(initQuotes, "initQuotes");
    safe(initMagnetic, "initMagnetic");
    safe(initForm, "initForm");
    safe(initYear, "initYear");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroParallax, "initHeroParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
