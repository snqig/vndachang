/* Language switcher - no dependencies, works over http(s) and file:// */
(function () {
  'use strict';

  var LANGS = ['zh', 'zhtw', 'en', 'vi'];
  var HTML_LANG = { zh: 'zh-CN', zhtw: 'zh-TW', en: 'en', vi: 'vi' };
  var STORE_KEY = 'dachang-lang';

  function valid(l) { return LANGS.indexOf(l) !== -1; }

  function queryLang() {
    try {
      var m = window.location.search.match(/[?&]lang=([^&#]*)/);
      return m && valid(decodeURIComponent(m[1])) ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  function storedLang() {
    try {
      var v = window.localStorage.getItem(STORE_KEY);
      return valid(v) ? v : null;
    } catch (e) { return null; }
  }

  function detect() {
    return queryLang() ||
      (valid(window.DEFAULT_LANG) ? window.DEFAULT_LANG : null) ||
      storedLang() || 'zh';
  }

  function translate(lang) {
    var dict = window.I18N && window.I18N[lang];
    if (!dict) { return; }

    document.documentElement.lang = HTML_LANG[lang] || lang;

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var key = node.getAttribute('data-i18n');
      var value = dict[key];
      if (value === undefined || value === null) { continue; }
      var spec = node.getAttribute('data-i18n-attr');
      if (spec) {
        var attrs = spec.split('|');
        for (var j = 0; j < attrs.length; j++) {
          if (attrs[j]) { node.setAttribute(attrs[j], value); }
        }
      } else if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        node.setAttribute('placeholder', value);
      } else {
        node.textContent = value;
      }
    }

    var buttons = document.querySelectorAll('#lang-switch button[data-lang]');
    for (var k = 0; k < buttons.length; k++) {
      var b = buttons[k];
      if (b.getAttribute('data-lang') === lang) { b.className = 'active'; }
      else { b.className = ''; }
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    }

    window.currentLang = lang;
    try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url.toString());
    } catch (e) {}
    try {
      document.dispatchEvent(new CustomEvent('dc:langchange', { detail: { lang: lang } }));
    } catch (e) {}
  }

  function init() {
    translate(detect());
    var bar = document.getElementById('lang-switch');
    if (!bar) { return; }
    bar.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('button[data-lang]') : null;
      if (!btn) { return; }
      var lang = btn.getAttribute('data-lang');
      if (valid(lang)) { translate(lang); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
