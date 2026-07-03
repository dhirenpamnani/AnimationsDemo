(function () {
  "use strict";

  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReducedMotion = reduceMotionQuery.matches;
  if (prefersReducedMotion) document.body.classList.add("no-motion");

  /* =========================================================
     Mobile nav toggle
     ========================================================= */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* =========================================================
     Hero parallax — product data (glass cards, text only)
     ========================================================= */
  var PRODUCTS = [
    { title: "Revenue Overview", category: "Finance", desc: "Weekly revenue across every channel, in one glance." },
    { title: "User Engagement", category: "Product", desc: "See where people spend their time in your product." },
    { title: "Conversion Funnel", category: "Marketing", desc: "Track visitors from first click to closed deal." },
    { title: "Traffic Sources", category: "Marketing", desc: "Know exactly which channels drive your growth." },
    { title: "Retention Cohort", category: "Growth", desc: "Watch how each signup cohort sticks around." },
    { title: "Sales Pipeline", category: "Sales", desc: "A live view of every deal, stage by stage." },
    { title: "Churn Analysis", category: "Growth", desc: "Catch at-risk accounts before they walk away." },
    { title: "Growth Metrics", category: "Growth", desc: "The north-star numbers your team rallies around." },
    { title: "Campaign ROI", category: "Marketing", desc: "Spend versus return, broken down by campaign." },
    { title: "Product Usage", category: "Product", desc: "Feature adoption trends across your whole base." }
  ];

  var trackEl = document.getElementById("parallaxTrack");
  var rowsEl = document.getElementById("parallaxRows");
  var rowConfig = [
    { row: 1, items: PRODUCTS.slice(0, 5) },
    { row: 2, items: PRODUCTS.slice(5, 10) }
  ];

  if (rowsEl) {
    rowConfig.forEach(function (cfg) {
      var rowEl = rowsEl.querySelector('[data-row="' + cfg.row + '"]');
      if (!rowEl) return;
      cfg.items.forEach(function (product, idx) {
        var indexLabel = idx + 1 < 10 ? "0" + (idx + 1) : String(idx + 1);
        var card = document.createElement("div");
        card.className = "parallax-card";
        card.innerHTML =
          '<a class="parallax-card-link" href="#footer" aria-label="View ' + product.title + ' dashboard"></a>' +
          '<span class="parallax-card-index" aria-hidden="true">' + indexLabel + '</span>' +
          '<div class="parallax-card-chrome" aria-hidden="true"><span></span><span></span><span></span></div>' +
          '<div class="parallax-card-body">' +
            '<span class="category">' + product.category + '</span>' +
            '<h3 class="title">' + product.title + '</h3>' +
            '<p class="desc">' + product.desc + '</p>' +
            '<span class="hint">View dashboard &rarr;</span>' +
          '</div>';
        rowEl.appendChild(card);
      });
    });
  }

  /* =========================================================
     Hero parallax — scroll-linked transform (vanilla, spring-lerp)
     ========================================================= */
  var heroSection = document.querySelector(".hero-parallax");

  if (heroSection && trackEl && !prefersReducedMotion) {
    var rowEls = Array.prototype.slice.call(rowsEl.querySelectorAll(".parallax-row"));

    var state = {
      rotateX: 15, rotateZ: 20, translateY: -340, opacity: 0.6,
      rowX: [0, 0]
    };
    var target = {
      rotateX: 15, rotateZ: 20, translateY: -340, opacity: 0.6,
      rowX: [0, 0]
    };

    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function mapRange(value, inMin, inMax, outMin, outMax) {
      var t = clamp01((value - inMin) / (inMax - inMin));
      return outMin + t * (outMax - outMin);
    }

    function computeTargets() {
      var rect = heroSection.getBoundingClientRect();
      var scrollable = heroSection.offsetHeight - window.innerHeight;
      var progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;

      var vw = window.innerWidth;
      var mobileFactor = vw < 560 ? 0.35 : vw < 860 ? 0.55 : 1;
      var maxX = Math.min(1000, vw * 0.85) * mobileFactor;
      var yTravel = mobileFactor * 1;

      target.rotateX = mapRange(progress, 0, 0.3, 15, 0);
      target.rotateZ = mapRange(progress, 0, 0.3, 20, 0);
      target.opacity = mapRange(progress, 0, 0.3, 0.6, 1);
      target.translateY = mapRange(progress, 0, 0.3, -340 * yTravel, 0);

      var xForward = mapRange(progress, 0, 1, 0, maxX);
      var xReverse = mapRange(progress, 0, 1, 0, -maxX);
      target.rowX = [xForward, xReverse];
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          computeTargets();
          ticking = false;
        });
      }
    }

    var animating = true;
    function raf() {
      var ease = 0.14;
      state.rotateX = lerp(state.rotateX, target.rotateX, ease);
      state.rotateZ = lerp(state.rotateZ, target.rotateZ, ease);
      state.translateY = lerp(state.translateY, target.translateY, ease);
      state.opacity = lerp(state.opacity, target.opacity, ease);
      for (var i = 0; i < state.rowX.length; i++) {
        state.rowX[i] = lerp(state.rowX[i], target.rowX[i], ease);
      }

      trackEl.style.transform =
        "rotateX(" + state.rotateX.toFixed(2) + "deg) " +
        "rotateZ(" + state.rotateZ.toFixed(2) + "deg) " +
        "translateY(" + state.translateY.toFixed(1) + "px)";
      trackEl.style.opacity = state.opacity.toFixed(3);

      rowEls.forEach(function (rowEl, i) {
        rowEl.style.transform = "translateX(" + state.rowX[i].toFixed(1) + "px)";
      });

      if (animating) window.requestAnimationFrame(raf);
    }

    computeTargets();
    Object.assign(state, target);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.requestAnimationFrame(raf);
  }

  /* =========================================================
     Canvas mouse-trail — adapted for light "white + light blue" theme
     ========================================================= */
  var canvas = document.getElementById("trailCanvas");
  var insightSection = document.querySelector(".insight-section");

  if (canvas && insightSection) {
    if (prefersReducedMotion) {
      canvas.style.display = "none";
    } else {
      initTrailCanvas(canvas, insightSection);
    }
  }

  function initTrailCanvas(canvasEl, sectionEl) {
    var ctx = canvasEl.getContext("2d");
    var isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    var isSmallScreen = window.innerWidth < 768;

    var CONFIG = {
      friction: 0.5,
      trails: isSmallScreen ? 26 : 60,
      size: isSmallScreen ? 24 : 40,
      dampening: 0.025,
      tension: 0.98
    };

    var pos = { x: 0, y: 0 };
    var lines = [];
    var running = false;
    var inView = false;
    var rect = { width: 0, height: 0 };
    var hue = { phase: Math.random() * Math.PI * 2, freq: 0.0012 };

    function Node() {
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    }

    function Line(spring) {
      this.spring = spring + 0.1 * Math.random() - 0.05;
      this.friction = CONFIG.friction + 0.01 * Math.random() - 0.005;
      this.nodes = [];
      for (var i = 0; i < CONFIG.size; i++) {
        var n = new Node();
        n.x = pos.x;
        n.y = pos.y;
        this.nodes.push(n);
      }
    }

    Line.prototype.update = function () {
      var spring = this.spring;
      var node = this.nodes[0];
      node.vx += (pos.x - node.x) * spring;
      node.vy += (pos.y - node.y) * spring;

      for (var i = 0, len = this.nodes.length; i < len; i++) {
        node = this.nodes[i];
        if (i > 0) {
          var prev = this.nodes[i - 1];
          node.vx += (prev.x - node.x) * spring;
          node.vy += (prev.y - node.y) * spring;
          node.vx += prev.vx * CONFIG.dampening;
          node.vy += prev.vy * CONFIG.dampening;
        }
        node.vx *= this.friction;
        node.vy *= this.friction;
        node.x += node.vx;
        node.y += node.vy;
        spring *= CONFIG.tension;
      }
    };

    Line.prototype.draw = function (strokeStyle) {
      var n = this.nodes[0].x;
      var i = this.nodes[0].y;
      ctx.beginPath();
      ctx.moveTo(n, i);
      var a, curPt, nextPt;
      for (a = 1; a < this.nodes.length - 2; a++) {
        curPt = this.nodes[a];
        nextPt = this.nodes[a + 1];
        n = 0.5 * (curPt.x + nextPt.x);
        i = 0.5 * (curPt.y + nextPt.y);
        ctx.quadraticCurveTo(curPt.x, curPt.y, n, i);
      }
      curPt = this.nodes[a];
      nextPt = this.nodes[a + 1];
      ctx.quadraticCurveTo(curPt.x, curPt.y, nextPt.x, nextPt.y);
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
      ctx.closePath();
    };

    function resetLines() {
      lines = [];
      for (var i = 0; i < CONFIG.trails; i++) {
        lines.push(new Line(0.4 + (i / CONFIG.trails) * 0.025));
      }
    }

    function resizeCanvas() {
      rect = sectionEl.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      canvasEl.style.width = rect.width + "px";
      canvasEl.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updatePosFromEvent(e) {
      var r = canvasEl.getBoundingClientRect();
      if (e.touches && e.touches.length) {
        pos.x = e.touches[0].clientX - r.left;
        pos.y = e.touches[0].clientY - r.top;
      } else {
        pos.x = e.clientX - r.left;
        pos.y = e.clientY - r.top;
      }
    }

    function onPointerMove(e) {
      updatePosFromEvent(e);
      if (e.touches) e.preventDefault();
    }

    function render() {
      if (!running || !inView) return;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(248, 250, 255, 0.14)";
      ctx.fillRect(0, 0, rect.width, rect.height);

      hue.phase += hue.freq;
      var hueValue = 205 + Math.sin(hue.phase) * 18;
      var strokeStyle = "hsla(" + Math.round(hueValue) + ", 85%, 50%, 0.05)";
      ctx.lineWidth = isSmallScreen ? 4 : 7;

      for (var t = 0; t < CONFIG.trails; t++) {
        lines[t].update();
        lines[t].draw(strokeStyle);
      }

      window.requestAnimationFrame(render);
    }

    function start() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(render);
    }
    function stop() {
      running = false;
    }

    resizeCanvas();
    pos.x = rect.width / 2;
    pos.y = rect.height / 2;
    resetLines();

    var moveTarget = isCoarsePointer ? sectionEl : document;
    moveTarget.addEventListener("mousemove", onPointerMove, { passive: true });
    moveTarget.addEventListener("touchmove", onPointerMove, { passive: false });
    sectionEl.addEventListener("touchstart", onPointerMove, { passive: true });

    window.addEventListener("resize", function () {
      isSmallScreen = window.innerWidth < 768;
      resizeCanvas();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (inView) start();
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (inView && !document.hidden) start(); else stop();
        });
      }, { threshold: 0.05 });
      observer.observe(sectionEl);
    } else {
      inView = true;
      start();
    }
  }
})();
