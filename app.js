
// Tab navigation
const tabbar = document.getElementById('tabs');
const panels = [...document.querySelectorAll('.panel')];
function showPanel(id){
  panels.forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  [...tabbar.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b.dataset.target===id));
  window.scrollTo({top:0, behavior:'smooth'});
}
tabbar.addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-target]');
  if(!b) return;
  showPanel(b.dataset.target);
});
// default
showPanel('sinus');

// Toggle age-adjusted thresholds in sinus
const sinAgeChk = document.getElementById('sin_age_adj');
const sinAgeWrap = document.getElementById('sin_age_wrap');
sinAgeChk.addEventListener('change', ()=>{
  sinAgeWrap.style.display = sinAgeChk.checked ? '' : 'none';
});

function val(v){ const n = Number(v); return isFinite(n)? n : null; }
function yes(sel){ return (sel?.value||'')==='si'; }
function badge(label, type=''){ return `<span class="pill ${type}">${label}</span>`; }
function headline(t){ return `<div class="headline">${t}</div>`; }
function kv(k,v){ return `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`; }
function copyBlock(text){
  return `<div class="copy"><button onclick="navigator.clipboard.writeText(\`${text.replace(/`/g,'\\`')}\`)">Copia risultato</button><span class="k">copiato negli appunti</span></div>`;
}

