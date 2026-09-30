export const navigateTo = (path: string) => {
  let clean = path;
  if (clean.startsWith('#')) {
    clean = '/' + clean.replace(/^#\/?/, '');
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  window.history.pushState(null, '', clean);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo(0, 0);
};
