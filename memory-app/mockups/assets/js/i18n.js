/* ============================================
   i18n - Internationalization (Hebrew / English)
   ============================================ */

(function () {
  const STORAGE_KEY = 'memory_app_lang';
  const DEFAULT_LANG = 'he';
  const SUPPORTED = ['he', 'en'];

  const state = {
    lang: localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG,
    translations: {}
  };

  function getNested(obj, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  }

  function localesBasePath() {
    const path = window.location.pathname;
    if (path.includes('/screens/')) {
      return '../assets/locales';
    }
    return 'assets/locales';
  }

  async function loadTranslations(lang) {
    if (state.translations[lang]) return state.translations[lang];
    try {
      const res = await fetch(`${localesBasePath()}/${lang}.json`);
      const data = await res.json();
      state.translations[lang] = data;
      return data;
    } catch (e) {
      console.error('Failed to load translations:', e);
      return {};
    }
  }

  function applyTranslations() {
    const t = state.translations[state.lang] || {};
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = getNested(t, key);
      if (value !== null && value !== undefined) {
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email' || el.type === 'password')) {
          el.placeholder = value;
        } else {
          el.textContent = value;
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = getNested(t, key);
      if (value !== null && value !== undefined) {
        el.placeholder = value;
      }
    });
  }

  function applyDir() {
    const html = document.documentElement;
    html.setAttribute('lang', state.lang);
    html.setAttribute('dir', state.lang === 'he' ? 'rtl' : 'ltr');
  }

  function updateSwitcherUI() {
    document.querySelectorAll('.language-switch button').forEach((btn) => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', lang === state.lang);
    });
  }

  async function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    state.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    await loadTranslations(lang);
    applyDir();
    applyTranslations();
    updateSwitcherUI();
    document.dispatchEvent(new CustomEvent('language:changed', { detail: { lang } }));
  }

  function attachSwitcher() {
    document.querySelectorAll('.language-switch button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
      });
    });
  }

  async function init() {
    applyDir();
    await loadTranslations(state.lang);
    applyTranslations();
    updateSwitcherUI();
    attachSwitcher();
  }

  // Expose
  window.i18n = {
    init,
    setLanguage,
    getLang: () => state.lang,
    t: (key) => {
      const t = state.translations[state.lang] || {};
      return getNested(t, key) || key;
    }
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
