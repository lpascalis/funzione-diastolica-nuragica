// Utilities
const $ = (sel) => document.querySelector(sel);
const getNum = (id) => {
  const v = $(id)?.value.trim();
  if (!v) return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const has = (id) => $(id)?.value && $(id).value.trim().length>0;

// Tabs
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-target');
    document.querySelector(target).classList.add('active');
  });
});

// Age-specific e' thresholds (linee guida 2025 Table 6)
function reducedEprime(age, eSept, eLat){
  let septCut = 6, latCut = 7, avgCut = 6.5;
  if (age && age < 40){ septCut = 7; latCut = 10; avgCut = 9; }
  else if (age && age <= 65){ septCut = 6; latCut = 8; avgCut = 7; }
  else { septCut = 6; latCut = 7; avgCut = 6.5; }
  const avg = ( (eSept ?? NaN) + (eLat ?? NaN) ) / 2;
  const flags = [];
  if (eSept != null && eSept <= septCut) flags.push('septal');
  if (eLat != null && eLat <= latCut) flags.push('lateral');
  if (!Number.isNaN(avg) && avg <= avgCut) flags.push('average');
  return {isReduced: flags.length>0, flags, cuts:{septCut,latCut,avgCut}, avg:isFinite(avg)?avg:null};
}

function increasedEE({eeAvg, eeSep, eeLat}){
  const flags = [];
  if (eeAvg != null && eeAvg >= 14) flags.push('avg≥14');
  if (eeSep != null && eeSep >= 15) flags.push('sept≥15');
  if (eeLat != null && eeLat >= 13) flags.push('lat≥13');
  return {isHigh: flags.length>0, flags};
}

function elevatedTRorPASP({tr, pasp}){
  const flags = [];
  if (pasp != null && pasp >= 35) flags.push('PASP≥35');
  if ((pasp == null) && tr != null && tr >= 2.8) flags.push('TR≥2.8');
  // If both provided, either abnormal counts
  if (tr != null && tr >= 2.8 && !flags.includes('TR≥2.8')) flags.push('TR≥2.8');
  return {isHigh: flags.length>0, flags};
}

function stage2Support({lars, pvSD, lavi, ivrt}){
  const supportFlags = [];
  if (lars != null && lars <= 18) supportFlags.push('LARS≤18%');
  if (pvSD != null && pvSD <= 0.67) supportFlags.push('PV S/D≤0.67');
  if (lavi != null && lavi > 34) supportFlags.push('LAVi>34');
  if (ivrt != null && ivrt <= 70) supportFlags.push('IVRT≤70');
  return {supported: supportFlags.length>0, flags:supportFlags};
}

function supplementalFlags(selected){
  const map = {
    'pr2': 'PR end-diast ≥2 m/s',
    'padp16':'PADP ≥16 mmHg',
    'lwave50':'Mitral L ≥50 cm/s',
    'ar_a30':'Ar−A >30 ms',
    'valsava50':'ΔE/A ≥50% con Valsalva'
  };
  const chosen = Array.from(selected.options).filter(o=>o.selected).map(o=>map[o.value]);
  return {supported: chosen.length>0, flags: chosen};
}

function gradeByEA(ea){
  if (ea == null) return null;
  return ea >= 2 ? 3 : 2;
}

