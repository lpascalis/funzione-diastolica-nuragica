
function ageBand(age){
  if (age <= 39) return 0;
  if (age <= 65) return 1;
  return 2;
}
function ePrimeCutoffs(age){
  const band = ageBand(age);
  return [
    {s:7, l:10, a:9},
    {s:6, l:8,  a:7},
    {s:6, l:7,  a:6.5}
  ][band];
}
function parse(v){ const n = Number(v); return isFinite(n) ? n : null; }
function mean(vals){ const f=vals.filter(v=>typeof v==="number"); return f.length? f.reduce((a,b)=>a+b,0)/f.length : null; }

/* Ritmo sinusale */
function sinusAlgorithm(inputs){
  const age = parse(inputs.age);
  if (age==null) return { error:"Inserire l'età (obbligatoria)." };

  const E=parse(inputs.E), A=parse(inputs.A), EA=(E!=null&&A>0)?E/A:null;
  const es=parse(inputs.e_sept), el=parse(inputs.e_lat);
  const eav = mean([es,el]);
  const Ee_s=(E!=null&&es>0)?E/es:null;
  const Ee_l=(E!=null&&el>0)?E/el:null;
  const Ee_m=(E!=null&&eav>0)?E/eav:null;
  const TR=parse(inputs.TR), PASP=parse(inputs.PASP);
  const LARS=parse(inputs.LARS), LAVi=parse(inputs.LAVi), PVSD=parse(inputs.PV_SD), IVRT=parse(inputs.IVRT);

  const cut = ePrimeCutoffs(age);
  const red_e = ((es!=null && es<cut.s) || (el!=null && el<cut.l) || (eav!=null && eav<cut.a));
  const highEe = ((Ee_m!=null && Ee_m>14) || (Ee_s!=null && Ee_s>15) || (Ee_l!=null && Ee_l>13));

  let trpasp_abn = false;
  if (PASP!=null) trpasp_abn = PASP>=35;
  else if (TR!=null) trpasp_abn = TR>=2.8;

  const none3 = (!red_e && !highEe && !trpasp_abn);
  const all3 = (red_e && highEe && trpasp_abn);

  let lap="indeterminate", grade=null;
  if (all3) lap="increased";
  else if (none3) lap="normal";
  else {
    const addpos = (
      (LARS!=null && LARS<=18) || 
      (PVSD!=null && PVSD<=0.67) || 
      (LAVi!=null && LAVi>34)    || 
      (IVRT!=null && IVRT<=70)
    );
    lap = addpos ? "increased" : "normal";
  }

  if (EA!=null){
    if (EA>=2){ grade="III"; }
    else if (EA<=0.8){
      grade = (lap==="normal" && red_e) ? "I" : (lap==="increased" ? "II" : null);
    } else {
      grade = (lap==="increased") ? "II" : null;
    }
  } else { grade = (lap==="increased") ? "II" : null; }

  let description="";
  if (lap==="normal" && (!grade || grade==="I")) description = grade==="I" ?
    "Pattern diastolico da rilasciamento lento (grado I), senza evidenza di aumento delle pressioni di riempimento." :
    "Funzione diastolica complessivamente nei limiti; pressioni di riempimento non aumentate.";
  else if (lap==="increased"){
    if (grade==="III") description = "Pattern diastolico restrittivo (grado III), con evidenza di aumento marcato delle pressioni di riempimento.";
    else if (grade==="II") description = "Pattern diastolico pseudonormale (grado II), con incremento delle pressioni di riempimento sinistro.";
    else description = "Aumento delle pressioni di riempimento ventricolare sinistro.";
  } else description = "Valutazione indeterminata: parametri discordanti o incompleti.";

  return { lap, grade, EA, E, A, e_s:es, e_l:el, e_av:eav, Ee_s, Ee_l, Ee_m, TR, PASP, addVars:{LARS,LAVi,PVSD,IVRT}, red_e, highEe, trpasp_abn, description };
}

