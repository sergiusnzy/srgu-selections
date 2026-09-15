(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.startsWith('https://rgfskjparcoowotqfvju.supabase.co/')) {
      const headers = new Headers(init.headers || {});
      const auth = headers.get('Authorization') || '';
      if (auth.startsWith('Bearer sb_publishable_')) headers.delete('Authorization');
      init = { ...init, headers };
    }
    return originalFetch(input, init);
  };
})();
