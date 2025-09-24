
// ===== Frasi sintetiche per referto =====
const REFERTI = {
  sinus_normal: "Funzione diastolica nei limiti, senza evidenza di aumento delle pressioni di riempimento ventricolare sinistro.",
  sinus_g1_lap_normal: "Pattern di rilasciamento alterato (grado I), senza incremento significativo delle pressioni di riempimento ventricolare sinistro.",
  sinus_g2_lap_high: "Pattern pseudonormale (grado II), con evidenza di aumento delle pressioni di riempimento ventricolare sinistro.",
  sinus_g3_lap_high: "Pattern diastolico restrittivo (grado III), con marcato aumento delle pressioni di riempimento ventricolare sinistro.",
  sinus_indet: "Valutazione diastolica indeterminata per dati non concordanti o incompleti.",

  af_normal: "In fibrillazione atriale: profilo compatibile con pressioni di riempimento non aumentate a riposo.",
  af_highlap: "In fibrillazione atriale: reperti coerenti con aumento delle pressioni di riempimento ventricolare sinistro a riposo.",
  af_indet: "In fibrillazione atriale: valutazione indeterminata per variabilità o dati non conclusivi.",

  valv_lap_normal: "In presenza di valvulopatia: indici complessivi non indicativi di aumento delle pressioni di riempimento ventricolare sinistro.",
  valv_lap_high: "In presenza di valvulopatia: indici complessivi coerenti con aumento delle pressioni di riempimento ventricolare sinistro.",
  valv_indet: "In presenza di valvulopatia: interpretazione indeterminata; inquadrare nel contesto emodinamico e nella severità della lesione.",

  htx_lap_normal: "Dopo trapianto cardiaco: profilo compatibile con pressioni di riempimento non aumentate.",
  htx_lap_high: "Dopo trapianto cardiaco: reperti coerenti con aumento delle pressioni di riempimento ventricolare sinistro.",
  htx_indet: "Dopo trapianto cardiaco: valutazione indeterminata; necessaria integrazione clinico-strumentale.",

  ph_precap: "Assetto compatibile con ipertensione polmonare pre-capillare, senza chiara evidenza di aumento delle pressioni di riempimento sinistro.",
  ph_postcap: "Assetto compatibile con ipertensione polmonare post-capillare (gruppo II), suggestivo di aumento delle pressioni di riempimento sinistro.",
  ph_indet: "Classificazione dell’ipertensione polmonare indeterminata sulla base dei parametri disponibili.",

  block_lap_normal: "Con blocco di branca/pacing: quadro non indicativo di aumento delle pressioni di riempimento sinistro.",
  block_lap_high: "Con blocco di branca/pacing: indici concordi per aumento delle pressioni di riempimento sinistro.",
  block_indet: "Con blocco di branca/pacing: valutazione indeterminata (possibile fusione di onde o dati discordanti).",

  restr_highprob: "Profilo restrittivo/infiltrativo probabile, con verosimile aumento delle pressioni di riempimento sinistro.",
  restr_lowprob: "Bassa probabilità di pattern restrittivo; assenza di segni di incremento pressorio a riposo.",
  restr_indet: "Pattern restrittivo non definibile con i parametri disponibili.",

  costr_compatible: "Quadro compatibile con pericardite costrittiva (dinamica respiratoria e indici annulari suggestivi).",
  costr_unlikely: "Reperti poco compatibili con pericardite costrittiva.",
  costr_indet: "Compatibilità con costrizione pericardica indeterminata.",

  hcm_highfill: "Cardiomiopatia ipertrofica: reperti indicativi di riempimento elevato del ventricolo sinistro.",
  hcm_normal: "Cardiomiopatia ipertrofica: assenza di evidenza di riempimento elevato a riposo.",
  hcm_indet: "Cardiomiopatia ipertrofica: valutazione indeterminata."
};