/* Fibrillazione atriale */
function afAlgorithm(inputs){
  const E=parse(inputs.E), es=parse(inputs.e_sept), DT=parse(inputs.DT);
  const TR=parse(inputs.TR), PASP=parse(inputs.PASP);
  const Ee_s=(E!=null&&es>0)?E/es:null;

  let pos=0;
  if (E!=null && E>=100) pos++;
  if (Ee_s!=null && Ee_s>11) pos++;
  if ((TR!=null && TR>=2.8) || (PASP!=null && PASP>35)) pos++;
  if (DT!=null && DT<=160) pos++;

  let lap="indeterminate";
  if (pos>=2) lap="increased";
  else if (pos<=1) lap="normal";

  const description = lap==="increased" ? "Fibrillazione atriale: criteri multiparametrici indicano pressioni di riempimento aumentate."
    : lap==="normal" ? "Fibrillazione atriale: pressioni di riempimento non aumentate."
    : "Fibrillazione atriale: valutazione indeterminata.";
  return { lap, positives:pos, E, e_s:es, Ee_s, DT, TR, PASP, description };
}

/* Tachicardia sinusale */
function tachyAlgorithm(inputs){
  const IVRT=parse(inputs.IVRT);
  const PVSD=parse(inputs.PV_SD);
  const PVfrac=parse(inputs.PV_sys_frac);
  const E=parse(inputs.E), es=parse(inputs.e_sept), el=parse(inputs.e_lat);
  const eav = mean([es,el]);
  const Ee_m=(E!=null && eav>0)? E/eav : null;

  let pos=0;
  if (IVRT!=null && IVRT<=70) pos++;
  const pvPos = (PVfrac!=null && PVfrac<=40) || (PVSD!=null && PVSD<=0.67);
  if (pvPos) pos++;
  if (Ee_m!=null && Ee_m>14) pos++;

  let lap="indeterminate";
  if (pos>=2) lap="increased";
  else if (pos===0) lap="normal";

  const description = lap==="increased" ? "Tachicardia sinusale: combinazione di indici (IVRT, PV, E/e′) coerente con LAP aumentate."
    : lap==="normal" ? "Tachicardia sinusale: indici non suggestivi per LAP aumentate."
    : "Tachicardia sinusale: quadro non univoco; integrare con misure ripetute o post‑extrasistoliche.";
  return { lap, IVRT, PVSD, PVfrac, Ee_m, description };
}

/* Ipertensione polmonare */
function phAlgorithm(inputs){
  const E=parse(inputs.E), A=parse(inputs.A), EA=(E!=null&&A>0)?E/A:null;
  const el=parse(inputs.e_lat), LAVi=parse(inputs.LAVi), LARS=parse(inputs.LARS);
  const Ee_l=(E!=null&&el>0)?E/el:null;

  let classification="indeterminate", lap="indeterminate";
  if (EA!=null){
    if (EA<=0.8){ classification="precapillare (non cardiaca)"; lap="normal"; }
    else if (EA>=2){ classification="postcapillare (cuore sinistro)"; lap="increased"; }
    else {
      let score=0;
      if (Ee_l!=null && Ee_l>13) score++;
      if (LAVi!=null && LAVi>34) score++;
      if (LARS!=null && LARS<18) score++;
      if (score>=2){ classification="postcapillare (cuore sinistro)"; lap="increased"; }
      else if (score===0){ classification="precapillare (non cardiaca)"; lap="normal"; }
      else { classification="probabile precapillare"; lap="normal"; }
    }
  }
  const description = lap==="increased" ? "Profilo compatibile con PH post‑capillare: pressioni di riempimento aumentate."
    : lap==="normal" ? "Profilo compatibile con PH non cardiaca (pre‑capillare): pressioni di riempimento non aumentate."
    : "Valutazione indeterminata per PH.";
  return { EA, E, A, e_l:el, Ee_l, LAVi, LARS, classification, lap, description };
}

