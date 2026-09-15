(() => {
  'use strict';
  const SUPABASE_ORIGIN='https://rgfskjparcoowotqfvju.supabase.co';
  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,init={})=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url.startsWith(SUPABASE_ORIGIN+'/rest/v1/')){
      const headers=new Headers(init.headers||{});
      const auth=headers.get('Authorization');
      if(auth && auth.startsWith('Bearer sb_publishable_')) headers.delete('Authorization');
      init={...init,headers};
    }
    return originalFetch(input,init);
  };
})();
