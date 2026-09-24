(() => {
  const byId = (id) => document.getElementById(id);

  function makeFocusable(id, role, live) {
    const node = byId(id);
    if (!node) return null;
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
    if (role && !node.hasAttribute('role')) node.setAttribute('role', role);
    if (live && !node.hasAttribute('aria-live')) node.setAttribute('aria-live', live);
    return node;
  }

  function focusWhenVisible(id) {
    const node = byId(id);
    if (!node || node.classList.contains('hidden')) return;
    window.requestAnimationFrame(() => node.focus({ preventScroll: false }));
  }

  function initialise() {
    makeFocusable('question', 'heading', null);
    makeFocusable('feedback', 'status', 'polite');
    makeFocusable('score', 'status', 'polite');
    makeFocusable('headline', 'heading', null);

    const quiz = byId('quiz');
    const result = byId('result');
    if (!quiz || !result) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') continue;
        if (mutation.target === quiz && !quiz.classList.contains('hidden')) focusWhenVisible('question');
        if (mutation.target === result && !result.classList.contains('hidden')) focusWhenVisible('headline');
      }
    });

    observer.observe(quiz, { attributes: true });
    observer.observe(result, { attributes: true });

    const feedback = byId('feedback');
    if (feedback) {
      const feedbackObserver = new MutationObserver(() => {
        if (!feedback.classList.contains('hidden')) focusWhenVisible('feedback');
      });
      feedbackObserver.observe(feedback, { attributes: true, childList: true, characterData: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
})();
