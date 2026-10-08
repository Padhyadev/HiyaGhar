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
  } else {
    window.scrollTo(0, 0);
  }
};
