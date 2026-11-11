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

  /* A URL inside /zh/, /zhtw/, /en/, /vi/ is an explicit language choice. */
  function pathLang() {
    try {
      var m = window.location.pathname.match(/(?:^|\/)(zh|zhtw|en|vi)(?:\/|$)/);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function storedLang() {
    try {
      var v = window.localStorage.getItem(STORE_KEY);
      return valid(v) ? v : null;
    } catch (e) { return null; }
  }

  /* Map an OS / browser locale to one of the four site languages. */
  function mapLocale(raw) {
    var s = String(raw || '').toLowerCase().replace(/_/g, '-');
    if (!s) { return null; }
    var parts = s.split('-');
    var base = parts[0];
    var rest = parts.slice(1).join('-');
    if (base === 'vi') { return 'vi'; }
    if (base === 'en') { return 'en'; }
    if (base === 'zh') {
      return /hant|tw|hk|mo/.test(rest) ? 'zhtw' : 'zh';
    }
    return null;
  }

  function browserLang() {
    var list = [];
    try {
      if (navigator.languages && navigator.languages.length) {
        list = list.concat(Array.prototype.slice.call(navigator.languages));
      }
    } catch (e) {}
    try { if (navigator.language) { list.push(navigator.language); } } catch (e) {}
    try { if (navigator.userLanguage) { list.push(navigator.userLanguage); } } catch (e) {}
    for (var i = 0; i < list.length; i++) {
      var l = mapLocale(list[i]);
      if (l) { return l; }
    }
    return null;
  }

  /* Priority: explicit ?lang= > language directory > user's manual choice
     > OS/browser language > baked default > zh. */
  function detect() {
    return queryLang() ||
      pathLang() ||
      storedLang() ||
      browserLang() ||
      (valid(window.DEFAULT_LANG) ? window.DEFAULT_LANG : null) ||
      'zh';
  }

  /* aria-labels on the drawer are intentionally NOT data-i18n nodes, because
     the drawer wraps other translatable elements (nested keys are forbidden). */
  function updateAria(dict) {
    var toggle = document.getElementById('nav-toggle');
    var panel = document.getElementById('nav-drawer');
    var close = document.querySelector('.drawer-close');
    if (toggle && dict['nav.menu']) { toggle.setAttribute('aria-label', dict['nav.menu']); }
    if (panel && dict['nav.menu']) { panel.setAttribute('aria-label', dict['nav.menu']); }
    if (close && dict['nav.close']) { close.setAttribute('aria-label', dict['nav.close']); }
  }

  function translate(lang, userAction) {
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

    updateAria(dict);

    /* Both the desktop top bar and the mobile drawer carry language buttons. */
    var buttons = document.querySelectorAll('button[data-lang]');
    for (var k = 0; k < buttons.length; k++) {
      var b = buttons[k];
      var on = b.getAttribute('data-lang') === lang;
      if (on) { b.classList.add('active'); } else { b.classList.remove('active'); }
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    window.currentLang = lang;

    /* Only a manual click is persisted. Auto-detection stays fresh so a change
       of OS/browser language is picked up on the next visit. */
    if (userAction) {
      try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) {}
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState(null, '', url.toString());
      } catch (e) {}
    }
    try {
      document.dispatchEvent(new CustomEvent('dc:langchange', { detail: { lang: lang } }));
    } catch (e) {}
  }

  function init() {
    translate(detect(), false);
    /* Delegated so the mobile drawer's own button set works too. */
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('button[data-lang]') : null;
      if (!btn) { return; }
      var lang = btn.getAttribute('data-lang');
      if (valid(lang)) { translate(lang, true); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
