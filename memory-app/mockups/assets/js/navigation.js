/* ============================================
   Navigation - Helpers for moving between screens
   ============================================ */

(function () {
  const SCREENS = [
    '01-splash.html',
    '02-onboarding.html',
    '03-language.html',
    '04-signup.html',
    '05-home.html',
    '06-lesson-intro.html',
    '07-lesson-teach.html',
    '08-quiz.html',
    '09-quiz-match.html',
    '10-quiz-recall.html',
    '11-lesson-complete.html',
    '12-profile.html',
    '13-progress.html',
    '14-settings.html'
  ];

  function currentScreenIndex() {
    const file = window.location.pathname.split('/').pop();
    return SCREENS.indexOf(file);
  }

  function goTo(screen) {
    window.location.href = screen;
  }

  function nextScreen() {
    const idx = currentScreenIndex();
    if (idx >= 0 && idx < SCREENS.length - 1) {
      goTo(SCREENS[idx + 1]);
    }
  }

  function prevScreen() {
    const idx = currentScreenIndex();
    if (idx > 0) {
      goTo(SCREENS[idx - 1]);
    }
  }

  function goHome() {
    goTo('05-home.html');
  }

  function goIndex() {
    window.location.href = '../index.html';
  }

  window.nav = {
    goTo,
    next: nextScreen,
    prev: prevScreen,
    home: goHome,
    index: goIndex,
    screens: SCREENS
  };

  // Auto-wire nav buttons by class
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-nav="next"]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); nextScreen(); });
    });
    document.querySelectorAll('[data-nav="prev"]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); prevScreen(); });
    });
    document.querySelectorAll('[data-nav="home"]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); goHome(); });
    });
    document.querySelectorAll('[data-nav="index"]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); goIndex(); });
    });
    document.querySelectorAll('[data-nav-to]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.getAttribute('data-nav-to');
        goTo(target);
      });
    });
  });
})();
