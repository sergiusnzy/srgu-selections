const DB_URL='https://rgfskjparcoowotqfvju.supabase.co';

async function db(path){
  const key=process.env.SRGU_DB_KEY;
  if(!key) throw new Error('SRGU_DB_KEY nu este configurată');
  const r=await fetch(`${DB_URL}/rest/v1/${path}`,{
    headers:{
      apikey:key,
      Authorization:`Bearer ${key}`,
      'Content-Type':'application/json'
    }
  });
  const text=await r.text();
  if(!r.ok) throw new Error(text||`Database ${r.status}`);
  return text?JSON.parse(text):null;
}

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    if(req.query.resource==='tracks'){
      const rows=await db('tracks?select=*&order=sort_order.asc,created_at.asc');
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json(rows||[]);
    }
    if(req.query.resource==='config'){
      const rows=await db('site_config?id=eq.main&select=*');
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json(rows||[]);
    }
    return res.status(400).json({error:'Invalid resource'});
  }catch(e){
    return res.status(500).json({error:e.message||'Eroare server'});
  }
}