// Sinus compute
$('#calcSinus').addEventListener('click', ()=>{
  const age = getNum('#age');
  const eSept = getNum('#eprime_septal');
  const eLat = getNum('#eprime_lateral');
  const eeAvg = getNum('#ee_avg');
  const tr = getNum('#tr_vmax');
  const pasp = getNum('#pasp');
  const ea = getNum('#ea_ratio');
  const lars = getNum('#lars');
  const pvSD = getNum('#pv_sd');
  const lavi = getNum('#lavi');
  const ivrt = getNum('#ivrt');
  const supp = supplementalFlags($('#supp'));

  const eInfo = reducedEprime(age, eSept, eLat);
  const eeInfo = increasedEE({eeAvg, eeSep:null, eeLat:null});
  const trInfo = elevatedTRorPASP({tr, pasp});

  const primFlags = {
    eprime: eInfo.isReduced,
    ee: eeInfo.isHigh,
    trpasp: trInfo.isHigh
  };
  const primCountKnown = ['eprime','ee','trpasp'].filter(k => (k==='eprime' && (eSept!=null || eLat!=null)) || (k==='ee' && eeAvg!=null) || (k==='trpasp' && (tr!=null || pasp!=null))).length;
  const primTrue = Object.values(primFlags).filter(Boolean).length;

  let lap, grade = null, rationale = [];

  if (primCountKnown === 3){
    if (primTrue === 3){
      lap = 'increased';
      grade = gradeByEA(ea);
      rationale.push('Tutti e tre primari anomali (e′ ridotta, E/e′ ↑, TR/PASP ↑).');
    } else if (primTrue === 0){
      lap = 'normal';
      rationale.push('Tutti e tre primari nei limiti.');
    } else {
      // Mixed -> stage 2
      const s2 = stage2Support({lars, pvSD, lavi, ivrt});
      if (s2.supported){
        lap = 'increased';
        grade = gradeByEA(ea);
        rationale.push('Primari discordanti ma supporto di fase 2: '+s2.flags.join(', '));
      } else if (supp.supported){
        lap = 'increased';
        grade = gradeByEA(ea);
        rationale.push('Primari discordanti; supporto da parametri supplementari: '+supp.flags.join(', '));
      } else {
        lap = 'indeterminate';
        rationale.push('Primari discordanti senza supporti disponibili.');
      }
    }
  } else {
    // Not all primaries known
    if (primTrue >= 2){
      lap = 'increased';
      grade = gradeByEA(ea);
      rationale.push('≥2 primari anomali tra quelli disponibili.');
    } else {
      const s2 = stage2Support({lars, pvSD, lavi, ivrt});
      if (s2.supported && primTrue>=1){
        lap = 'increased';
        grade = gradeByEA(ea);
        rationale.push('Almeno 1 primario anomalo con supporto fase 2: '+s2.flags.join(', '));
      } else if (primTrue===0){
        lap = 'normal';
        rationale.push('Nessun primario anomalo tra quelli inseriti.');
      } else if (supp.supported){
        lap = 'increased';
        grade = gradeByEA(ea);
        rationale.push('Supporto da parametri supplementari: '+supp.flags.join(', '));
      } else {
        lap = 'indeterminate';
        rationale.push('Dati incompleti.');
      }
    }
  }

  // Grade 1 logic
  if (lap === 'normal' && eInfo.isReduced && ea != null){
    if (ea <= 0.8){
      grade = 1;
      rationale.push('e′ ridotta con E/A ≤ 0.8 → Grado 1 (impaired relaxation).');
    } else {
      rationale.push('e′ ridotta con E/A > 0.8 ma LAP normale.');
    }
  }

  const resBox = $('#sinusResult');
  const detBox = $('#sinusDetails');
  resBox.style.display = 'block';
  detBox.style.display = 'block';

  if (lap === 'increased'){
    resBox.className = 'status bad';
    resBox.innerHTML = `<strong>LAP aumentata</strong>${grade?` — Grado ${grade}`:''}`;
  } else if (lap === 'normal'){
    resBox.className = 'status ok';
    resBox.textContent = 'LAP normale';
  } else {
    resBox.className = 'status warn';
    resBox.textContent = 'LAP indeterminata';
  }

  const tips = [];
  if (lap==='normal' && (has('#ee_avg')||has('#tr_vmax')||has('#pasp')) && $('#rhythm').value==='sinus'){
    tips.push('Se sintomatico, considerare ecostress diastolico.');
  }
  if (grade===3){
    tips.push('Pattern restrittivo: correlare clinica e considerare terap. mirata.');
  }

  detBox.innerHTML = `
    <div class="kv"><div class="k">Primari anomali</div><div>${primTrue}</div></div>
    <div class="kv"><div class="k">Dettagli e′</div><div>${eInfo.isReduced?`Ridotta (${eInfo.flags.join('/')})`:'Nella norma'}</div></div>
    <div class="kv"><div class="k">E/e′</div><div>${eeInfo.isHigh?'Aumentato ('+eeInfo.flags.join(', ')+')':'Nella norma o assente'}</div></div>
    <div class="kv"><div class="k">TR/PASP</div><div>${trInfo.isHigh?'Aumentato ('+trInfo.flags.join(', ')+')':'Nella norma o assente'}</div></div>
    <div class="kv"><div class="k">Supporti fase 2</div><div>${stage2Support({lars, pvSD, lavi, ivrt}).flags.join(', ')||'—'}</div></div>
    <div class="kv"><div class="k">Supplementari</div><div>${supp.flags.join(', ')||'—'}</div></div>
    ${tips.length?('<hr><ul><li>'+tips.join('</li><li>')+'</li></ul>'):''}
  `;
});

