(function () {
  'use strict';

  var EVENT_DATE = new Date('2026-10-30T19:00:00-03:00').getTime();
  var root = document.documentElement;

  /* ================= TRACKING (Meta Pixel) ================= */
  function uid(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }
  function track(name, params, custom) {
    if (typeof window.fbq !== 'function') return;
    var opts = { eventID: uid(name) };
    if (custom) window.fbq('trackCustom', name, params || {}, opts);
    else window.fbq('track', name, params || {}, opts);
  }
  function utm() {
    var out = {};
    try {
      var q = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
        if (q.get(k)) out[k] = q.get(k);
      });
    } catch (e) {}
    return out;
  }
  var baseParams = Object.assign({
    content_name: 'A Arte da Guerra Start',
    content_category: 'Treinamento de Liderança',
    event_date: '2026-10-30'
  }, utm());

  // Every CTA → Lead + Contact (standard) + WhatsAppClick (custom)
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () {
      var p = Object.assign({}, baseParams, { cta_position: el.dataset.cta, cta_text: (el.textContent || '').trim() });
      track('Lead', p);
      track('Contact', p);
      track('WhatsAppClick', p, true);
      if (window.dataLayer) window.dataLayer.push(Object.assign({ event: 'whatsapp_click' }, p));
    });
  });

  // FAQ opens
  document.querySelectorAll('[data-faq]').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) track('FAQOpen', Object.assign({}, baseParams, { question: d.dataset.faq }), true);
    });
  });

  // Scroll depth
  var depthMarks = [25, 50, 75, 90];
  var depthSent = {};
  function onDepth() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h <= 0) return;
    var pct = (scrollY / h) * 100;
    depthMarks.forEach(function (m) {
      if (pct >= m && !depthSent[m]) {
        depthSent[m] = true;
        track('ScrollDepth', Object.assign({}, baseParams, { percent: m }), true);
      }
    });
  }
  addEventListener('scroll', onDepth, { passive: true });

  // Time on page
  [30, 60, 120].forEach(function (s) {
    setTimeout(function () {
      if (document.visibilityState === 'visible') track('TimeOnPage', Object.assign({}, baseParams, { seconds: s }), true);
    }, s * 1000);
  });

  // Section views + ViewContent on offer
  if ('IntersectionObserver' in window) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (seen[id]) return;
        seen[id] = true;
        if (id === 'oferta') track('ViewContent', Object.assign({}, baseParams, { section: id }));
        track('SectionView', Object.assign({}, baseParams, { section: id }), true);
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ================= COUNTDOWN ================= */
  var cds = document.querySelectorAll('[data-countdown]');
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var diff = Math.max(0, EVENT_DATE - Date.now());
    var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    cds.forEach(function (c) {
      c.querySelector('[data-d]').textContent = pad(d);
      c.querySelector('[data-h]').textContent = pad(h);
      c.querySelector('[data-m]').textContent = pad(m);
      c.querySelector('[data-s]').textContent = pad(s);
    });
  }
  tick();
  setInterval(tick, 1000);

  /* ================= LAYOUT HELPERS ================= */
  var topbar = document.querySelector('.topbar');
  var header = document.querySelector('[data-header]');
  var sticky = document.querySelector('[data-sticky]');
  var hero = document.querySelector('.hero');
  function syncTopbar() { root.style.setProperty('--topbar', topbar.offsetHeight + 'px'); }
  syncTopbar();
  addEventListener('resize', syncTopbar);
  function onScroll() {
    header.classList.toggle('is-scrolled', scrollY > 10);
    if (sticky && hero) sticky.classList.toggle('is-visible', scrollY > hero.offsetHeight * 0.75);
  }
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ================= MOTION ================= */
  var M = window.Motion;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || reduce) { root.classList.remove('js-motion'); return; }

  var animate = M.animate, inView = M.inView, stagger = M.stagger, scroll = M.scroll;
  var ease = [0.16, 1, 0.3, 1];

  // Hero title: split words and drop them in
  document.querySelectorAll('[data-split]').forEach(function (h) {
    var wrap = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(h);
    h.classList.add('is-split');
    animate(h.querySelectorAll('.w'),
      { opacity: [0, 1], y: [48, 0], rotateX: [-60, 0], filter: ['blur(8px)', 'blur(0px)'] },
      { duration: 0.9, delay: stagger(0.06), ease: ease });
  });

  // Hero image entrance + float badge
  var heroMedia = document.querySelector('.hero__frame');
  if (heroMedia) animate(heroMedia, { opacity: [0, 1], scale: [1.08, 1], clipPath: ['inset(12% 12% 12% 12% round 18px)', 'inset(0% 0% 0% 0% round 18px)'] }, { duration: 1.3, ease: ease });
  var badge = document.querySelector('[data-float]');
  if (badge) {
    animate(badge, { opacity: [0, 1], x: [-30, 0] }, { duration: 0.8, delay: 0.9, ease: ease });
    setTimeout(function () { animate(badge, { y: [0, -10, 0] }, { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }); }, 1700);
  }

  // Parallax on hero image
  var px = document.querySelector('[data-parallax]');
  if (px && scroll && innerWidth > 900) {
    scroll(animate(px, { y: [0, 90] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
  }

  // Reveal singles
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    inView(el, function () {
      animate(el, { opacity: [0, 1], y: [34, 0] }, { duration: 0.85, ease: ease });
    }, { margin: '0px 0px -10% 0px' });
  });

  // Reveal with scale
  document.querySelectorAll('[data-reveal-scale]').forEach(function (el) {
    inView(el, function () {
      animate(el, { opacity: [0, 1], scale: [0.94, 1], y: [40, 0] }, { duration: 1, ease: ease });
    }, { margin: '0px 0px -10% 0px' });
  });

  // Staggered groups
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    inView(group, function () {
      animate(group.children, { opacity: [0, 1], y: [40, 0], scale: [0.97, 1] }, { duration: 0.75, delay: stagger(0.09), ease: ease });
    }, { margin: '0px 0px -10% 0px' });
  });

  // Timeline progress line + cards
  var tl = document.querySelector('[data-timeline]');
  if (tl) {
    tl.querySelectorAll('.tl').forEach(function (item) {
      item.style.opacity = 0;
      inView(item, function () {
        animate(item, { opacity: [0, 1], x: [-30, 0] }, { duration: 0.8, ease: ease });
      }, { margin: '0px 0px -15% 0px' });
    });
    if (scroll) {
      scroll(function (p) { tl.style.setProperty('--progress', Math.min(100, p * 140) + '%'); },
        { target: tl, offset: ['start 75%', 'end 50%'] });
    }
  }

  // Counters
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var to = parseFloat(el.dataset.count);
    inView(el, function () {
      animate(0, to, { duration: 1.4, ease: ease, onUpdate: function (v) { el.textContent = Math.round(v); } });
    });
  });

  // Magnetic hover on big buttons (desktop)
  if (matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.btn--xl,.btn--lg').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        animate(b, { x: dx * 10, y: dy * 6 }, { duration: 0.3 });
      });
      b.addEventListener('mouseleave', function () { animate(b, { x: 0, y: 0 }, { duration: 0.5, ease: ease }); });
    });
  }
})();