// ===== Shared Helpers =====
function val(n){ const v = Number(String(n).replace(',', '.')); return Number.isFinite(v)? v : NaN; }
function badge(status){ if(status==='ok') return '🟢 Normale'; if(status==='bad') return '🔴 Aumentata'; return '🟡 Indeterminata'; }
function setResult(boxId, detId, status, title, details){
  const box = document.getElementById(boxId); const det = document.getElementById(detId);
  if(!box || !det) return;
  box.style.display = 'block'; det.style.display = 'block';
  box.className = 'status ' + (status||'warn');
  box.innerHTML = `<strong>${badge(status)}</strong> — ${title}`;
  det.innerHTML = details;
  scrollToBox(box);
}
function copyReport(text){ try{ navigator.clipboard.writeText(text); toast('Copiato negli appunti'); } catch(e){ console.log(e); } }
function toast(msg){
  let t = document.getElementById('toast');
  if(!t){ t = document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:9999'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity='1'; setTimeout(()=>{ t.style.opacity='0'; }, 1400);
}
function showWarnUnder(el, msg){
  let s = el.nextElementSibling;
  if(!s || !s.classList || !s.classList.contains('field-warn')){
    s = document.createElement('div'); s.className='field-warn'; s.style.cssText='color:#b45309;font-size:12px;margin-top:4px'; el.parentNode.appendChild(s);
  }
  s.textContent = msg;
}
function clearWarn(el){ let s = el.nextElementSibling; if(s && s.classList && s.classList.contains('field-warn')) s.textContent=''; }
function scrollToBox(el){ try{ el.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){} }

// ===== Soft field validation =====
document.addEventListener('input', (e)=>{
  const inp = e.target; if(!(inp instanceof HTMLInputElement)) return; if(inp.type!=='number') return;
  const id = inp.id || ''; const v = Number(String(inp.value).replace(',','.')); if(!Number.isFinite(v)){ clearWarn(inp); return; }
  let ok=true, msg=''; if(/ea\b/i.test(id)) { if(v<0 || v>3.5){ ok=false; msg='E/A atteso 0–3.5'; } }
  if(/tr/i.test(id)) { if(v<0 || v>5){ ok=false; msg='TR tipico 0–5 m/s'; } }
  if(/lavi/i.test(id)) { if(v<5 || v>150){ ok=false; msg='LAVi atteso 5–150 mL/m²'; } }
  if(/ee|e_e/i.test(id)) { if(v<3 || v>35){ ok=false; msg='E/e′ tipico 3–35'; } }
  if(/pasp/i.test(id)) { if(v<10 || v>120){ ok=false; msg='PASP atteso 10–120 mmHg'; } }
  if(/lars/i.test(id)) { if(v<5 || v>45){ ok=false; msg='LARS tipico 5–45%'; } }
  if(/dt\b/i.test(id)) { if(v<60 || v>300){ ok=false; msg='DT tipico 60–300 ms'; } }
  if(/ivrt/i.test(id)) { if(v<30 || v>150){ ok=false; msg='IVRT tipico 30–150 ms'; } }
  if(/eprime|e′|e_med|e_mediale/i.test(id)) { if(v<1 || v>20){ ok=false; msg='e′ tipico 1–20 cm/s'; } }
  if(!ok) showWarnUnder(inp, msg); else clearWarn(inp);
});

// ===== Root routing (one page visible) =====
(function(){
  const pages = Array.from(document.querySelectorAll('[data-route]')); if(!pages.length) return;
  const tabs = Array.from(document.querySelectorAll('#rootTabs .tab'));
  function show(id){
    pages.forEach(p => p.classList.remove('active')); const target = document.querySelector(id);
    if(target){ target.classList.add('active'); window.scrollTo({top:0, behavior:'smooth'}); }
    tabs.forEach(t => t.classList.remove('active')); const current = tabs.find(t => t.getAttribute('data-target')===id);
    if(current){ current.classList.add('active'); tabs.forEach(t => t.setAttribute('aria-selected', t===current ? 'true' : 'false')); }
  }
  const active = pages.find(p => p.classList.contains('active')) || pages[0]; pages.forEach(p => p.classList.remove('active')); if(active) active.classList.add('active');
  tabs.forEach(tab => tab.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); show(tab.getAttribute('data-target')); }));
})();