// ---------- SINUS LOGIC (Figure 3) ----------
function sinusCalc(){
  const eSept = val(document.getElementById('sin_e_sept').value);
  const eLat  = val(document.getElementById('sin_e_lat').value);
  const eAvg  = val(document.getElementById('sin_e_avg').value);
  const useAge = document.getElementById('sin_age_adj').checked;
  const age = val(document.getElementById('sin_age').value);

  const E = val(document.getElementById('sin_E').value);
  const EA = val(document.getElementById('sin_EA').value);
  const TR = val(document.getElementById('sin_TR').value);
  const PASP = val(document.getElementById('sin_PASP').value);
  const Ee_avg = val(document.getElementById('sin_Ee_avg').value);
  const Ee_sept = val(document.getElementById('sin_Ee_sept').value);
  const Ee_lat  = val(document.getElementById('sin_Ee_lat').value);

  const pv_sd = val(document.getElementById('sin_pv_sd').value);
  const lars = val(document.getElementById('sin_lars').value);
  const lavi = val(document.getElementById('sin_lavi').value);
  const ivrt = val(document.getElementById('sin_ivrt').value);
  const ar_a = val(document.getElementById('sin_ar_a').value);
  const lwave = val(document.getElementById('sin_lwave').value);
  const pr_ed = val(document.getElementById('sin_pr_ed').value);
  const padp = val(document.getElementById('sin_padp').value);

  // Reduced e' — default thresholds per figure; may apply Table 6 by age
  let red_e = false;
  if(useAge && age!=null){
    // Table 6: septal <7 (20-39), <6 (40-65 & >65); lateral <10, <8, <7; avg <9, <7, <6.5
    let sept_thr = age<40?7:(age<=65?6:6);
    let lat_thr = age<40?10:(age<=65?8:7);
    let avg_thr = age<40?9:(age<=65?7:6.5);
    red_e = (eSept!=null && eSept<sept_thr) || (eLat!=null && eLat<lat_thr) || (eAvg!=null && eAvg<avg_thr);
  }else{
    red_e = (eSept!=null && eSept<=6) || (eLat!=null && eLat<=7) || (eAvg!=null && eAvg<=6.5);
  }

  // Increased E/e' threshold: avg >=14 or septal >=15 or lateral >=13
  let high_Ee = false;
  if(Ee_avg!=null && Ee_avg>=14) high_Ee = true;
  if(Ee_sept!=null && Ee_sept>=15) high_Ee = true;
  if(Ee_lat!=null && Ee_lat>=13) high_Ee = true;

  // TR/PASP abnormal
  let high_TRPASP = false;
  if(PASP!=null){
    if(PASP>=35) high_TRPASP = true;
  }else if(TR!=null){
    if(TR>=2.8) high_TRPASP = true;
  }

  // Count abnormalities
  const baseFlags = [red_e, high_Ee, high_TRPASP];
  const baseCount = baseFlags.filter(Boolean).length;

  // Supplemental support (any supports LAP increased)
  const suppAbn = (
    (pv_sd!=null && pv_sd<=0.67) ||
    (lars!=null && lars<=18) ||
    (lavi!=null && lavi>34) ||
    (ivrt!=null && ivrt<=70) ||
    (ar_a!=null && ar_a>30) ||
    (lwave!=null && lwave>=50) ||
    (pr_ed!=null && pr_ed>=2.0) ||
    (padp!=null && padp>=16)
  );

  let lapStatus = 'Indeterminate';
  if(baseCount===3){
    lapStatus = 'Aumentate';
  }else if(baseCount===0){
    lapStatus = 'Normali';
  }else{
    // 1–2 abnormal: use supplemental if available
    if(suppAbn) lapStatus = 'Aumentate';
    else lapStatus = 'Indeterminate';
  }

  // Grading via E/A
  let grade = null;
  if(EA!=null){
    if(EA>=2){
      grade = 'Grado III';
    }else if(EA<=0.8){
      // If E low <=50 and LAP not increased => Grade I; otherwise may be II (if LAP increased)
      if(E!=null && E<=50 && lapStatus!=='Aumentate'){
        grade = 'Grado I';
      }else if(lapStatus==='Aumentate'){
        grade = 'Grado II';
      }else{
        grade = 'Grado I';
      }
    }else{
      // 0.8< E/A <2
      grade = (lapStatus==='Aumentate') ? 'Grado II' : 'Grado I';
    }
  }

  // Build UI
  const out = document.getElementById('sin_result');
  let pills = '';
  pills += badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate' ? 'bad' : (lapStatus==='Normali'?'good':'warn'));
  if(grade) pills += badge(grade, grade==='Grado III'?'bad':(grade==='Grado II'?'warn':'good'));

  // Referto phrase
  let phrase = '';
  if(lapStatus==='Normali' && (!grade || grade==='Grado I')){
    phrase = '**Disturbo di rilasciamento (grado I) o pattern nei limiti**, con pressioni di riempimento ventricolare sinistro nei limiti.';
    if(!grade) grade = 'Grado I / Normale';
  }else if(grade==='Grado II'){
    phrase = '**Pattern pseudonormalizzato (grado II)**, con aumento delle pressioni di riempimento del ventricolo sinistro.';
  }else if(grade==='Grado III'){
    phrase = '**Pattern restrittivo (grado III)**, con marcato aumento delle pressioni di riempimento del ventricolo sinistro.';
  }else if(lapStatus==='Aumentate'){
    phrase = '**LAP aumentate** con pattern non pienamente classificabile (considerare esercizio/variabili di supporto).';
  }else{
    phrase = '**Valutazione indeterminata**: integrare con variabili di supporto o eco da sforzo diastolica.';
  }

  let details = '';
  details += kv('Variabili base anomale', `${baseCount}/3`);
  details += kv('e′ ridotta', red_e? 'Sì' : 'No');
  details += kv('E/e′ aumentato', high_Ee? 'Sì' : 'No');
  details += kv('TR/PASP aumentati', high_TRPASP? 'Sì' : 'No');
  if(suppAbn) details += kv('Supporto (PV/LARS/LAVi/IVRT/others)', 'Presente');

  const txtCopy = `Ritmo sinusale — ${lapStatus}${grade? ' — '+grade : ''}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('sin_calc').addEventListener('click', sinusCalc);

// ---------- AF LOGIC (Figure 8) ----------
function afCalc(){
  const E = val(document.getElementById('af_E').value);
  const Ee_sept = val(document.getElementById('af_Ee_sept').value);
  const TR = val(document.getElementById('af_TR').value);
  const PASP = val(document.getElementById('af_PASP').value);
  const DT = val(document.getElementById('af_DT').value);
  const lars = val(document.getElementById('af_lars').value);
  const pv_sd = val(document.getElementById('af_pv_sd').value);
  const lavi = val(document.getElementById('af_lavi').value);

  const f1 = (E!=null && E>=100);
  const f2 = (Ee_sept!=null && Ee_sept>11);
  let f3 = null;
  if(PASP!=null) f3 = PASP>35;
  else if(TR!=null) f3 = TR>2.8;
  const f4 = (DT!=null && DT<=160);

  const flags = [f1,f2,f3,f4].map(x=>!!x);
  const nAbn = flags.filter(Boolean).length;
  let lapStatus='Indeterminate';
  if(nAbn>=2) lapStatus='Aumentate';
  else if(nAbn<=1) {
    // support for normality
    const normalSupport = ( (lars!=null && lars>=18) || (pv_sd!=null && pv_sd>=1.0) || (lavi!=null && lavi<=34) );
    lapStatus = normalSupport ? 'Normali' : 'Indeterminate';
  }

  let phrase = '';
  if(lapStatus==='Aumentate') phrase='**Probabile aumento delle LAP** in fibrillazione atriale (≥2 criteri patologici).';
  else if(lapStatus==='Normali') phrase='**LAP nei limiti** in fibrillazione atriale (supporto favorevole).';
  else phrase='**Valutazione indeterminata** in fibrillazione atriale; considerare media di più cicli e variabili aggiuntive.';

  const out = document.getElementById('af_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':(lapStatus==='Normali'?'good':'warn'));
  const details = kv('Criteri patologici', `${nAbn}/4`) + kv('Supporto verso normalità (LARS/PV/LAVi)', ((lars!=null&&lars>=18)||(pv_sd!=null&&pv_sd>=1)||(lavi!=null&&lavi<=34))?'Presente':'Assente');
  const txtCopy = `FA — ${lapStatus}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('af_calc').addEventListener('click', afCalc);

// ---------- VALVULOPATHY ----------
function valvCalc(){
  const mr = yes(document.getElementById('valv_mr'));
  const ms = yes(document.getElementById('valv_ms'));
  const mac = yes(document.getElementById('valv_mac'));
  const ar_a = val(document.getElementById('valv_ar_a').value);
  const pv_sd = val(document.getElementById('valv_pv_sd').value);
  const TR = val(document.getElementById('valv_TR').value);
  const PASP = val(document.getElementById('valv_PASP').value);
  const Ee = val(document.getElementById('valv_Ee').value);
  const lavi = val(document.getElementById('valv_lavi').value);
  const lars = val(document.getElementById('valv_lars').value);

  // Key points: Ar–A >30 ms supports elevated LVEDP even in MR; MR can reduce PV S/D utility.
  let supportElev = false;
  if(ar_a!=null && ar_a>30) supportElev = True = true;
  // TR/PASP and E/e' still informative
  const trpasp = (PASP!=null ? PASP>=35 : (TR!=null && TR>=2.8));
  const highEe = (Ee!=null && Ee>=14);
  const strong = [supportElev, trpasp, highEe].filter(Boolean).length;

  let lapStatus = 'Indeterminate';
  if(strong>=2) lapStatus='Aumentate';
  else if(strong===0 && (lavi!=null && lavi<=34) && (lars!=null && lars>=18)){
    lapStatus='Normali';
  }

  let phrase = '';
  const nonApplicabile = (mr||ms||mac) ? ' (algoritmo standard non applicabile)' : '';
  if(lapStatus==='Aumentate') phrase = `**LAP aumentate${nonApplicabile}** (indicatori alternativi favorevoli).`;
  else if(lapStatus==='Normali') phrase = `**LAP nei limiti${nonApplicabile}** (indicatori favorevoli).`;
  else phrase = `**Valutazione indeterminata${nonApplicabile}**: integrare con altre misure e clinica.`;

  const out = document.getElementById('valv_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':(lapStatus==='Normali'?'good':'warn'));
  let details = kv('Ar–A > 30 ms', (ar_a!=null && ar_a>30)?'Sì':'No');
  details += kv('TR/PASP aumentati', trpasp? 'Sì' : 'No');
  details += kv('E/e′ elevato (≥14)', highEe? 'Sì' : 'No');
  const txtCopy = `Valvulopatie — ${lapStatus}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('valv_calc').addEventListener('click', valvCalc);

// ---------- HTX ----------
function htxCalc(){
  const E = val(document.getElementById('htx_E').value);
  const eavg = val(document.getElementById('htx_eavg').value);
  const srivr = val(document.getElementById('htx_srivr').value); // 1/s
  const TR = val(document.getElementById('htx_TR').value);

  let lapStatus = 'Indeterminate';
  let details = '';
  if(eavg!=null && E!=null){
    const Ee = E / eavg;
    details += kv('E/e′ medio', Ee.toFixed(1));
    if(Ee<7) lapStatus='Normali';
    else if(Ee>14) lapStatus='Aumentate';
    else {
      if(srirvValid(srirv=srivr)){
        const ratio = E / srivr; // E(cm/s) divided by 1/s = cm
        details += kv('E/SRIVR (cm)', ratio.toFixed(0));
        if(ratio>200) lapStatus='Aumentate';
        else lapStatus='Normali';
      }else if(TR!=null){
        details += kv('TR', TR+' m/s');
        lapStatus = TR>2.8 ? 'Aumentate' : 'Normali';
      }else{
        lapStatus='Indeterminate';
      }
    }
  }else if(TR!=null){
    details += kv('TR', TR+' m/s');
    lapStatus = TR>2.8 ? 'Aumentate' : 'Normali';
  }

  function srirvValid(s){ return s!=null && s>0; }

  let phrase='';
  if(lapStatus==='Aumentate') phrase='**LAP aumentate** in trapianto (criteri dedicati positivi).';
  else if(lapStatus==='Normali') phrase='**LAP nei limiti** in trapianto (criteri dedicati favorevoli).';
  else phrase='**Valutazione indeterminata** in trapianto; completare con misure alternative.';

  const out = document.getElementById('htx_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':(lapStatus==='Normali'?'good':'warn'));
  const txtCopy = `Trapianto — ${lapStatus}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('htx_calc').addEventListener('click', htxCalc);

// ---------- PH ----------
function phCalc(){
  const Ee_lat = val(document.getElementById('ph_Ee_lat').value);
  const EA = val(document.getElementById('ph_EA').value);
  const lars = val(document.getElementById('ph_lars').value);
  const lavi = val(document.getElementById('ph_lavi').value);

  let lapStatus='Indeterminate';
  if(Ee_lat!=null){
    if(Ee_lat>13) lapStatus='Aumentate';
    else if(Ee_lat<8) lapStatus='Normali';
    else {
      // 8–13: combine
      const combo = ((EA!=null && EA>=2) || (lars!=null && lars<16) || (lavi!=null && lavi>34));
      lapStatus = combo ? 'Aumentate' : 'Indeterminate';
    }
  }

  let phrase='';
  if(lapStatus==='Aumentate') phrase='**LAP aumentate** nel contesto di ipertensione polmonare (criteri dedicati).';
  else if(lapStatus==='Normali') phrase='**LAP nei limiti** nel contesto di ipertensione polmonare.';
  else phrase='**Valutazione indeterminata** (E/e′ laterale in zona grigia: integrare con E/A o LARS).';

  const out = document.getElementById('ph_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':(lapStatus==='Normali'?'good':'warn'));
  const details = kv('E/e′ laterale', Ee_lat ?? '—') + kv('Combinazioni (E/A≥2 o LARS<16% o LAVi>34)', ((EA!=null&&EA>=2)||(lars!=null&&lars<16)||(lavi!=null&&lavi>34))?'Sì':'No');
  const txtCopy = `PH — ${lapStatus}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('ph_calc').addEventListener('click', phCalc);

// ---------- AV/LBBB/PACING ----------
function avCalc(){
  const sep = yes(document.getElementById('av_sep'));
  const onlyE = yes(document.getElementById('av_onlyE'));
  const TR = val(document.getElementById('av_TR').value);
  const PASP = val(document.getElementById('av_PASP').value);
  const Ee = val(document.getElementById('av_Ee').value);

  let lapStatus='Indeterminate';
  const trpasp = (PASP!=null ? PASP>=35 : (TR!=null && TR>=2.8));
  if(!sep || onlyE){
    // rely on TR/PASP
    lapStatus = trpasp ? 'Aumentate' : 'Normali';
  }else{
    if(Ee!=null && Ee>=14) lapStatus='Aumentate';
    else if(trpasp) lapStatus='Aumentate';
    else lapStatus='Normali';
  }

  let phrase='';
  if(lapStatus==='Aumentate') phrase='**LAP aumentate** (setting di conduzione/pacing; attenzione alla ridotta accuratezza di E/e′).';
  else phrase='**LAP nei limiti** nel setting di conduzione/pacing.';

  const out = document.getElementById('av_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':'good');
  let details = kv('TR/PASP aumentati', trpasp? 'Sì':'No') + kv('E/e′ utile', (sep && !onlyE)?'Sì':'No');
  const txtCopy = `AV/LBBB/Pacing — ${lapStatus}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('av_calc').addEventListener('click', avCalc);

// ---------- RCM ----------
function rcmCalc(){
  const EA = val(document.getElementById('rcm_EA').value);
  const DT = val(document.getElementById('rcm_DT').value);
  const IVRT = val(document.getElementById('rcm_IVRT').value);
  const eSept = val(document.getElementById('rcm_e_sept').value);
  const eLat  = val(document.getElementById('rcm_e_lat').value);

  const meetRestr = ( (EA!=null && EA>2.5) && (DT!=null && DT<150) && (IVRT!=null && IVRT<50) );
  const veryLowE = ((eSept!=null && eSept<=4) || (eLat!=null && eLat<=4));
  let phrase='';
  let lapStatus='Indeterminate', grade=null;
  if(meetRestr && veryLowE){
    lapStatus='Aumentate';
    grade='Grado III';
    phrase='**Pattern restrittivo avanzato (grado III)**, con marcato aumento delle pressioni di riempimento (coerente con cardiomiopatia restrittiva).';
  }else if(meetRestr){
    lapStatus='Aumentate';
    grade='Grado III';
    phrase='**Pattern restrittivo (grado III)**, con aumento marcato delle LAP.';
  }else{
    phrase='**Criteri incompleti per restrizione avanzata**; integrare con altre variabili (strain, PV, clinica).';
  }

  const out = document.getElementById('rcm_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':'warn') + (grade? badge(grade,'bad') : '');
  const details = kv('E/A > 2.5', EA!=null && EA>2.5 ? 'Sì':'No') + kv('DT < 150 ms', DT!=null && DT<150 ? 'Sì':'No') + kv('IVRT < 50 ms', IVRT!=null && IVRT<50 ? 'Sì':'No');
  const txtCopy = `RCM — ${lapStatus}${grade? ' — '+grade:''}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('rcm_calc').addEventListener('click', rcmCalc);

// ---------- CONSTRICTIVE PERICARDITIS ----------
function cpCalc(){
  const mitVar = val(document.getElementById('cp_mitral_var').value);
  const triVar = val(document.getElementById('cp_tric_var').value);
  const hvRatio = val(document.getElementById('cp_hv_ratio').value);
  const eMed = val(document.getElementById('cp_e_medial').value);
  const eLat = val(document.getElementById('cp_e_lateral').value);

  const mitralAbn = (mitVar!=null && mitVar>25);
  const tricuspidAbn = (triVar!=null && triVar>40);
  const hepaticAbn = (hvRatio!=null && hvRatio>=0.8);
  const medialHigh = (eMed!=null && eMed>7);
  const annulusReversus = (eMed!=null && eLat!=null && eMed>eLat);

  const score = [mitralAbn,tricuspidAbn,hepaticAbn,medialHigh,annulusReversus].filter(Boolean).length;
  let phrase='';
  let tag='Indizi non conclusivi';
  if(score>=3){
    tag='Quadro suggestivo';
    phrase='**Quadro suggestivo di costrizione pericardica** (variazioni respiratorie/venose e cinetica anulare tipiche).';
  }else{
    phrase='**Indizi non conclusivi** per costrizione pericardica; considerare ulteriori valutazioni (RM/invasiva).';
  }

  const out = document.getElementById('cp_result');
  let pills = badge(tag, score>=3?'bad':'warn');
  const details = kv('Variazione mitrale >25%', mitralAbn?'Sì':'No') + kv('Variazione tricuspide >40%', tricuspidAbn?'Sì':'No') + kv('HV end-diast./anterogrado ≥0.8', hepaticAbn?'Sì':'No') + kv('e′ mediale >7 cm/s', medialHigh?'Sì':'No') + kv('Annulus reversus', annulusReversus?'Sì':'No');
  const txtCopy = `Costrizione — ${tag}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('cp_calc').addEventListener('click', cpCalc);

// ---------- HCM ----------
function hcmCalc(){
  const Ee = val(document.getElementById('hcm_Ee').value);
  const TR = val(document.getElementById('hcm_TR').value);
  const PASP = val(document.getElementById('hcm_PASP').value);
  const pv_sd = val(document.getElementById('hcm_pv_sd').value);
  const lavi = val(document.getElementById('hcm_lavi').value);
  const EA = val(document.getElementById('hcm_EA').value);

  // Multiparametric for LAP; grading by E/A
  let abn = 0;
  if(Ee!=null && Ee>=14) abn++;
  if(PASP!=null? PASP>=35 : (TR!=null && TR>=2.8)) abn++;
  if(pv_sd!=null && pv_sd<=0.67) abn++;
  if(lavi!=null && lavi>34) abn++;

  let lapStatus='Indeterminate';
  if(abn>=2) lapStatus='Aumentate';
  else if(abn===0) lapStatus='Normali';

  // Grade
  let grade = null;
  if(EA!=null){
    if(EA>=2) grade='Grado III';
    else if(EA<=0.8) grade='Grado I';
    else grade = (lapStatus==='Aumentate')? 'Grado II' : 'Grado I';
  }

  let phrase='';
  if(grade==='Grado III') phrase='**Pattern restrittivo (grado III)** con marcato aumento delle LAP nel contesto HCM.';
  else if(grade==='Grado II') phrase='**Pattern pseudonormalizzato (grado II)** con aumento delle LAP nel contesto HCM.';
  else if(lapStatus==='Normali') phrase='**Funzione diastolica nei limiti / grado I** nel contesto HCM.';
  else phrase='**Valutazione indeterminata**; integrare con PV/strain e clinica.';

  const out = document.getElementById('hcm_result');
  let pills = badge(`LAP: ${lapStatus}`, lapStatus==='Aumentate'?'bad':(lapStatus==='Normali'?'good':'warn'));
  if(grade) pills += badge(grade, grade==='Grado III'?'bad':(grade==='Grado II'?'warn':'good'));
  const details = kv('Criteri LAP positivi', `${abn}`) + (grade? kv('Grado (E/A)', grade) : '');
  const txtCopy = `HCM — ${lapStatus}${grade? ' — '+grade:''}. ${phrase.replace(/\*\*/g,'')}`;
  out.innerHTML = `<div class="pills">${pills}</div>${headline(phrase)}${details}${copyBlock(txtCopy)}`;
}
document.getElementById('hcm_calc').addEventListener('click', hcmCalc);

// -------- Reset handlers --------
document.querySelectorAll('[data-reset]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const panel = document.getElementById(btn.dataset.reset);
    panel.querySelectorAll('input').forEach(i => { if(i.type==='checkbox') i.checked=false; else i.value=''; });
    panel.querySelectorAll('select').forEach(s => s.selectedIndex=0);
    const res = panel.querySelector('.result'); if(res) res.innerHTML='';
    if(btn.dataset.reset==='sinus'){ document.getElementById('sin_age_wrap').style.display='none'; }
  });
});
