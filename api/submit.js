const DB_URL='https://rgfskjparcoowotqfvju.supabase.co';

function parseYT(value){
  const s=String(value||'').trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m=s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  return m?.[1]||'';
}
async function db(path,{method='GET',body}={}){
  const key=process.env.SRGU_DB_KEY;
  if(!key) throw new Error('Database key missing');
  const r=await fetch(`${DB_URL}/rest/v1/${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});
  const text=await r.text();
  if(!r.ok) throw new Error(text||`Database ${r.status}`);
  return text?JSON.parse(text):null;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const body=req.body||{};
    if(body.website) return res.status(200).json({ok:true});
    const yt=parseYT(body.url);
    if(!yt) return res.status(400).json({error:'Link YouTube invalid'});
    const message=String(body.message||'').trim().slice(0,500);

    const dup=await db(`submissions?yt=eq.${encodeURIComponent(yt)}&status=eq.pending&select=id&limit=1`);
    if(dup?.length) return res.status(409).json({error:'Piesa este deja în lista de recomandări.'});

    let title='',artist='';
    try{
      const o=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+yt)}&format=json`);
      if(o.ok){const j=await o.json();title=String(j.title||'').slice(0,200);artist=String(j.author_name||'').slice(0,160)}
    }catch{}
    await db('submissions',{method:'POST',body:{yt,title,artist,message,status:'pending'}});
    return res.status(200).json({ok:true,title,artist});
  }catch(e){return res.status(500).json({error:e.message||'Eroare server'});}
}
