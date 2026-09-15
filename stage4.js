(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const toast=msg=>{const e=document.createElement('div');e.className='toast';e.textContent=msg;$('#toasts')?.append(e);setTimeout(()=>e.remove(),2400)};
const parseYT=s=>{const v=String(s||'').trim();if(/^[A-Za-z0-9_-]{11}$/.test(v))return v;const m=v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);return m?.[1]||''};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let inbox=[];

function adminPassword(){return sessionStorage.getItem('srgu_stage2_admin')||''}
async function adminCall(action,payload={}){
  const password=adminPassword();
  if(!password) throw new Error('Deschide din nou Admin și introdu parola.');
  const r=await fetch('/api/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password,action,...payload})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Eroare Admin');return d;
}
function openModal(id){const m=$('#'+id);if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false')}
function closeModal(id){const m=$('#'+id);if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true')}

function ensureUi(){
  if(!document.querySelector('link[href="/stage4.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/stage4.css';document.head.append(l)}
  if(!$('#submitSongBtn')){const b=document.createElement('button');b.id='submitSongBtn';b.className='submit-song-btn';b.type='button';b.textContent='↗ Trimite o piesă';$('.smart-toolbar')?.append(b)}
  if(!$('#submissionsBtn')){const b=document.createElement('button');b.id='submissionsBtn';b.className='inbox-btn';b.type='button';b.innerHTML='Recomandări <span class="inbox-count" id="inboxCount">0</span>';$('#adminModal .tabs')?.append(b)}
  if(!$('#submitSongModal')) document.body.insertAdjacentHTML('beforeend',`
    <div class="modal" id="submitSongModal" aria-hidden="true"><button class="backdrop" data-stage4-close="submitSongModal" aria-label="Închide"></button><section class="dialog small"><div class="modal-head"><div><span class="eyebrow">Ai găsit ceva bun?</span><h3>Trimite o piesă</h3></div><button class="round" data-stage4-close="submitSongModal">×</button></div><div class="admin-scroll"><div class="submit-copy"><p>Trimite-mi linkul. Dacă îmi place, o public în SRGU Selections.</p><p>Fără cont, fără email.</p></div><form id="submitSongForm" class="form submit-form"><label>Link YouTube<input id="submitUrl" type="url" placeholder="https://youtu.be/…" required></label><label>Mesaj opțional<textarea id="submitMessage" rows="3" maxlength="500" placeholder="Unde ai descoperit-o sau ce ți-a plăcut?"></textarea></label><label class="hp-field">Website<input id="submitWebsite" type="text" tabindex="-1" autocomplete="off"></label><button class="btn solid" type="submit">Trimite recomandarea</button><p class="hint">Recomandarea ajunge doar în inboxul Admin și nu apare public automat.</p></form></div></section></div>`);
  if(!$('#submissionsModal')) document.body.insertAdjacentHTML('beforeend',`
    <div class="modal" id="submissionsModal" aria-hidden="true"><button class="backdrop" data-stage4-close="submissionsModal" aria-label="Închide"></button><section class="dialog"><div class="modal-head"><div><span class="eyebrow">Inbox curator</span><h3>Recomandări</h3></div><button class="round" data-stage4-close="submissionsModal">×</button></div><div class="admin-scroll"><div id="submissionList" class="submission-list"><div class="submission-empty">Se încarcă…</div></div></div></section></div>`);
}

async function submitSong(e){
  e.preventDefault();
  const url=$('#submitUrl').value.trim(),yt=parseYT(url);if(!yt)return toast('Link YouTube invalid');
  const last=Number(localStorage.getItem('srgu_last_submission_at')||0);if(Date.now()-last<90000)return toast('Mai așteaptă puțin înainte de o nouă recomandare.');
  const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Se trimite…';
  try{
    const r=await fetch('/api/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,message:$('#submitMessage').value,website:$('#submitWebsite').value})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Nu am putut trimite recomandarea.');
    localStorage.setItem('srgu_last_submission_at',String(Date.now()));e.currentTarget.reset();closeModal('submitSongModal');toast('Recomandare trimisă ✓');
  }catch(err){toast(err.message)}finally{btn.disabled=false;btn.textContent='Trimite recomandarea'}
}

function timeAgo(value){const t=Date.parse(value||'');if(!Number.isFinite(t))return '';const m=Math.max(1,Math.round((Date.now()-t)/60000));if(m<60)return `${m} min`;const h=Math.round(m/60);if(h<24)return `${h} h`;return `${Math.round(h/24)} zile`}
function renderInbox(){
  const box=$('#submissionList');if(!box)return;
  $('#inboxCount').textContent=String(inbox.length);
  if(!inbox.length){box.innerHTML='<div class="submission-empty">Nicio recomandare în așteptare.</div>';return}
  box.innerHTML=inbox.map(s=>`<article class="submission-card" data-id="${esc(s.id)}"><img src="https://i.ytimg.com/vi/${esc(s.yt)}/mqdefault.jpg" alt=""><div class="submission-main"><h4>${esc(s.title||'Titlu necunoscut')}</h4><span class="artist">${esc(s.artist||'Artist necunoscut')}</span>${s.message?`<div class="submission-message">“${esc(s.message)}”</div>`:''}<div class="submission-meta"><span>${esc(timeAgo(s.created_at))}</span><a href="https://youtu.be/${esc(s.yt)}" target="_blank" rel="noopener">Deschide YouTube ↗</a></div></div><div class="submission-actions"><button class="btn solid" data-approve="${esc(s.id)}">Publică</button><button class="btn reject" data-reject="${esc(s.id)}">Respinge</button></div></article>`).join('');
}
async function loadInbox(){
  const box=$('#submissionList');if(box)box.innerHTML='<div class="submission-empty">Se încarcă…</div>';
  try{const d=await adminCall('listSubmissions');inbox=d.submissions||[];renderInbox()}catch(err){if(box)box.innerHTML=`<div class="submission-empty">${esc(err.message)}</div>`}
}
async function review(id,approve){
  const card=$(`.submission-card[data-id="${CSS.escape(id)}"]`);card?.classList.add('busy');
  try{await adminCall(approve?'approveSubmission':'rejectSubmission',{id});inbox=inbox.filter(x=>x.id!==id);renderInbox();toast(approve?'Publicată în colecție ✓':'Recomandare respinsă')}
  catch(err){toast(err.message);card?.classList.remove('busy')}
}

function bind(){
  document.addEventListener('click',e=>{
    if(e.target.closest('#submitSongBtn')){openModal('submitSongModal');return}
    if(e.target.closest('#submissionsBtn')){openModal('submissionsModal');loadInbox();return}
    const c=e.target.closest('[data-stage4-close]');if(c){closeModal(c.dataset.stage4Close);return}
    const a=e.target.closest('[data-approve]');if(a){review(a.dataset.approve,true);return}
    const r=e.target.closest('[data-reject]');if(r){review(r.dataset.reject,false);return}
  },true);
  $('#submitSongForm')?.addEventListener('submit',submitSong);
  $('#gateForm')?.addEventListener('submit',()=>setTimeout(()=>{if(sessionStorage.getItem('srgu_stage2_admin'))loadInbox()},700),true);
}
function init(){ensureUi();bind()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