/* Valvulopatie */
function valvAlgorithm(inputs){
  const type=inputs.type;
  const E=parse(inputs.E), A=parse(inputs.A), EA=(E!=null&&A>0)?E/A:null;
  const IVRT=parse(inputs.IVRT), IVRTover=parse(inputs.IVRT_over_TEe), ArA=parse(inputs.ArA);
  const es=parse(inputs.e_sept), el=parse(inputs.e_lat);
  const eav= mean([es,el]);
  const EFdep = inputs.lowEF===true;

  let lap="indeterminate", description="";
  if (type==="MS"){
    const crit1=(IVRT!=null && IVRT<60);
    const crit2=(A!=null && A>150);
    const crit3=(IVRTover!=null && IVRTover<4.2);
    if (crit3 || (crit1 && crit2)){ lap="increased"; description="Stenosi mitralica: indicatori coerenti con LAP aumentate."; }
    else if (crit1 || crit2){ lap="indeterminate"; description="Stenosi mitralica: indicatori parziali; integrazione consigliata."; }
    else { lap="normal"; description="Stenosi mitralica: nessuna evidenza di LAP aumentate."; }
  }
  if (type==="MR"){
    const crit1=(IVRT!=null && IVRT<60);
    const crit2=(ArA!=null && ArA>=30);
    const crit3=(IVRTover!=null && IVRTover<5.6);
    const crit4=(EFdep && eav!=null && E!=null && (E/eav)>14);
    const pos=[crit1,crit2,crit3,crit4].filter(Boolean).length;
    if (pos>=2){ lap="increased"; description="Rigurgito mitralico: profilo coerente con LAP aumentate."; }
    else if (pos===0){ lap="normal"; description="Rigurgito mitralico: pressioni non aumentate."; }
    else { lap="indeterminate"; description="Rigurgito mitralico: valutazione indeterminata."; }
  }
  if (type==="MAC"){
    if (EA!=null){
      if (EA<0.8){ lap="normal"; description="MAC moderata/severa: E/A <0.8 → LAP non aumentate."; }
      else if (EA>1.8){ lap="increased"; description="MAC moderata/severa: E/A >1.8 → LAP aumentate."; }
      else {
        if (IVRT!=null){
          if (IVRT>=80){ lap="normal"; description="MAC: IVRT ≥80 ms → LAP non aumentate."; }
          else { lap="increased"; description="MAC: IVRT <80 ms → LAP aumentate."; }
        } else { lap="indeterminate"; description="MAC: necessario IVRT per definire le LAP."; }
      }
    } else { lap="indeterminate"; description="MAC: servono E ed A per procedere."; }
  }
  return { lap, description, EA, E, A, IVRT, ArA, IVRT_over_TEe:IVRTover };
}

/* Trapianto */
function htxAlgorithm(inputs){
  const E=parse(inputs.E), es=parse(inputs.e_sept), el=parse(inputs.e_lat);
  const eav = mean([es,el]);
  const Ee_m=(E!=null && eav>0)? E/eav : null;
  const SRIVR=parse(inputs.SRIVR), TR=parse(inputs.TR);

  let lap="indeterminate";
  if (Ee_m!=null){
    if (Ee_m<7) lap="normal";
    else if (Ee_m>14) lap="increased";
    else {
      if (SRIVR!=null && SRIVR>0 && E!=null){
        lap = (E/SRIVR > 200) ? "increased" : "normal";
      } else if (TR!=null){ lap = (TR>2.8) ? "increased" : "normal"; }
    }
  }
  const description = lap==="increased" ? "Trapianto cardiaco: criteri coerenti con LAP aumentate."
    : lap==="normal" ? "Trapianto cardiaco: LAP non aumentate."
    : "Trapianto cardiaco: valutazione indeterminata.";
  return { lap, Ee_m, SRIVR, TR, description };
}

