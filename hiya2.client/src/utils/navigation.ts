export const navigateTo = (path: string) => {
  let clean = path;
  let targetElementId = '';

  if (clean.includes('#')) {
    const parts = clean.split('#');
    clean = parts[0] || '/';
    targetElementId = parts[1] || '';
  }

  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }

  const isSamePath = window.location.pathname === clean;
  if (isSamePath && !targetElementId) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return;
  }
  window.history.pushState(null, '', targetElementId ? `${clean}#${targetElementId}` : clean);
  window.dispatchEvent(new Event('popstate'));

  if (targetElementId) {
    const scrollTarget = () => {
      const el = document.getElementById(targetElementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    if (isSamePath) {
      scrollTarget();
    } else {
      setTimeout(scrollTarget, 100);
      setTimeout(scrollTarget, 350);
    }
  }
  // No scrollTo(0, 0) here: the popstate handler in App scrolls a same-page change to the
  // top, and PageTransition does it for a new page when it swaps in - scrolling now would
  // show the top of the old page (e.g. the home hero) behind the loading blur.
};