// AF compute (multiparametric)
$('#calcAF').addEventListener('click', ()=>{
  const E = getNum('#af_E');
  const eeSep = getNum('#af_ee_septal');
  const tr = getNum('#af_tr');
  const dt = getNum('#af_dt');
  const lars = getNum('#af_lars');
  const pvSD = getNum('#af_pv_sd');

  let score = 0;
  const crit = [];
  if (E != null && E >= 100){ score++; crit.push('E≥100'); }
  if (eeSep != null && eeSep > 11){ score++; crit.push('septal E/e′>11'); }
  // Interpret tr input: if value > 30 likely PASP; here we assume user inputs TR (m/s) by default
  if (tr != null){
    if (tr >= 2.8){ score++; crit.push('TR≥2.8'); }
    if (tr >= 35){ score++; if (!crit.includes('TR≥2.8')) crit.push('PASP≥35'); } // if they actually entered PASP
  }
  if (dt != null && dt <= 160){ score++; crit.push('DT≤160'); }

  // Supportive
  let support = 0;
  const supportFlags = [];
  if (lars != null && lars <= 18){ support++; supportFlags.push('LARS≤18%'); }
  if (pvSD != null && pvSD <= 0.67){ support++; supportFlags.push('PV S/D≤0.67'); }

  let lap, rationale = [];
  if (score >= 2){
    lap = 'increased';
    rationale.push('≥2 criteri principali: '+crit.join(', '));
  } else if (score === 0){
    lap = 'normal';
    rationale.push('Nessun criterio principale soddisfatto.');
  } else {
    // 1 criterion -> use supports
    if (support >= 1){
      lap = 'increased';
      rationale.push('1 criterio principale con supporto: '+crit.join(', ')+' + '+supportFlags.join(', '));
    } else {
      lap = 'indeterminate';
      rationale.push('1 criterio principale senza supporto aggiuntivo.');
    }
  }

  const resBox = $('#afResult');
  const detBox = $('#afDetails');
  resBox.style.display = 'block';
  detBox.style.display = 'block';

  if (lap === 'increased'){
    resBox.className = 'status bad';
    resBox.textContent = 'LAP aumentata (FA, approccio multiparametrico)';
  } else if (lap === 'normal'){
    resBox.className = 'status ok';
    resBox.textContent = 'LAP probabilmente normale (FA)';
  } else {
    resBox.className = 'status warn';
    resBox.textContent = 'LAP indeterminata (FA)';
  }

  detBox.innerHTML = `
    <div class="kv"><div class="k">Criteri principali</div><div>${crit.join(', ')||'—'}</div></div>
    <div class="kv"><div class="k">Supporti</div><div>${supportFlags.join(', ')||'—'}</div></div>
    <hr>
    <div>${rationale.join(' ')}</div>
    <ul>
      <li>Mediare su più cicli con sweep 50 mm/s e frequenza rappresentativa.</li>
      <li>Se disponibile, doppio Doppler per E/e′ dal medesimo ciclo.</li>
    </ul>
  `;
});


// Sub-tabs inside Special Populations
(function(){
  const container = document.getElementById('spTabs');
  if(!container) return;
  const tabs = container.querySelectorAll('.tab');
  const sections = ['#sp_valv','#sp_htx','#sp_ph','#sp_block','#sp_restr','#sp_costr','#sp_hcm'].map(sel=>document.querySelector(sel));
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      sections.forEach(s=>s.classList.remove('active'));
      tab.classList.add('active');
      const tgt = tab.getAttribute('data-target');
      document.querySelector(tgt)?.classList.add('active');
    });
  });
})();



// ------- Special Populations Calculators -------

// Helpers
function showResult(idBox, idDet, status, title, details){
  const box = document.getElementById(idBox);
  const det = document.getElementById(idDet);
  box.style.display = 'block'; det.style.display = 'block';
  box.className = 'status ' + (status||'warn');
  box.innerHTML = title;
  det.innerHTML = details;
}

