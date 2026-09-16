const DB_URL='https://rgfskjparcoowotqfvju.supabase.co';
const BASE='https://srgu.vercel.app';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanId=s=>/^[A-Za-z0-9_-]{11}$/.test(String(s||''))?String(s):'';

async function db(path){
  const key=process.env.SRGU_DB_KEY;
  if(!key) throw new Error('Database key missing');
  const r=await fetch(`${DB_URL}/rest/v1/${path}`,{headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'}});
  const text=await r.text();
  if(!r.ok) throw new Error(text||`Database ${r.status}`);
  return text?JSON.parse(text):null;
}

function tags(track){
  const out=[];
  if(track.genre)out.push(track.genre);
  if(track.mood)out.push(track.mood);
  if(track.energy)out.push(track.energy);
  if(track.origin)out.push(track.origin);
  if(track.release_year)out.push(String(track.release_year));
  if(Array.isArray(track.tags))out.push(...track.tags.slice(0,8).map(x=>'#'+String(x).replace(/^#+/,'')));
  return out.filter(Boolean);
}

export default async function handler(req,res){
  const id=cleanId(req.query.id);
  if(!id){res.statusCode=404;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<h1>Piesa nu a fost găsită.</h1>');}
  try{
    const rows=await db(`tracks?yt=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const t=rows?.[0];
    if(!t){res.statusCode=404;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<h1>Piesa nu a fost găsită.</h1>');}
    const all=await db('tracks?select=*&order=created_at.desc&limit=40');
    const related=(all||[]).filter(x=>x.yt!==id&&(x.genre===t.genre||x.mood===t.mood||x.origin===t.origin)).slice(0,6);
    const title=`${t.title} — SRGU Selections`;
    const desc=t.curator_note||[t.artist,t.genre,t.mood].filter(Boolean).join(' · ')||'Descoperă piesa în SRGU Selections.';
    const url=`${BASE}/t/${id}`;
    const image=`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    const chips=tags(t).map(x=>`<span>${esc(x)}</span>`).join('');
    const relatedHtml=related.map(x=>`<a class="related-card" href="/t/${esc(x.yt)}"><img src="https://i.ytimg.com/vi/${esc(x.yt)}/mqdefault.jpg" alt=""><div><b>${esc(x.title)}</b><span>${esc(x.artist||'Necunoscut')}</span></div></a>`).join('');
    const html=`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#090909"><title>${esc(title)}</title><meta name="description" content="${esc(desc.slice(0,160))}"><link rel="canonical" href="${url}"><meta property="og:type" content="music.song"><meta property="og:site_name" content="SRGU Selections"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc.slice(0,200))}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc.slice(0,200))}"><meta name="twitter:image" content="${image}"><link rel="icon" href="/srgu-icon.svg" type="image/svg+xml"><link rel="stylesheet" href="/track.css"></head><body><header class="track-top"><a href="/" class="brand">SRGU SELECTIONS</a><a href="/" class="back">Colecție →</a></header><main class="track-shell"><section class="hero"><div class="media"><iframe src="https://www.youtube.com/embed/${id}?rel=0&playsinline=1" title="${esc(t.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><div class="copy"><span class="eyebrow">SRGU selection</span><h1>${esc(t.title)}</h1><p class="artist">${esc(t.artist||'Necunoscut')}</p><div class="chips">${chips}</div>${t.curator_note?`<p class="note">${esc(t.curator_note)}</p>`:''}<div class="actions"><button id="shareTrack">Distribuie ↗</button><a href="https://youtu.be/${id}" target="_blank" rel="noopener">YouTube ↗</a><a href="/?track=${id}">Deschide în player</a></div></div></section>${relatedHtml?`<section class="related"><div class="section-head"><span class="eyebrow">Mai departe</span><h2>Mai multe de explorat</h2></div><div class="related-grid">${relatedHtml}</div></section>`:''}</main><footer><a href="/about.html">Despre</a><a href="/privacy.html">Confidențialitate</a><a href="/terms.html">Termeni</a></footer><script>document.getElementById('shareTrack')?.addEventListener('click',async()=>{const url=location.href;try{if(navigator.share)await navigator.share({title:${JSON.stringify(t.title)},text:${JSON.stringify(t.artist||'SRGU Selections')},url});else{await navigator.clipboard.writeText(url);alert('Link copiat ✓')}}catch{}});</script></body></html>`;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  }catch(e){
    res.statusCode=500;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<h1>Eroare la încărcarea piesei.</h1>');
  }
}
