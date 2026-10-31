(function () {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch (_) { /* Theme remains usable without storage. */ }
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  function apply(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.hidden = false;
      toggle.textContent = dark ? '☾' : '☀';
      toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }
  apply(saved ? saved === 'dark' : system.matches);
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme === 'dark');
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      saved = dark ? 'dark' : 'light';
      try { localStorage.setItem('theme', saved); } catch (_) { /* Session-only theme. */ }
      apply(dark);
    });
  });
  system.addEventListener('change', event => { if (!saved) apply(event.matches); });
})();
