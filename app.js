
// Tabs (main)
const tabbar = document.getElementById('tabs');
const panels = [...document.querySelectorAll('.panel')];
function showPanel(id){
  panels.forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  [...tabbar.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b.dataset.target===id));
  window.scrollTo({top:0, behavior:'smooth'});
}
tabbar.addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-target]'); if(!b) return; showPanel(b.dataset.target);
});
showPanel('sinus');

// Sub-tabs for special populations
const spTabs = document.getElementById('spTabs');
if(spTabs && !window.__spInit){
  window.__spInit = true;
  const spPanels = [...document.querySelectorAll('.subpanel')];
  function showSp(id){
    spPanels.forEach(p=>p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    [...spTabs.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b.dataset.target===id));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  spTabs.addEventListener('click', (e)=>{
    const b=e.target.closest('button[data-target]'); if(!b) return; showSp(b.dataset.target);
  });
  showSp('sp_valv');
}

// Utils
function v(x){ if(x===null||x===undefined) return null; const s=String(x).replace(',','.'); const n=Number(s); return Number.isFinite(n)? n : null; }
function yes(sel){ return (sel?.value||'')==='si'; }
function pill(label, cls=''){ return `<span class="pill ${cls}">${label}</span>`; }
function headline(t){ return `<div class="headline">${t}</div>`; }
function kv(k,v){ return `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`; }
function copyBlock(text){ return `<div class="copy"><button onclick="navigator.clipboard.writeText(\`${text.replace(/`/g,'\\`')}\`)">Copia risultato</button><span class="k">copiato negli appunti</span></div>`; }
function eAvg(sept, lat){ const arr=[sept,lat].filter(x=>x!=null); if(!arr.length) return null; return arr.reduce((a,b)=>a+b,0)/arr.length; }
function Ee_from(E, eprime){ if(E==null || eprime==null || eprime<=0) return null; return E/eprime; }
function Ee_avg(E, eSept, eLat){ const em = eAvg(eSept, eLat); return Ee_from(E, em); }
function ageThr(age){ if(age==null) return {sept:6, lat:7, avg:6.5}; if(age<40) return {sept:7, lat:10, avg:9}; if(age<=65) return {sept:6, lat:8, avg:7}; return {sept:6, lat:7, avg:6.5}; }
function setInlineMsg(el, text, type='warn'){
  if(!el) return;
  let msg = el.parentElement.querySelector('.inline-msg');
  if(!msg){ msg = document.createElement('div'); msg.className='inline-msg'; el.parentElement.appendChild(msg); }
  msg.className = 'inline-msg ' + (type==='err'?'err':'warn');
  msg.textContent = text;
  el.classList.add('err-field');
}
function clearInlineMsg(el){
  if(!el) return;
  const msg = el.parentElement.querySelector('.inline-msg');
  if(msg) msg.remove();
  el.classList.remove('err-field');
}