// Valvulopatie
document.getElementById('calcValv')?.addEventListener('click', ()=>{
  const type = document.getElementById('valv_type').value;
  const ee = Number(document.getElementById('valv_ee').value || NaN);
  const tr = Number(document.getElementById('valv_tr').value || NaN);
  const pasp = Number(document.getElementById('valv_pasp').value || NaN);
  const pv = Number(document.getElementById('valv_pv_sd').value || NaN);
  const lavi = Number(document.getElementById('valv_lavi').value || NaN);
  const ara = Number(document.getElementById('valv_ar_a').value || NaN);

  const abn = [];
  if (ee>=14) abn.push('E/e′ elevato');
  if ((tr>=2.8) || (pasp>=35)) abn.push('TR/PASP elevato');
  if (pv<=0.67) abn.push('PV S/D ≤0.67');
  if (lavi>34) abn.push('LAVi >34');
  if (ara>30) abn.push('Ar−A >30 ms');

  let title='', status='warn', notes=[];
  if (type==='MR' || type==='MS' || type==='MAC'){
    notes.push('Nei casi MR severa, qualsiasi MS o MAC moderata‑severa, evitare algoritmo generale; interpretazione dedicata.');
  }
  if (abn.length>=2){
    title = '<strong>LAP aumentata probabile</strong> (valvulopatia)';
    status = 'bad';
  } else if (abn.length===0){
    title = 'LAP probabilmente normale (valvulopatia)';
    status = 'ok';
  } else {
    title = 'LAP indeterminata (valvulopatia)';
    status = 'warn';
  }
  const details = `<div class="kv"><div class="k">Anomalie</div><div>${abn.join(', ')||'—'}</div></div>
  ${notes.length?('<hr><ul><li>'+notes.join('</li><li>')+'</li></ul>'):''}`;
  showResult('valvResult','valvDetails',status,title,details);
});

// Trapianto cardiaco
document.getElementById('calcHtx')?.addEventListener('click', ()=>{
  const eprime = Number(document.getElementById('htx_eprime').value || NaN);
  const ee = Number(document.getElementById('htx_ee').value || NaN);
  const tr = Number(document.getElementById('htx_tr').value || NaN);
  const pv = Number(document.getElementById('htx_pv_sd').value || NaN);
  const lavi = Number(document.getElementById('htx_lavi').value || NaN);

  const flags=[];
  if (ee>=14) flags.push('E/e′ elevato');
  if (tr>=2.8) flags.push('TR ≥2.8');
  if (pv<=0.67) flags.push('PV S/D ≤0.67');
  if (lavi>34) flags.push('LAVi >34');
  if (eprime<=6.5) flags.push('e′ ridotta');

  let status='warn', title='LAP indeterminata (trapianto)';
  if (flags.length>=2){ status='bad'; title='<strong>LAP aumentata probabile</strong> (trapianto)'; }
  if (flags.length===0){ status='ok'; title='LAP probabilmente normale (trapianto)'; }
  const details = `<div class="kv"><div class="k">Criteri</div><div>${flags.join(', ')||'—'}</div></div>
  <hr><ul><li>Evita inferenze semplicistiche: correlare con clinica, tempi post‑HTX, biopsia/CMR se indicato.</li></ul>`;
  showResult('htxResult','htxDetails',status,title,details);
});

// Ipertensione polmonare
document.getElementById('calcPH')?.addEventListener('click', ()=>{
  const ea = Number(document.getElementById('ph_ea').value || NaN);
  const eel = Number(document.getElementById('ph_ee_lat').value || NaN);
  const lavi = Number(document.getElementById('ph_lavi').value || NaN);
  const lars = Number(document.getElementById('ph_lars').value || NaN);

  let status='warn', title='Indeterminato (PH)';
  let subtype = '', support=[];
  if (ea<=0.8){ subtype = 'pre‑capillare'; status='ok'; title='Probabile PH pre‑capillare'; }
  else if (ea>=2){ subtype = 'post‑capillare'; status='bad'; title='<strong>Probabile PH post‑capillare</strong>'; }
  else {
    if (eel>13) support.push('E/e′ lat >13');
    if (lavi>34) support.push('LAVi >34');
    if (lars<=16) support.push('LARS ≤16%');
    if (support.length>=1){ status='bad'; title='<strong>PH post‑capillare più probabile</strong>'; }
  }
  const details = `<div class="kv"><div class="k">Classificazione</div><div>${subtype||'—'}</div></div>
  <div class="kv"><div class="k">Supporto</div><div>${support.join(', ')||'—'}</div></div>`;
  showResult('phResult','phDetails',status,title,details);
});

// Blocco/LBBB/Pacing
document.getElementById('calcBlock')?.addEventListener('click', ()=>{
  const ea = Number(document.getElementById('block_ea').value || NaN);
  const ee = Number(document.getElementById('block_ee').value || NaN);
  const tr = Number(document.getElementById('block_tr').value || NaN);
  const lavi = Number(document.getElementById('block_lavi').value || NaN);
  const lars = Number(document.getElementById('block_lars').value || NaN);

  const flags=[];
  if (ee>=14) flags.push('E/e′ elevato');
  if (tr>=2.8) flags.push('TR ≥2.8');
  if (lavi>34) flags.push('LAVi >34');
  if (lars<=18) flags.push('LARS ≤18%');

  let status='warn', title='LAP indeterminata (blocco/pacing)';
  if (flags.length>=2){ status='bad'; title='<strong>LAP aumentata probabile</strong> (blocco/pacing)'; }
  if (flags.length===0 && ea<=0.8){ status='ok'; title='Pattern da rilasciamento alterato probabile (EA ≤0.8)'; }
  const details = `<div class="kv"><div class="k">Criteri</div><div>${flags.join(', ')||'—'}</div></div>
  <hr><ul><li>Attenzione alla fusione E/A; usare sweep 100 mm/s se necessario.</li></ul>`;
  showResult('blockResult','blockDetails',status,title,details);
});

