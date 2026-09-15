const DB_URL='https://rgfskjparcoowotqfvju.supabase.co';

async function db(path,{method='GET',body}={}){
  const key=process.env.SRGU_DB_KEY;
  if(!key) throw new Error('Cheia server pentru baza de date nu este configurată');
  const r=await fetch(`${DB_URL}/rest/v1/${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});
  const text=await r.text();
  if(!r.ok) throw new Error(text||`Database ${r.status}`);
  return text?JSON.parse(text):null;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {password,action,...payload}=req.body||{};
  const adminPassword=process.env.ADMIN_PASSWORD;
  if(!adminPassword) return res.status(500).json({error:'Parola Admin nu este configurată în Vercel'});
  if(password!==adminPassword) return res.status(401).json({error:'Parolă greșită'});
  try{
    if(action==='verify') return res.status(200).json({ok:true});
    if(action==='addTrack'){
      const t=payload.track||{};
      const rows=await db('tracks?select=sort_order&order=sort_order.desc&limit=1');
      const next=(rows?.[0]?.sort_order||0)+10;
      await db('tracks',{method:'POST',body:{yt:t.yt,title:t.title,artist:t.artist||'',views:t.views||'',own:!!t.own,sort_order:next}});
      return res.status(200).json({ok:true});
    }
    if(action==='updateTrack'){
      await db(`tracks?id=eq.${encodeURIComponent(payload.id)}`,{method:'PATCH',body:payload.patch||{}});
      return res.status(200).json({ok:true});
    }
    if(action==='deleteTrack'){
      await db(`tracks?id=eq.${encodeURIComponent(payload.id)}`,{method:'DELETE'});
      return res.status(200).json({ok:true});
    }
    if(action==='reorder'){
      const ids=payload.ids||[],orders=payload.orders||[];
      for(let i=0;i<ids.length;i++) await db(`tracks?id=eq.${encodeURIComponent(ids[i])}`,{method:'PATCH',body:{sort_order:orders[i]}});
      return res.status(200).json({ok:true});
    }
    if(action==='saveAd'){
      const a=payload.ad||{};
      await db('site_config?id=eq.main',{method:'PATCH',body:{ad_active:!!a.active,ad_title:a.title||'',ad_desc:a.desc||'',ad_img:a.img||'',ad_url:a.url||''}});
      return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:'Acțiune necunoscută'});
  }catch(e){return res.status(500).json({error:e.message||'Eroare server'});}
}
