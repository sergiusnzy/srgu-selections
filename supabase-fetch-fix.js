(() => {
  'use strict';
  const originalFetch = window.fetch.bind(window);
  const SUPABASE_ORIGIN = 'https://rgfskjparcoowotqfvju.supabase.co';
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.startsWith(SUPABASE_ORIGIN + '/rest/v1/tracks')) {
      return originalFetch('/api/public?resource=tracks', { method: 'GET', cache: 'no-store' });
    }
    if (url.startsWith(SUPABASE_ORIGIN + '/rest/v1/site_config')) {
      return originalFetch('/api/public?resource=config', { method: 'GET', cache: 'no-store' });
    }
    return originalFetch(input, init);
  };
})();