// Restrittiva/Amiloidosi
document.getElementById('calcRestr')?.addEventListener('click', ()=>{
  const ea = Number(document.getElementById('restr_ea').value || NaN);
  const dt = Number(document.getElementById('restr_dt').value || NaN);
  const ivrt = Number(document.getElementById('restr_ivrt').value || NaN);
  const epm = Number(document.getElementById('restr_eprime_med').value || NaN);
  const apex = document.getElementById('restr_apex').value;

  const flags=[];
  if (ea>=2.5) flags.push('E/A ≥2.5');
  if (dt>0 && dt<150) flags.push('DT <150 ms');
  if (ivrt>0 && ivrt<50) flags.push('IVRT <50 ms');
  if (epm>0 && epm<=4) flags.push('e′ mediale 3–4 cm/s');
  if (apex==='si') flags.push('Apical-sparing GLS');

  let status='warn', title='Compatibilità non definita (restrittiva)';
  if (flags.length>=3){ status='bad'; title='<strong>Alta probabilità di pattern restrittivo</strong>'; }
  else if (flags.length===0){ status='ok'; title='Bassa probabilità di pattern restrittivo'; }

  const details = `<div class="kv"><div class="k">Indici</div><div>${flags.join(', ')||'—'}</div></div>
  <hr><ul><li>Correlare con clinica/biomarcatori; CMR e scintigrafia se indicato.</li></ul>`;
  showResult('restrResult','restrDetails',status,title,details);
});

// Pericardite costrittiva
document.getElementById('calcCostr')?.addEventListener('click', ()=>{
  const vm = Number(document.getElementById('costr_resp_mitral').value || NaN);
  const vt = Number(document.getElementById('costr_resp_tric').value || NaN);
  const epm = Number(document.getElementById('costr_eprime_med').value || NaN);
  const rev = document.getElementById('costr_reversus').value;

  const flags=[];
  if (vm>=25) flags.push('Δ mitralica ≥25%');
  if (vt>=40) flags.push('Δ tricuspidale ≥40%');
  if (epm>=7) flags.push('e′ mediale ≥7 cm/s');
  if (rev==='si') flags.push('Hepatic vein reversus');

  let status='warn', title='Costrizione non definita';
  if (flags.length>=2){ status='bad'; title='<strong>Compatibile con pericardite costrittiva</strong>'; }
  else if (flags.length===0){ status='ok'; title='Poco compatibile con costrizione'; }

  const details = `<div class="kv"><div class="k">Segni ecocardiografici</div><div>${flags.join(', ')||'—'}</div></div>
  <hr><ul><li>Integrare con Doppler tessutale settale/lat e variazioni respiratorie. Considerare TC/RM pericardica.</li></ul>`;
  showResult('costrResult','costrDetails',status,title,details);
});

// HCM
document.getElementById('calcHcm')?.addEventListener('click', ()=>{
  const ee = Number(document.getElementById('hcm_ee').value || NaN);
  const ea = Number(document.getElementById('hcm_ea').value || NaN);
  const lavi = Number(document.getElementById('hcm_lavi').value || NaN);
  const tr = Number(document.getElementById('hcm_tr').value || NaN);

  const risk=[];
  if (ee>=14) risk.push('E/e′ elevato');
  if (ea>=2) risk.push('E/A ≥2 (restrittivo)');
  if (lavi>34) risk.push('LAVi >34');
  if (tr>=2.8) risk.push('TR ≥2.8');

  let status='warn', title='Valutazione HCM';
  if (risk.length>=2){ status='bad'; title='<strong>Evidenza di riempimento elevato</strong> (HCM)'; }
  else if (risk.length===0){ status='ok'; title='Assenza di segni di riempimento elevato (HCM)'; }

  const details = `<div class="kv"><div class="k">Indicatori</div><div>${risk.join(', ')||'—'}</div></div>
  <hr><ul><li>Integrare con gradiente LVOT, sintomi, e parametri di rischio clinico.</li></ul>`;
  showResult('hcmResult','hcmDetails',status,title,details);
});

