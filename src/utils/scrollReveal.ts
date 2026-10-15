/**
 * Global Apple-Style Scroll Reveal Observer
 * Automatically observes all elements with .apple-reveal, .apple-reveal-subtle, .apple-reveal-scale
 * Uses IntersectionObserver on the compositor thread for zero scroll lag.
 */

export function initAppleScrollReveal(): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => {};
  }

  // Respect user motion preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.apple-reveal, .apple-reveal-subtle, .apple-reveal-scale').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delayAttr = el.getAttribute('data-delay');
          const delay = delayAttr ? parseInt(delayAttr, 10) : 0;

          if (delay > 0) {
            setTimeout(() => {
              el.classList.add('is-revealed');
            }, delay);
          } else {
            el.classList.add('is-revealed');
          }

          obs.unobserve(el);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  const scanAndObserve = () => {
    const elements = document.querySelectorAll(
      '.apple-reveal:not(.is-revealed), .apple-reveal-subtle:not(.is-revealed), .apple-reveal-scale:not(.is-revealed)'
    );
    elements.forEach((el) => observer.observe(el));
  };

  scanAndObserve();

  // Watch for DOM updates / tab navigations
  const mutationObserver = new MutationObserver(() => {
    scanAndObserve();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
  };
}