// ===== Special tabs isolation =====
(function(){
  const tabs = Array.from(document.querySelectorAll('#spTabs .tab'));
  const ids = ['#sp_valv','#sp_htx','#sp_ph','#sp_block','#sp_restr','#sp_costr','#sp_hcm'];
  const panels = ids.map(s=>document.querySelector(s)).filter(Boolean);
  function show(id){ panels.forEach(p=>p.classList.remove('active')); const t = document.querySelector(id); if(t) t.classList.add('active');
    tabs.forEach(x=>x.classList.remove('active')); const cur = tabs.find(x=>x.getAttribute('data-target')===id); if(cur) cur.classList.add('active'); }
  if(tabs.length){ show(tabs[0].getAttribute('data-target')); tabs.forEach(t=> t.addEventListener('click', ()=> show(t.getAttribute('data-target')) )); }
})();

// ===== Force Update (cache clear) =====
async function forceUpdate(){
  try{
    if('serviceWorker' in navigator){
      const reg = await navigator.serviceWorker.getRegistration();
      if(reg){ if (reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'}); await reg.update(); await reg.unregister(); }
    }
    if('caches' in window){ const keys = await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
  }catch(e){ console.log(e); }
  const url = new URL(window.location.href); url.searchParams.set('v', Date.now()); window.location.replace(url.toString());
}
document.getElementById('forceUpdateBtn')?.addEventListener('click', forceUpdate);

// ===== Autosave + Unit Hints =====
(function persistInputs(){
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec=>{
    const sid = sec.id || '';
    try{ const saved = JSON.parse(localStorage.getItem('nuragica:'+sid) || '{}');
      Object.entries(saved).forEach(([id,val])=>{ const el = sec.querySelector('#'+id); if(el) el.value = String(val); });
    }catch(e){}
    sec.addEventListener('input', (e)=>{
      const t = e.target; if(!t.id) return; const data = JSON.parse(localStorage.getItem('nuragica:'+sid) || '{}'); data[t.id] = t.value;
      localStorage.setItem('nuragica:'+sid, JSON.stringify(data));
    });
  });
})();
(function unitsHints(){
  const unitMap = [
    {match:/\btr\b/i, text:'m/s'},
    {match:/pasp/i, text:'mmHg'},
    {match:/lavi/i, text:'mL/m²'},
    {match:/eprime|e′|e_med|e_mediale/i, text:'cm/s'},
    {match:/ee|e_e/i, text:'(unitless)'},
    {match:/dt|ivrt/i, text:'ms'},
    {match:/lars/i, text:'%'},
    {match:/ea\b/i, text:'rapporto'}
  ];
  document.querySelectorAll('input[type=number], input[type=text], select').forEach(el=>{
    const id = el.id || ''; const cfg = unitMap.find(u=>u.match.test(id)); if(!cfg) return;
    if(el.nextElementSibling?.classList?.contains('unit-hint')) return; const hint = document.createElement('small');
    hint.className='unit-hint'; hint.style.cssText='display:block;color:#64748b;font-size:12px;margin-top:4px;'; hint.textContent = cfg.text; el.parentNode.appendChild(hint);
  });
})();

// ===== Universal Reset Buttons =====
(function(){
  function resetSection(section){
    if(!section) return;
    section.querySelectorAll('input[type=number], input[type=text]').forEach(inp=>{ inp.value=''; });
    section.querySelectorAll('select').forEach(sel=>{ sel.selectedIndex = 0; });
    section.querySelectorAll('.field-warn').forEach(n=>{ n.textContent=''; });
    section.querySelectorAll('.status').forEach(b=>{ b.style.display='none'; });
    section.querySelectorAll('[id$="Details"]').forEach(d=>{ d.style.display='none'; d.innerHTML=''; });
  }
  document.querySelectorAll('.section').forEach(sec=>{
    const btn = sec.querySelector('button.reset');
    if(btn) btn.addEventListener('click', ()=> resetSection(sec));
  });
})();

function avgAvailable(values){ const arr = values.filter(v => Number.isFinite(v)); if(!arr.length) return NaN; return arr.reduce((a,b)=>a+b,0)/arr.length; }

// ===== Core Algorithms =====
// Sinus rhythm
document.getElementById('calcSinus')?.addEventListener('click', ()=>{
  const eSep = val(document.getElementById('sin_eprime_sep').value);
  const eLat = val(document.getElementById('sin_eprime_lat').value);
  const E = val(document.getElementById('sin_E').value);
  const ea = val(document.getElementById('sin_ea').value);
  const tr = val(document.getElementById('sin_tr').value);
  const lavi = val(document.getElementById('sin_lavi').value);

  const eavg = avgAvailable([eSep, eLat]);
  const ee = (Number.isFinite(E) && Number.isFinite(eavg) && eavg>0) ? E/eavg : NaN;

  const crit=[];
  if(Number.isFinite(eSep) && eSep<7) crit.push("e′ settale <7");
  if(Number.isFinite(eLat) && eLat<10) crit.push("e′ laterale <10");
  if(Number.isFinite(ee) && ee>14) crit.push("E/e′ >14");
  if(Number.isFinite(tr) && tr>=2.8) crit.push("TR ≥2.8");
  if(Number.isFinite(lavi) && lavi>34) crit.push("LAVi >34");

  let status='warn', title='Valutazione sinusale';
  let grade='—', lap='—';

  // Presence of DD
  let positives = 0;
  positives += (Number.isFinite(ee) && ee>14)?1:0;
  positives += (Number.isFinite(tr) && tr>=2.8)?1:0;
  positives += (Number.isFinite(lavi) && lavi>34)?1:0;
  positives += ((Number.isFinite(eSep)&&eSep<7)||(Number.isFinite(eLat)&&eLat<10))?1:0;

  let dd = null;
  if(positives>=3) dd = true;
  else if(positives<=1) dd = false;

  // Grading
  if(Number.isFinite(ea)){
    if(ea>=2){ grade='Grado 3 (restrittivo)'; lap='alta'; status='bad'; }
    else if(ea<=0.8){
      if(Number.isFinite(E) && E<=50){ grade='Grado 1 (rilasciamento alterato)'; lap='normale'; status = (dd===false?'ok':'warn'); }
      else {
        const sup = [(Number.isFinite(ee)&&ee>14),(Number.isFinite(tr)&&tr>=2.8),(Number.isFinite(lavi)&&lavi>34)].filter(Boolean).length;
        if(sup>=2){ grade='Grado 2'; lap='alta'; status='bad'; }
        else { grade='Grado 1'; lap='normale'; status= dd===false?'ok':'warn'; }
      }
    } else {
      const sup = [(Number.isFinite(ee)&&ee>14),(Number.isFinite(tr)&&tr>=2.8),(Number.isFinite(lavi)&&lavi>34)].filter(Boolean).length;
      if(sup>=2){ grade='Grado 2'; lap='alta'; status='bad'; }
      else { grade='Grado 1'; lap='normale/indet'; status = (dd===false?'ok':'warn'); }
    }
  }

  let key = 'sinus_indet';
  if (grade && /Grado 3/i.test(grade)) key = 'sinus_g3_lap_high';
  else if (grade && /Grado 2/i.test(grade)) key = 'sinus_g2_lap_high';
  else if (grade && /Grado 1/i.test(grade) && lap && /normale/i.test(lap)) key = 'sinus_g1_lap_normal';
  else if (dd===false) key = 'sinus_normal';

  const report = `Sinusale → ${badge(status)}. DD: ${dd===true?'presente':dd===false?'assente':'indeterminata'}; Grado: ${grade}; Criteri: ${crit.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">E/e′</div><div>${Number.isFinite(ee)?ee.toFixed(1):'—'}</div></div>
  <div class="kv"><div class="k">LAP</div><div>${lap}</div></div>
  <div class="kv"><div class="k">Grado</div><div>${grade}</div></div>
  <div class="kv"><div class="k">Criteri</div><div>${crit.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('sinusResult','sinusDetails',status,`${grade} — ${dd===true?'DD presente':dd===false?'DD assente':'DD indeterminata'}`,details);
});

// AF
document.getElementById('calcAF')?.addEventListener('click', ()=>{
  const E = val(document.getElementById('af_E').value);
  const ee_sep = val(document.getElementById('af_ee_sep').value);
  const tr = val(document.getElementById('af_tr').value);
  const dt = val(document.getElementById('af_dt').value);
  const lavi = val(document.getElementById('af_lavi').value);

  const crit=[];
  if(Number.isFinite(ee_sep) && ee_sep>11) crit.push('E/e′ settale >11');
  if(Number.isFinite(tr) && tr>=2.8) crit.push('TR ≥2.8');
  if(Number.isFinite(lavi) && lavi>34) crit.push('LAVi >34');
  if(Number.isFinite(dt) && dt<160 && dt>0) crit.push('DT <160 ms');

  let status='warn', title='LAP indeterminata (FA)';
  if(crit.length>=2){ status='bad'; title='LAP aumentata (FA)'; }
  else if(crit.length===0){ status='ok'; title='LAP probabilmente normale (FA)'; }

  let key = (status==='bad') ? 'af_highlap' : (status==='ok' ? 'af_normal' : 'af_indet');

  const report = `FA → ${badge(status)}. Criteri: ${crit.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Criteri</div><div>${crit.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('afResult','afDetails',status,title,details);
});

// Valvulopatie
document.getElementById('calcValv')?.addEventListener('click', ()=>{
  const type = document.getElementById('valv_type').value;
  const ee = val(document.getElementById('valv_ee').value);
  const tr = val(document.getElementById('valv_tr').value);
  const pasp = val(document.getElementById('valv_pasp').value);
  const pv = val(document.getElementById('valv_pv_sd').value);
  const lavi = val(document.getElementById('valv_lavi').value);
  const ara = val(document.getElementById('valv_ar_a').value);

  const crit=[];
  if(Number.isFinite(ee) && ee>=14) crit.push('E/e′ ≥14');
  if( (Number.isFinite(tr) && tr>=2.8) || (Number.isFinite(pasp) && pasp>=35) ) crit.push('TR ≥2.8 o PASP ≥35');
  if(Number.isFinite(pv) && pv<=0.67) crit.push('PV S/D ≤0.67');
  if(Number.isFinite(lavi) && lavi>34) crit.push('LAVi >34');
  if(Number.isFinite(ara) && ara>30) crit.push('Ar–A >30 ms');

  let status='warn', title='LAP indeterminata (valvulopatia)';
  const notes=[];
  if(type in {MR:1, MS:1, MAC:1}){
    notes.push('Per MR severa, MS o MAC moderata–severa usare criteri dedicati.');
  }
  if(crit.length>=2){ status='bad'; title='LAP aumentata probabile (valvulopatia)'; }
  if(crit.length===0){ status='ok'; title='LAP probabilmente normale (valvulopatia)'; }

  let key = (status==='bad') ? 'valv_lap_high' : (status==='ok' ? 'valv_lap_normal' : 'valv_indet');

  const report = `Valvulopatie (${type}) → ${badge(status)}. Criteri: ${crit.join(', ')||'nessuno'}.`;
  const details = `<div class="kv"><div class="k">Criteri</div><div>${crit.join(', ')||'—'}</div></div>
  ${notes.length?('<hr><ul><li>'+notes.join('</li><li>')+'</li></ul>'):''}
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('valvResult','valvDetails',status,title,details);
});

// Trapianto cardiaco
document.getElementById('calcHtx')?.addEventListener('click', ()=>{
  const eprime = val(document.getElementById('htx_eprime').value);
  const ee = val(document.getElementById('htx_ee').value);
  const tr = val(document.getElementById('htx_tr').value);
  const pv = val(document.getElementById('htx_pv_sd').value);
  const lavi = val(document.getElementById('htx_lavi').value);

  let status='warn', title='LAP indeterminata (trapianto)';
  const crit=[]; const pathway=[];
  if(Number.isFinite(ee)){
    if(ee<7){ status='ok'; title='LAP normale (trapianto)'; pathway.push('E/e′ <7'); }
    else if(ee>14){ status='bad'; title='LAP elevata (trapianto)'; pathway.push('E/e′ >14'); }
    else {
      if(Number.isFinite(tr)){
        if(tr<=2.8){ status='ok'; title='LAP normale (trapianto; via TR)'; pathway.push('E/e′ 7–14 + TR ≤2.8'); }
        else { status='bad'; title='LAP elevata (trapianto; via TR)'; pathway.push('E/e′ 7–14 + TR >2.8'); }
      } else {
        if(Number.isFinite(pv) && pv<=0.67) crit.push('PV S/D ≤0.67');
        if(Number.isFinite(lavi) && lavi>34) crit.push('LAVi >34');
        if(Number.isFinite(eprime) && eprime<=6.5) crit.push('e′ ridotta');
        if(crit.length>=1){ status='bad'; title='LAP elevata probabile (trapianto; supporto)'; }
      }
    }
  }

  let key = (status==='bad') ? 'htx_lap_high' : (status==='ok' ? 'htx_lap_normal' : 'htx_indet');

  const repBits = pathway.concat(crit);
  const report = `Trapianto → ${badge(status)}. Criteri: ${repBits.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Percorso</div><div>${pathway.join(', ')||'—'}</div></div>
  <div class="kv"><div class="k">Supporto</div><div>${crit.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('htxResult','htxDetails',status,title,details);
});

// Ipertensione polmonare
document.getElementById('calcPH')?.addEventListener('click', ()=>{
  const ea = val(document.getElementById('ph_ea').value);
  const eel = val(document.getElementById('ph_ee_lat').value);
  const lavi = val(document.getElementById('ph_lavi').value);
  const lars = val(document.getElementById('ph_lars').value);

  let status='warn', title='Indeterminato (PH)';
  let subtype='—'; const support=[];
  if(Number.isFinite(ea)){
    if(ea<=0.8){ subtype='pre‑capillare'; status='ok'; title='Probabile PH pre‑capillare'; }
    else if(ea>=2){ subtype='post‑capillare (gruppo II)'; status='bad'; title='Probabile PH post‑capillare (gruppo II)'; }
    else {
      if(Number.isFinite(eel) && eel>13) support.push('E/e′ lat >13');
      if(Number.isFinite(lavi) && lavi>34) support.push('LAVi >34');
      if(Number.isFinite(lars) && lars<=16) support.push('LARS ≤16%');
      if(support.length>=1){ status='bad'; title='PH post‑capillare più probabile'; }
    }
  }

  let key = 'ph_indet';
  if (subtype && /pre/i.test(subtype)) key = 'ph_precap';
  else if (subtype && /post/i.test(subtype)) key = 'ph_postcap';
  else key = (status==='bad') ? 'ph_postcap' : (status==='ok' ? 'ph_precap' : 'ph_indet');

  const report = `PH → ${badge(status)}. Classificazione: ${subtype}. Supporto: ${support.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Classificazione</div><div>${subtype}</div></div>
  <div class="kv"><div class="k">Supporto</div><div>${support.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('phResult','phDetails',status,title,details);
});

// Blocco / LBBB / Pacing
document.getElementById('calcBlock')?.addEventListener('click', ()=>{
  const ea = val(document.getElementById('block_ea').value);
  const ee = val(document.getElementById('block_ee').value);
  const tr = val(document.getElementById('block_tr').value);
  const lavi = val(document.getElementById('block_lavi').value);
  const lars = val(document.getElementById('block_lars').value);

  const flags=[];
  if(Number.isFinite(ee) && ee>=14) flags.push('E/e′ ≥14');
  if(Number.isFinite(tr) && tr>=2.8) flags.push('TR ≥2.8');
  if(Number.isFinite(lavi) && lavi>34) flags.push('LAVi >34');
  if(Number.isFinite(lars) && lars<=18) flags.push('LARS ≤18%');

  let status='warn', title='LAP indeterminata (blocco/pacing)';
  if(flags.length>=2){ status='bad'; title='LAP aumentata probabile (blocco/pacing)'; }
  if(flags.length===0 && Number.isFinite(ea) && ea<=0.8){ status='ok'; title='Rilasciamento alterato probabile (E/A ≤0.8)'; }

  let key = (status==='bad') ? 'block_lap_high' : (status==='ok' ? 'block_lap_normal' : 'block_indet');

  const report = `Blocco/LBBB/Pacing → ${badge(status)}. Criteri: ${flags.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Criteri</div><div>${flags.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('blockResult','blockDetails',status,title,details);
});

// Restrittiva / Amiloidosi
document.getElementById('calcRestr')?.addEventListener('click', ()=>{
  const ea = val(document.getElementById('restr_ea').value);
  const dt = val(document.getElementById('restr_dt').value);
  const ivrt = val(document.getElementById('restr_ivrt').value);
  const epm = val(document.getElementById('restr_eprime_med').value);
  const apex = document.getElementById('restr_apex').value;

  const flags=[];
  if(Number.isFinite(ea) && ea>=2.5) flags.push('E/A ≥2.5');
  if(Number.isFinite(dt) && dt<150 && dt>0) flags.push('DT <150 ms');
  if(Number.isFinite(ivrt) && ivrt<50 && ivrt>0) flags.push('IVRT <50 ms');
  if(Number.isFinite(epm) && epm<=4) flags.push('e′ mediale ≤4 cm/s');
  if(apex==='si') flags.push('Apical‑sparing GLS');

  let status='warn', title='Compatibilità non definita (restrittiva)';
  if(flags.length>=3){ status='bad'; title='Alta probabilità di pattern restrittivo'; }
  else if(flags.length===0){ status='ok'; title='Bassa probabilità di pattern restrittivo'; }

  let key = (status==='bad') ? 'restr_highprob' : (status==='ok' ? 'restr_lowprob' : 'restr_indet');

  const report = `Restrittiva/Amiloidosi → ${badge(status)}. Indici: ${flags.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Indici</div><div>${flags.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('restrResult','restrDetails',status,title,details);
});

// Pericardite costrittiva
document.getElementById('calcCostr')?.addEventListener('click', ()=>{
  const vm = val(document.getElementById('costr_resp_mitral').value);
  const vt = val(document.getElementById('costr_resp_tric').value);
  const epm = val(document.getElementById('costr_eprime_med').value);
  const rev = document.getElementById('costr_reversus').value;

  const flags=[];
  if(Number.isFinite(vm) && vm>=25) flags.push('Δ mitralica ≥25%');
  if(Number.isFinite(vt) && vt>=40) flags.push('Δ tricuspidale ≥40%');
  if(Number.isFinite(epm) && epm>=7) flags.push('e′ mediale ≥7 cm/s');
  if(rev==='si') flags.push('Hepatic vein diastolic reversus');

  let status='warn', title='Pericardite costrittiva non definita';
  if(flags.length>=2){ status='bad'; title='Compatibile con pericardite costrittiva'; }
  else if(flags.length===0){ status='ok'; title='Poco compatibile con costrizione'; }

  let key = (status==='bad') ? 'costr_compatible' : (status==='ok' ? 'costr_unlikely' : 'costr_indet');

  const report = `Costrizione pericardica → ${badge(status)}. Segni: ${flags.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Segni</div><div>${flags.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('costrResult','costrDetails',status,title,details);
});

// HCM
document.getElementById('calcHcm')?.addEventListener('click', ()=>{
  const ee = val(document.getElementById('hcm_ee').value);
  const ea = val(document.getElementById('hcm_ea').value);
  const lavi = val(document.getElementById('hcm_lavi').value);
  const tr = val(document.getElementById('hcm_tr').value);

  const flags=[];
  if(Number.isFinite(ee) && ee>14) flags.push('E/e′ >14');
  if(Number.isFinite(ea) && ea>=2) flags.push('E/A ≥2');
  if(Number.isFinite(lavi) && lavi>34) flags.push('LAVi >34');
  if(Number.isFinite(tr) && tr>=2.8) flags.push('TR ≥2.8');

  let status='warn', title='Valutazione HCM';
  if(flags.length>=2){ status='bad'; title='Evidenza di riempimento elevato (HCM)'; }
  else if(flags.length===0){ status='ok'; title='Assenza di segni di riempimento elevato (HCM)'; }

  let key = (status==='bad') ? 'hcm_highfill' : (status==='ok' ? 'hcm_normal' : 'hcm_indet');

  const report = `HCM → ${badge(status)}. Indicatori: ${flags.join(', ')||'—'}.`;
  const details = `<div class="kv"><div class="k">Indicatori</div><div>${flags.join(', ')||'—'}</div></div>
  <p><button class="btn" onclick="copyReport('${report.replace(/'/g,"\\'")}')">📋 Copia risultato</button></p>
  <p class="hint">${REFERTI[key]||''}</p>`;
  setResult('hcmResult','hcmDetails',status,title,details);
});

// ===== Service Worker registration (GitHub Pages safe) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(()=>{});
  });
}
