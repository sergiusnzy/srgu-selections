(() => {
  'use strict';

  const input = document.getElementById('searchInput');
  const clear = document.getElementById('clearSearch');
  const status = document.getElementById('searchStatus');
  const surprise = document.getElementById('surpriseBtn');
  const feed = document.getElementById('feed');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  if (!input || !feed) return;

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  function visibleCards() {
    return [...feed.querySelectorAll('.card')].filter(card => !card.hidden);
  }

  function applySearch() {
    const query = normalize(input.value);
    const cards = [...feed.querySelectorAll('.card')];
    let shown = 0;

    cards.forEach(card => {
      const title = card.querySelector('h3')?.textContent || '';
      const meta = card.querySelector('p')?.textContent || '';
      const match = !query || normalize(`${title} ${meta}`).includes(query);
      card.hidden = !match;
      if (match) shown += 1;
    });

    clear.hidden = !query;
    if (!query) status.textContent = '';
    else if (shown === 0) status.textContent = 'Nicio selecție găsită.';
    else status.textContent = `${shown} ${shown === 1 ? 'rezultat' : 'rezultate'} în filtrul curent`;
  }

  input.addEventListener('input', applySearch);
  clear?.addEventListener('click', () => {
    input.value = '';
    input.focus();
    applySearch();
  });

  surprise?.addEventListener('click', () => {
    const cards = visibleCards();
    if (!cards.length) {
      status.textContent = 'Nu există nicio piesă disponibilă în filtrul curent.';
      return;
    }
    const card = cards[Math.floor(Math.random() * cards.length)];
    card.click();
  });

  const observer = new MutationObserver(() => applySearch());
  observer.observe(feed, { childList: true, subtree: false });

  function syncThemeColor() {
    if (!themeMeta) return;
    themeMeta.content = document.documentElement.dataset.theme === 'dark' ? '#090909' : '#f4f1ea';
  }
  syncThemeColor();
  new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  applySearch();
})();
