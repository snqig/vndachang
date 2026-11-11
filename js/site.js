/* Site interactions: hero slider, product carousel, mobile drawer, message form, widgets */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var mobileMq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
  function isMobile() { return mobileMq ? mobileMq.matches : window.innerWidth <= 768; }

  function bindActivate(el, fn) {
    el.addEventListener('click', fn);
    /* Dots are <li>/<span> with role="button"; make them keyboard operable. */
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        fn();
      }
    });
  }

  /* Hero slider */
  function hero() {
    var slides = all('.hero-slide');
    var dots = all('#pagination li');
    if (!slides.length) { return; }
    var i = 0;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.className = 'hero-slide' + (k === i ? ' active' : ''); });
      dots.forEach(function (d, k) { d.className = k === i ? 'current' : ''; });
    }
    dots.forEach(function (d, k) { bindActivate(d, function () { show(k); }); });
    show(0);
    if (!reduceMotion) { setInterval(function () { show(i + 1); }, 5200); }
  }

  /* Product carousel on desktop; mobile switches to a vertical list (CSS). */
  function products() {
    var track = byId('pro-track');
    if (!track) { return; }
    var cards = all('.pro-card', track);
    if (cards.length < 2) { return; }
    var step = 0, visible = 1, maxIndex = 0, pos = 0;
    var dots = all('.pro-dots span');

    function measure() {
      if (isMobile()) { track.style.transform = ''; return; }
      step = (cards[1].offsetLeft - cards[0].offsetLeft) || 250;
      visible = Math.max(1, Math.round(track.parentNode.offsetWidth / step));
      maxIndex = Math.max(0, cards.length - visible);
    }
    function go(n) {
      if (isMobile()) { track.style.transform = ''; return; }
      pos = Math.min(maxIndex, Math.max(0, n));
      track.style.transform = 'translateX(' + (-pos * step) + 'px)';
      dots.forEach(function (d, k) { d.className = (k === Math.min(dots.length - 1, pos)) ? 'current' : ''; });
    }
    dots.forEach(function (d, k) { bindActivate(d, function () { go(k * visible); }); });
    measure();
    go(0);
    if (!reduceMotion) {
      setInterval(function () { go(pos >= maxIndex ? 0 : pos + 1); }, 4200);
    }
    window.addEventListener('resize', function () { measure(); go(pos); });
    if (mobileMq && mobileMq.addEventListener) {
      mobileMq.addEventListener('change', function () { measure(); go(pos); });
    }
  }

  /* Mobile hamburger drawer: overlay, Esc, focus trap, 44px targets */
  function drawer() {
    var toggle = byId('nav-toggle');
    var panel = byId('nav-drawer');
    var back = document.querySelector('.nav-backdrop');
    if (!toggle || !panel || !back) { return; }
    var closeBtn = panel.querySelector('.drawer-close');
    var lastFocus = null;

    function isOpen() { return panel.classList.contains('open'); }
    function open() {
      lastFocus = document.activeElement;
      panel.classList.add('open');
      back.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      back.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('drawer-open');
      if (closeBtn) {
        (window.requestAnimationFrame || function (f) { f(); })(function () { closeBtn.focus(); });
      }
    }
    function close() {
      panel.classList.remove('open');
      back.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      back.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('drawer-open');
      /* Always return focus to the trigger; lastFocus may be <body> when the
         drawer was opened programmatically, and <body> cannot take focus. */
      toggle.focus();
    }

    panel.setAttribute('aria-hidden', 'true');
    back.setAttribute('aria-hidden', 'true');

    toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
    back.addEventListener('click', close);
    if (closeBtn) { closeBtn.addEventListener('click', close); }
    panel.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('a')) { close(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (!isOpen()) { return; }
      if (ev.key === 'Escape') { close(); return; }
      if (ev.key !== 'Tab') { return; }
      var focusable = all('a[href], button:not([disabled])', panel)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) { return; }
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    if (mobileMq && mobileMq.addEventListener) {
      mobileMq.addEventListener('change', function (e) { if (!e.matches && isOpen()) { close(); } });
    }
  }

  /* Guestbook form (demo: local validation only, no network) */
  function form() {
    var f = byId('guestbook-form');
    if (!f) { return; }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = f.querySelector('[name=name]');
      var msg = f.querySelector('[name=message]');
      var out = byId('form-msg');
      var d = window.I18N && window.I18N[window.currentLang || 'zh'];
      if (!name.value.trim() || !msg.value.trim()) {
        out.style.color = '#c0392b';
        out.textContent = (d && d['form.invalid']) || 'Please fill in the required fields.';
        return;
      }
      out.style.color = '#1a7a3c';
      out.textContent = (d && d['form.sent']) || 'Message recorded.';
      f.reset();
    });
  }

  /* Floating widgets */
  function widgets() {
    var close = byId('close-x');
    if (close) {
      close.addEventListener('click', function () {
        var box = byId('scroll');
        if (box) { box.style.display = 'none'; }
      });
    }
    var top = byId('to-top');
    if (top) {
      window.addEventListener('scroll', function () {
        top.style.display = window.pageYOffset > 260 ? 'block' : 'none';
      });
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  function init() { hero(); products(); drawer(); form(); widgets(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