// ---------- SINUS ----------
function sinusCalc(){
  const ageEl = document.getElementById('sin_age');
  const Eel = document.getElementById('sin_E');
  const eS = document.getElementById('sin_e_sept');
  const eL = document.getElementById('sin_e_lat');

  const age = v(ageEl.value);
  if(age==null){ setInlineMsg(ageEl,'Inserisci l’età per applicare le soglie di e′.','err'); } else { clearInlineMsg(ageEl); }

  const eSept = v(eS.value);
  const eLat  = v(eL.value);
  const E     = v(Eel.value);
  const EA    = v(document.getElementById('sin_EA').value);
  const TR    = v(document.getElementById('sin_TR').value);
  const PASP  = v(document.getElementById('sin_PASP').value);
  const lavi  = v(document.getElementById('sin_lavi').value);
  const pv_sd = v(document.getElementById('sin_pv_sd').value);
  const lars  = v(document.getElementById('sin_lars').value);
  const ivrt  = v(document.getElementById('sin_ivrt').value);
  const ar_a  = v(document.getElementById('sin_ar_a').value);
  const lwave = v(document.getElementById('sin_lwave').value);
  const pr_ed = v(document.getElementById('sin_pr_ed').value);
  const padp  = v(document.getElementById('sin_padp').value);

  const thr = ageThr(age);
  const eM = eAvg(eSept, eLat);
  const red_e = (eSept!=null && eSept<thr.sept) || (eLat!=null && eLat<thr.lat) || (eM!=null && eM<thr.avg);

  const Ee_m = Ee_avg(E, eSept, eLat); const Ee_s = Ee_from(E, eSept); const Ee_l = Ee_from(E, eLat);
  const highEe = (Ee_m!=null && Ee_m>14) || (Ee_s!=null && Ee_s>15) || (Ee_l!=null && Ee_l>13);
  const trpasp = (PASP!=null ? PASP>=35 : (TR!=null && TR>=2.8));
  const baseCount = [red_e, highEe, trpasp].filter(Boolean).length;
  const suppAbn = ( (pv_sd!=null && pv_sd<=0.67) || (lars!=null && lars<=18) || (lavi!=null && lavi>34) || (ivrt!=null && ivrt<=70) || (ar_a!=null && ar_a>30) || (lwave!=null && lwave>=50) || (pr_ed!=null && pr_ed>=2.0) || (padp!=null && padp>=16) );

  let lap='Indeterminate', status='warn';
  if(baseCount===3){ lap='Aumentate'; status='bad'; }
  else if(baseCount===0){ lap='Normali'; status='good'; }
  else { lap = suppAbn ? 'Aumentate' : 'Indeterminate'; status = suppAbn ? 'bad' : 'warn'; }

  let grade=null;
  if(EA!=null){
    if(EA>=2){ grade='Grado III'; }
    else if(EA<=0.8){ grade = (E!=null && E<=50 && lap!=='Aumentate') ? 'Grado I' : (lap==='Aumentate'?'Grado II':'Grado I'); }
    else { grade = (lap==='Aumentate')? 'Grado II' : 'Grado I'; }
  }

  let phrase='';
  if(lap==='Normali' && (!grade || grade==='Grado I')) phrase='**Pattern di rilasciamento (grado I) o nei limiti**, con pressioni di riempimento nei limiti.';
  else if(grade==='Grado II') phrase='**Pattern pseudonormalizzato (grado II)**, con aumento delle pressioni di riempimento del ventricolo sinistro.';
  else if(grade==='Grado III') phrase='**Pattern restrittivo (grado III)**, con marcato aumento delle pressioni di riempimento del ventricolo sinistro.';
  else if(lap==='Aumentate') phrase='**LAP aumentate** con pattern non pienamente classificabile.';
  else phrase='**Valutazione indeterminata**: integrare con misure aggiuntive.';

  const out = document.getElementById('sin_result');
  let pills = pill(`LAP: ${lap}`, status==='bad'?'bad':(status==='good'?'good':'warn')) + (grade? pill(grade, grade==='Grado III'?'bad':(grade==='Grado II'?'warn':'good')):'');
  let details = kv("e′ media (calcolata)", (eM!=null? eM.toFixed(1)+' cm/s':'—')) +
                kv("E/e′ media (calcolata)", (Ee_m!=null? Ee_m.toFixed(1):'—')) +
                kv("E/e′ settale (calcolata)", (Ee_s!=null? Ee_s.toFixed(1):'—')) +
                kv("E/e′ laterale (calcolata)", (Ee_l!=null? Ee_l.toFixed(1):'—')) +
                kv("Variabili base patologiche", `${baseCount}/3`) +
                (suppAbn? kv("Supporto positivo", "Presente") : '');
  const txtCopy = `Ritmo sinusale — LAP ${lap}${grade? " — "+grade:""}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('sin_calc').addEventListener('click', sinusCalc);

// ---------- AF ----------
function afCalc(){
  const E = v(document.getElementById('af_E').value);
  const eSept = v(document.getElementById('af_e_sept').value);
  const TR = v(document.getElementById('af_TR').value);
  const PASP = v(document.getElementById('af_PASP').value);
  const DT = v(document.getElementById('af_DT').value);

  const Ee_sept = Ee_from(E, eSept);
  const f1 = (E!=null && E>=100);
  const f2 = (Ee_sept!=null && Ee_sept>11);
  const f3 = (PASP!=null ? PASP>35 : (TR!=null && TR>2.8));
  const f4 = (DT!=null && DT<=160 && DT>0);
  const nAbn = [f1,f2,f3,f4].filter(Boolean).length;

  let lap='Indeterminate', status='warn';
  if(nAbn>=2){ lap='Aumentate'; status='bad'; }
  else if(nAbn<=1){ lap='Normali'; status='good'; }

  let phrase = lap==='Aumentate' ? '**Probabile aumento delle LAP** in fibrillazione atriale (≥2 criteri patologici).'
           : lap==='Normali' ? '**LAP nei limiti** in fibrillazione atriale.'
           : '**Valutazione indeterminata** in fibrillazione atriale.';

  const out = document.getElementById('af_result');
  let pills = pill(`LAP: ${lap}`, status==='bad'?'bad':(status==='good'?'good':'warn'));
  let details = kv("E/e′ settale (calcolata)", (Ee_sept!=null? Ee_sept.toFixed(1):'—')) + kv("Criteri patologici", `${nAbn}/4`);
  const txtCopy = `FA — LAP ${lap}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('af_calc').addEventListener('click', afCalc);

// ---------- VALV ----------
function valvCalc(){
  const mr = yes(document.getElementById('valv_mr'));
  const ms = yes(document.getElementById('valv_ms'));
  const mac = yes(document.getElementById('valv_mac'));
  const E = v(document.getElementById('valv_E').value);
  const eSept = v(document.getElementById('valv_e_sept').value);
  const eLat = v(document.getElementById('valv_e_lat').value);
  const ar_a = v(document.getElementById('valv_ar_a').value);
  const pv_sd = v(document.getElementById('valv_pv_sd').value);
  const TR = v(document.getElementById('valv_TR').value);
  const PASP = v(document.getElementById('valv_PASP').value);
  const lavi = v(document.getElementById('valv_lavi').value);
  const lars = v(document.getElementById('valv_lars').value);

  const Ee_m = Ee_avg(E, eSept, eLat);
  const trpasp = (PASP!=null ? PASP>=35 : (TR!=null && TR>=2.8));
  const arApos = (ar_a!=null && ar_a>30);
  const highEe = (Ee_m!=null && Ee_m>=14);
  const strong = [arApos, trpasp, highEe].filter(Boolean).length;

  let lap='Indeterminate', status='warn';
  if(strong>=2){ lap='Aumentate'; status='bad'; }
  else if(strong===0 && (lavi!=null && lavi<=34) && (lars!=null && lars>=18)){ lap='Normali'; status='good'; }

  let note = (mr||ms||mac) ? ' (algoritmo standard non applicabile)' : '';
  let phrase = lap==='Aumentate' ? `**LAP aumentate${note}** (indicatori dedicati positivi).`
            : lap==='Normali' ? `**LAP nei limiti${note}** (indicatori favorevoli).`
            : `**Valutazione indeterminata${note}**.`;

  const out = document.getElementById('valv_result');
  let pills = pill(`LAP: ${lap}`, status==='bad'?'bad':(status==='good'?'good':'warn'));
  let details = kv("E/e′ medio (calcolato)", (Ee_m!=null? Ee_m.toFixed(1):'—')) + kv("Ar–A > 30 ms", arApos?'Sì':'No') + kv("TR/PASP aumentati", trpasp?'Sì':'No');
  const txtCopy = `Valvulopatie — LAP ${lap}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('valv_calc').addEventListener('click', valvCalc);

// ---------- HTX ----------
function htxCalc(){
  const E = v(document.getElementById('htx_E').value);
  const eSept = v(document.getElementById('htx_e_sept').value);
  const eLat  = v(document.getElementById('htx_e_lat').value);
  const srivr = v(document.getElementById('htx_srivr').value);
  const TR    = v(document.getElementById('htx_TR').value);

  const Ee_m = Ee_avg(E, eSept, eLat);
  let lap='Indeterminate', details='';
  if(Ee_m!=null){
    details += kv('E/e′ medio (calcolato)', Ee_m.toFixed(1));
    if(Ee_m<7) lap='Normali';
    else if(Ee_m>14) lap='Aumentate';
    else {
      if(srivr!=null && srivr>0){
        const ratio = E!=null && srivr!=null && srivr>0? (E/srirv): null;
        details += kv('E/SRIVR (cm)', (ratio!=null? ratio.toFixed(0): '—'));
        lap = (ratio!=null && ratio>200)? 'Aumentate' : 'Normali';
      }else if(TR!=null){
        details += kv('TR', TR+' m/s');
        lap = TR>2.8 ? 'Aumentate' : 'Normali';
      }
    }
  } else if(TR!=null){
    details += kv('TR', TR+' m/s');
    lap = TR>2.8 ? 'Aumentate' : 'Normali';
  }

  const status = lap==='Aumentate'?'bad':(lap==='Normali'?'good':'warn');
  let phrase = lap==='Aumentate' ? '**LAP aumentate** in trapianto.'
             : lap==='Normali' ? '**LAP nei limiti** in trapianto.'
             : '**Valutazione indeterminata** in trapianto.';

  const out = document.getElementById('htx_result');
  let pills = pill(`LAP: ${lap}`, status);
  const txtCopy = `Trapianto — LAP ${lap}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('htx_calc').addEventListener('click', htxCalc);

// ---------- PH ----------
function phCalc(){
  const E = v(document.getElementById('ph_E').value);
  const eLat = v(document.getElementById('ph_e_lat').value);
  const EA = v(document.getElementById('ph_EA').value);
  const lars = v(document.getElementById('ph_lars').value);
  const lavi = v(document.getElementById('ph_lavi').value);

  const Ee_lat = Ee_from(E, eLat);
  let lap='Indeterminate';
  if(Ee_lat!=null){
    if(Ee_lat>13) lap='Aumentate';
    else if(Ee_lat<8) lap='Normali';
    else{
      const combo = ( (EA!=null && EA>=2) || (lars!=null && lars<16) || (lavi!=null && lavi>34) );
      lap = combo ? 'Aumentate' : 'Indeterminate';
    }
  }
  const status = lap==='Aumentate'?'bad':(lap==='Normali'?'good':'warn');
  let phrase = lap==='Aumentate' ? '**LAP aumentate** nel contesto di ipertensione polmonare.'
             : lap==='Normali' ? '**LAP nei limiti** nel contesto di ipertensione polmonare.'
             : '**Valutazione indeterminata** (zona grigia).';

  const out = document.getElementById('ph_result');
  let pills = pill(`LAP: ${lap}`, status);
  let details = kv('E/e′ laterale (calcolata)', (Ee_lat!=null? Ee_lat.toFixed(1):'—')) + kv('Combinazioni favorevoli/negative', ((EA!=null&&EA>=2)||(lars!=null&&lars<16)||(lavi!=null&&lavi>34))?'Presenti':'Assenti');
  const txtCopy = `PH — LAP ${lap}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('ph_calc').addEventListener('click', phCalc);

// ---------- AV/LBBB/PACING ----------
function avCalc(){
  const sep = (document.getElementById('av_sep').value==='si');
  const onlyE = (document.getElementById('av_onlyE').value==='si');
  const E = v(document.getElementById('av_E').value);
  const eSept = v(document.getElementById('av_e_sept').value);
  const eLat  = v(document.getElementById('av_e_lat').value);
  const TR = v(document.getElementById('av_TR').value);
  const PASP = v(document.getElementById('av_PASP').value);

  const Ee_m = Ee_avg(E, eSept, eLat);
  const trpasp = (PASP!=null ? PASP>=35 : (TR!=null && TR>=2.8));

  let lap='Indeterminate';
  if(!sep || onlyE){ lap = trpasp ? 'Aumentate' : 'Normali'; }
  else { lap = ( (Ee_m!=null && Ee_m>=14) || trpasp ) ? 'Aumentate' : 'Normali'; }

  const status = lap==='Aumentate'?'bad':'good';
  let phrase = lap==='Aumentate' ? '**LAP aumentate** (setting di conduzione/pacing).'
             : '**LAP nei limiti** nel setting di conduzione/pacing.';

  const out = document.getElementById('av_result');
  let pills = pill(`LAP: ${lap}`, status);
  let details = kv('E/e′ medio (calcolato)', (Ee_m!=null? Ee_m.toFixed(1):'—')) + kv('TR/PASP aumentati', trpasp? 'Sì':'No') + kv('E/A interpretabile', (sep && !onlyE)?'Sì':'No');
  const txtCopy = `AV/LBBB/Pacing — LAP ${lap}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('av_calc').addEventListener('click', avCalc);

// ---------- RCM ----------
function rcmCalc(){
  const EA = v(document.getElementById('rcm_EA').value);
  const DT = v(document.getElementById('rcm_DT').value);
  const IVRT = v(document.getElementById('rcm_IVRT').value);
  const eSept = v(document.getElementById('rcm_e_sept').value);
  const eLat  = v(document.getElementById('rcm_e_lat').value);

  const meetRestr = ( (EA!=null && EA>2.5) && (DT!=null && DT<150) && (IVRT!=null && IVRT<50) );
  const veryLowE = ((eSept!=null && eSept<=4) || (eLat!=null && eLat<=4));
  let lap='Indeterminate', grade=null, phrase='';
  if(meetRestr && veryLowE){ lap='Aumentate'; grade='Grado III'; phrase='**Pattern restrittivo avanzato (grado III)**, con marcato aumento delle LAP.'; }
  else if(meetRestr){ lap='Aumentate'; grade='Grado III'; phrase='**Pattern restrittivo (grado III)**, con aumento marcato delle LAP.'; }
  else { phrase='**Criteri incompleti per restrizione avanzata**.'; }

  const out = document.getElementById('rcm_result');
  let pills = pill(`LAP: ${lap}`, lap==='Aumentate'?'bad':'warn') + (grade? pill(grade,'bad') : '');
  let details = kv('E/A > 2.5', EA!=null && EA>2.5 ? 'Sì':'No') + kv('DT < 150 ms', DT!=null && DT<150 ? 'Sì':'No') + kv('IVRT < 50 ms', IVRT!=null && IVRT<50 ? 'Sì':'No');
  const txtCopy = `RCM — LAP ${lap}${grade? ' — '+grade:''}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('rcm_calc').addEventListener('click', rcmCalc);

// ---------- CONSTRICTIVE PERICARDITIS ----------
function cpCalc(){
  const mitVar = v(document.getElementById('cp_mitral_var').value);
  const triVar = v(document.getElementById('cp_tric_var').value);
  const hvRatio = v(document.getElementById('cp_hv_ratio').value);
  const eMed = v(document.getElementById('cp_e_medial').value);
  const eLat = v(document.getElementById('cp_e_lateral').value);

  const mitralAbn = (mitVar!=null && mitVar>25);
  const tricuspidAbn = (triVar!=null && triVar>40);
  const hepaticAbn = (hvRatio!=null && hvRatio>=0.8);
  const medialHigh = (eMed!=null && eMed>7);
  const annulusReversus = (eMed!=null && eLat!=null && eMed>eLat);

  const score = [mitralAbn,tricuspidAbn,hepaticAbn,medialHigh,annulusReversus].filter(Boolean).length;
  let tag = score>=3 ? 'Quadro suggestivo' : 'Indizi non conclusivi';
  let phrase = score>=3 ? '**Quadro suggestivo di costrizione pericardica**.'
                        : '**Indizi non conclusivi** per costrizione pericardica.';

  const out = document.getElementById('cp_result');
  let pills = pill(tag, score>=3?'bad':'warn');
  let details = kv('Variazione mitrale >25%', mitralAbn?'Sì':'No') + kv('Variazione tricuspide >40%', tricuspidAbn?'Sì':'No') + kv('HV end-diast./anterogrado ≥0.8', hepaticAbn?'Sì':'No') + kv('e′ mediale >7 cm/s', medialHigh?'Sì':'No') + kv('Annulus reversus', annulusReversus?'Sì':'No');
  const txtCopy = `Costrizione — ${tag}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('cp_calc').addEventListener('click', cpCalc);

// ---------- HCM ----------
function hcmCalc(){
  const E = v(document.getElementById('hcm_E').value);
  const eSept = v(document.getElementById('hcm_e_sept').value);
  const eLat  = v(document.getElementById('hcm_e_lat').value);
  const TR = v(document.getElementById('hcm_TR').value);
  const PASP = v(document.getElementById('hcm_PASP').value);
  const pv_sd = v(document.getElementById('hcm_pv_sd').value);
  const lavi = v(document.getElementById('hcm_lavi').value);
  const EA = v(document.getElementById('hcm_EA').value);

  const Ee_m = Ee_avg(E, eSept, eLat);
  let abn = 0;
  if(Ee_m!=null && Ee_m>14) abn++;
  if(PASP!=null? PASP>=35 : (TR!=null && TR>=2.8)) abn++;
  if(pv_sd!=null && pv_sd<=0.67) abn++;
  if(lavi!=null && lavi>34) abn++;

  let lap='Indeterminate'; if(abn>=2) lap='Aumentate'; else if(abn===0) lap='Normali';
  let grade=null; if(EA!=null){ if(EA>=2) grade='Grado III'; else if(EA<=0.8) grade='Grado I'; else grade = (lap==='Aumentate')?'Grado II':'Grado I'; }

  let phrase = grade==='Grado III' ? '**Pattern restrittivo (grado III)** con marcato aumento delle LAP nel contesto HCM.' :
               grade==='Grado II' ? '**Pattern pseudonormalizzato (grado II)** con aumento delle LAP nel contesto HCM.' :
               lap==='Normali'   ? '**Funzione diastolica nei limiti / grado I** nel contesto HCM.' :
                                   '**Valutazione indeterminata**.';

  const out = document.getElementById('hcm_result');
  let pills = pill(`LAP: ${lap}`, lap==='Aumentate'?'bad':(lap==='Normali'?'good':'warn')) + (grade? pill(grade, grade==='Grado III'?'bad':(grade==='Grado II'?'warn':'good')):'');
  let details = kv('E/e′ medio (calcolato)', (Ee_m!=null? Ee_m.toFixed(1):'—')) + kv('Criteri LAP positivi', `${abn}`) + (grade? kv('Grado (E/A)', grade):'');
  const txtCopy = `HCM — LAP ${lap}${grade?' — '+grade:''}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('hcm_calc').addEventListener('click', hcmCalc);

// Reset buttons
document.querySelectorAll('[data-reset]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.dataset.reset;
    if(id==='special_all'){
      document.querySelectorAll('#special .subpanel input, #special .subpanel select').forEach(i=>{ if(i.tagName==='SELECT') i.selectedIndex=0; else i.value=''; clearInlineMsg(i); });
      document.querySelectorAll('#special .result').forEach(r=>r.innerHTML='');
      return;
    }
    const panel = document.getElementById(id);
    panel.querySelectorAll('input').forEach(i => { if(i.type==='checkbox') i.checked=false; else i.value=''; clearInlineMsg(i); });
    panel.querySelectorAll('select').forEach(s => s.selectedIndex=0);
    const res = panel.querySelector('.result'); if(res) res.innerHTML='';
  });
});
