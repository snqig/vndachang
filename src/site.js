/* Site interactions: hero slider, product carousel, message form, widgets */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

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
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
    show(0);
    setInterval(function () { show(i + 1); }, 5200);
  }

  /* Product carousel on the homepage */
  function products() {
    var track = byId('pro-track');
    if (!track) { return; }
    var cards = all('.pro-card', track);
    if (cards.length < 2) { return; }
    var step = cards[1].offsetLeft - cards[0].offsetLeft;
    var visible = Math.max(1, Math.round(track.parentNode.offsetWidth / step));
    var maxIndex = Math.max(0, cards.length - visible);
    var pos = 0;
    var dots = all('.pro-dots span');

    function go(n) {
      pos = Math.min(maxIndex, Math.max(0, n));
      track.style.transform = 'translateX(' + (-pos * step) + 'px)';
      dots.forEach(function (d, k) { d.className = (k === Math.min(dots.length - 1, pos)) ? 'current' : ''; });
    }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k * visible); }); });
    go(0);
    setInterval(function () { go(pos >= maxIndex ? 0 : pos + 1); }, 4200);
    window.addEventListener('resize', function () {
      step = cards[1].offsetLeft - cards[0].offsetLeft;
      visible = Math.max(1, Math.round(track.parentNode.offsetWidth / step));
      maxIndex = Math.max(0, cards.length - visible);
      go(pos);
    });
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
      top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
  }

  function init() { hero(); products(); form(); widgets(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
