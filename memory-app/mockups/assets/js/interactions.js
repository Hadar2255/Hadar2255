/* ============================================
   Interactions - quiz answers, drag/select, confetti
   ============================================ */

(function () {
  // === Quiz Multiple Choice ===
  function setupMultipleChoice(root) {
    const options = root.querySelectorAll('.quiz-option');
    const checkBtn = root.querySelector('[data-action="check"]');
    const feedback = root.querySelector('[data-feedback]');
    let selected = null;

    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        if (feedback && feedback.style.display === 'flex') return; // locked
        options.forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        selected = opt;
        if (checkBtn) checkBtn.disabled = false;
      });
    });

    if (checkBtn) {
      checkBtn.disabled = true;
      checkBtn.addEventListener('click', () => {
        if (!selected) return;
        const isCorrect = selected.getAttribute('data-correct') === 'true';
        options.forEach((opt) => {
          const correct = opt.getAttribute('data-correct') === 'true';
          if (correct) opt.classList.add('correct');
          else if (opt === selected && !isCorrect) opt.classList.add('wrong');
        });
        showFeedback(feedback, isCorrect);
        if (!isCorrect) {
          selected.classList.add('animate-shake');
        } else {
          selected.classList.add('animate-scale');
        }
        // Lock options
        options.forEach((opt) => { opt.style.pointerEvents = 'none'; });
        if (checkBtn) {
          checkBtn.textContent = window.i18n ? window.i18n.t('common.continue') : 'CONTINUE';
          checkBtn.disabled = false;
          checkBtn.classList.remove('btn-primary');
          checkBtn.classList.add(isCorrect ? 'btn-success' : 'btn-error');
          checkBtn.onclick = () => window.nav && window.nav.next();
        }
      });
    }
  }

  function showFeedback(banner, correct) {
    if (!banner) return;
    banner.style.display = 'flex';
    banner.classList.remove('correct', 'wrong');
    banner.classList.add(correct ? 'correct' : 'wrong');
    const icon = banner.querySelector('.feedback-icon');
    const text = banner.querySelector('.feedback-text');
    if (icon) icon.textContent = correct ? '✓' : '✕';
    if (text) {
      text.setAttribute('data-i18n', correct ? 'feedback.correct' : 'feedback.wrong');
      if (window.i18n) text.textContent = window.i18n.t(correct ? 'feedback.correct' : 'feedback.wrong');
    }
  }

  // === Match Pairs ===
  function setupMatch(root) {
    const items = root.querySelectorAll('.match-item');
    let firstPick = null;
    let matchesLeft = items.length / 2;

    items.forEach((item) => {
      item.addEventListener('click', () => {
        if (item.classList.contains('matched')) return;
        if (item === firstPick) return;

        item.classList.add('selected');

        if (!firstPick) {
          firstPick = item;
        } else {
          const a = firstPick.getAttribute('data-pair');
          const b = item.getAttribute('data-pair');
          if (a === b) {
            firstPick.classList.add('matched');
            item.classList.add('matched');
            firstPick.classList.remove('selected');
            item.classList.remove('selected');
            firstPick = null;
            matchesLeft -= 1;
            if (matchesLeft === 0) {
              setTimeout(() => {
                const next = root.querySelector('[data-action="match-done"]');
                if (next) next.disabled = false;
              }, 400);
            }
          } else {
            const wrongA = firstPick;
            const wrongB = item;
            wrongA.classList.add('animate-shake');
            wrongB.classList.add('animate-shake');
            setTimeout(() => {
              wrongA.classList.remove('selected', 'animate-shake');
              wrongB.classList.remove('selected', 'animate-shake');
            }, 600);
            firstPick = null;
          }
        }
      });
    });
  }

  // === Recall (text input) ===
  function setupRecall(root) {
    const input = root.querySelector('[data-input="recall"]');
    const checkBtn = root.querySelector('[data-action="check"]');
    const feedback = root.querySelector('[data-feedback]');
    const expected = (root.querySelector('[data-expected]')?.getAttribute('data-expected') || '').trim().toLowerCase();

    if (!input || !checkBtn) return;

    input.addEventListener('input', () => {
      checkBtn.disabled = input.value.trim().length === 0;
    });

    checkBtn.disabled = true;
    checkBtn.addEventListener('click', () => {
      const val = input.value.trim().toLowerCase();
      const isCorrect = val === expected || (expected && val.includes(expected));
      input.classList.remove('animate-shake', 'animate-scale');
      void input.offsetWidth; // restart animation
      input.classList.add(isCorrect ? 'animate-scale' : 'animate-shake');
      showFeedback(feedback, isCorrect);
      input.disabled = true;
      checkBtn.textContent = window.i18n ? window.i18n.t('common.continue') : 'CONTINUE';
      checkBtn.classList.remove('btn-primary');
      checkBtn.classList.add(isCorrect ? 'btn-success' : 'btn-error');
      checkBtn.onclick = () => window.nav && window.nav.next();
    });
  }

  // === Confetti ===
  function launchConfetti(container) {
    if (!container) return;
    const colors = ['#7C3AED', '#FBBF24', '#10B981', '#EF4444', '#F97316', '#3B82F6'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.6 + 's';
      piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
      container.appendChild(piece);
    }
  }

  // === Carousel (onboarding) ===
  function setupCarousel(root) {
    const slides = root.querySelectorAll('[data-slide]');
    const dots = root.querySelectorAll('.dots .dot');
    const nextBtn = root.querySelector('[data-action="carousel-next"]');
    const skipBtn = root.querySelector('[data-action="carousel-skip"]');
    let current = 0;

    function show(i) {
      slides.forEach((s, idx) => { s.style.display = idx === i ? 'flex' : 'none'; });
      dots.forEach((d, idx) => { d.classList.toggle('active', idx === i); });
      if (nextBtn) {
        const isLast = i === slides.length - 1;
        nextBtn.textContent = window.i18n ? window.i18n.t(isLast ? 'common.start' : 'common.next') : (isLast ? 'START' : 'NEXT');
      }
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (current < slides.length - 1) {
          current++;
          show(current);
        } else {
          window.nav && window.nav.next();
        }
      });
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => window.nav && window.nav.next());
    }

    show(current);
  }

  // === Card Selection (signup goal etc.) ===
  function setupCardSelect(root) {
    const cards = root.querySelectorAll('.card-selectable[data-select-group]');
    const groups = {};
    cards.forEach((c) => {
      const group = c.getAttribute('data-select-group');
      if (!groups[group]) groups[group] = [];
      groups[group].push(c);
    });

    Object.values(groups).forEach((cards) => {
      cards.forEach((card) => {
        card.addEventListener('click', () => {
          cards.forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          const continueBtn = root.querySelector('[data-action="continue-after-select"]');
          if (continueBtn) continueBtn.disabled = false;
        });
      });
    });
  }

  // === Auto-wire on DOM ready ===
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-component="multiple-choice"]').forEach(setupMultipleChoice);
    document.querySelectorAll('[data-component="match"]').forEach(setupMatch);
    document.querySelectorAll('[data-component="recall"]').forEach(setupRecall);
    document.querySelectorAll('[data-component="carousel"]').forEach(setupCarousel);
    document.querySelectorAll('[data-component="card-select"]').forEach(setupCardSelect);

    const confettiContainer = document.querySelector('[data-confetti]');
    if (confettiContainer) {
      launchConfetti(confettiContainer);
    }
  });

  window.interactions = { launchConfetti };
})();