/* LVAD */
function lvadAlgorithm(inputs){
  const E=parse(inputs.E), A=parse(inputs.A), EA=(E!=null&&A>0)?E/A:null;
  const RAP=parse(inputs.RAP), PASP=parse(inputs.PASP);
  const es=parse(inputs.e_sept), el=parse(inputs.e_lat);
  const eav = mean([es,el]);
  const Ee_m=(E!=null && eav>0)? E/eav : null;
  const Ee_s=(E!=null && es>0)? E/es : null;
  const LAVi=parse(inputs.LAVi);
  const IAS=inputs.IAS;

  let criteria=0;
  if (EA!=null && EA>2) criteria++;
  if (RAP!=null && RAP>10) criteria++;
  if (PASP!=null && PASP>40) criteria++;
  if ((Ee_m!=null && Ee_m>14) || (Ee_s!=null && Ee_s>=15)) criteria++;
  if (LAVi!=null && LAVi>33) criteria++;
  if (IAS) criteria++;

  const lap = (criteria>=2) ? "increased" : (criteria===0 ? "normal" : "indeterminate");
  const description = lap==="increased" ? "LVAD: criteri multipli indicano LAP aumentate."
    : lap==="normal" ? "LVAD: LAP non aumentate."
    : "LVAD: valutazione indeterminata.";
  return { lap, criteria, EA, RAP, PASP, Ee_m, Ee_s, LAVi, IAS, description };
}

/* AV block / pacing */
function avbAlgorithm(inputs){
  const fused = inputs.fusion===true;
  const TR=parse(inputs.TR), PASP=parse(inputs.PASP);
  let lap="indeterminate";
  if (TR!=null || PASP!=null){
    const abn = ( (TR!=null && TR>=2.8) || (PASP!=null && PASP>=35) );
    lap = abn ? "increased" : "normal";
  }
  const description = lap==="increased" ? "BAV/Pacing: LAP aumentate (stima basata su TR/PASP; E/A e E/e′ inaffidabili se fusione presente)."
    : lap==="normal" ? "BAV/Pacing: LAP non aumentate (stima basata su TR/PASP)."
    : "BAV/Pacing: dati insufficienti (inserire TR o PASP).";
  return { lap, fused, TR, PASP, description };
}

/* Restrittiva */
function rcmAlgorithm(inputs){
  const E=parse(inputs.E), A=parse(inputs.A), EA=(E!=null&&A>0)?E/A:null;
  const DT=parse(inputs.DT), IVRT=parse(inputs.IVRT);
  const es=parse(inputs.e_sept), el=parse(inputs.e_lat);
  const eav = mean([es,el]);
  const Ee_m=(E!=null && eav>0)? E/eav : null;

  let pos=0;
  if (EA!=null && EA>2.5) pos++;
  if (DT!=null && DT<140) pos++;
  if (IVRT!=null && IVRT<50) pos++;
  if (Ee_m!=null && Ee_m>14) pos++;

  let lap="indeterminate";
  if (pos>=2) lap="increased";

  const description = lap==="increased" ? "Cardiomiopatia restrittiva: combinazione di indici (≥2) coerente con LAP aumentate."
    : "Cardiomiopatia restrittiva: criteri insufficienti per definire LAP aumentate.";
  return { lap, EA, DT, IVRT, Ee_m, description };
}

/* HCM */
function hcmAlgorithm(inputs){
  const E=parse(inputs.E), el=parse(inputs.e_lat), es=parse(inputs.e_sept);
  const Ee_l=(E!=null && el>0)?E/el:null;
  const Ee_s=(E!=null && es>0)?E/es:null;
  const LAVi=parse(inputs.LAVi), TR=parse(inputs.TR);

  let score=0, lap="indeterminate";
  if (Ee_l!=null && Ee_l>13) score++;
  if (Ee_s!=null && Ee_s>15) score++;
  if (LAVi!=null && LAVi>34) score++;
  if (TR!=null && TR>=2.8) score++;

  if (score>=2) lap="increased";
  else if (score===0) lap="normal";

  const description = lap==="increased" ? "HCM: profilo compatibile con LAP aumentate."
    : lap==="normal" ? "HCM: LAP non aumentate."
    : "HCM: valutazione indeterminata.";
  return { lap, Ee_l, Ee_s, LAVi, TR, description };
}

window.FDN = { sinusAlgorithm, afAlgorithm, tachyAlgorithm, phAlgorithm, valvAlgorithm, htxAlgorithm, lvadAlgorithm, avbAlgorithm, rcmAlgorithm, hcmAlgorithm };
