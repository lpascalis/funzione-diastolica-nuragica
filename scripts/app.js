
let lastCopyText = "";

function el(tag, attrs={}, children=[]){
  const n=document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k==="class") n.className=v;
    else if (k==="for") n.htmlFor=v;
    else if (k.startsWith("on") && typeof v==="function") n.addEventListener(k.slice(2), v);
    else if (k==="html") n.innerHTML=v;
    else n.setAttribute(k,v);
  }
  for (const c of children) n.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
  return n;
}
function section(t){ return el("h2",{},[t]); }
function field(id,label,type="number",placeholder="",step="any"){ 
  return el("div",{class:"card"},[ el("label",{for:id},[label]), el("input",{id,type,placeholder,step,inputmode:"decimal"}) ]);
}
function resultBox(lines){ const b=el("div",{class:"result-box"}); lines.forEach(l=>b.appendChild(el("div",{html:l}))); return b; }
function small(t){ return el("div",{class:"small"},[t]); }
function setActive(view){ document.querySelectorAll(".seg").forEach(s=>s.classList.toggle("active", s.dataset.view===view)); }
function clearAllInputs(){ document.querySelectorAll("input").forEach(i=> i.type==="checkbox"||i.type==="radio" ? (i.checked=false) : (i.value="")); document.querySelectorAll(".result").forEach(r=> r.innerHTML=""); lastCopyText=""; }
function copyToast(msg){ const t=el("div",{class:"copy-toast"},[msg]); document.body.appendChild(t); setTimeout(()=>t.classList.add("show"),10); setTimeout(()=>{t.classList.remove("show"); setTimeout(()=>t.remove(),200);},1800); }

document.addEventListener("click",(e)=>{
  if (e.target.matches("#copyBtn")){
    if (!lastCopyText){ copyToast("Niente da copiare"); return; }
    navigator.clipboard.writeText(lastCopyText).then(()=>copyToast("Copiato"));
  }
  if (e.target.matches("#resetBtn")){ clearAllInputs(); window.scrollTo({top:0,behavior:"smooth"}); }
  if (e.target.closest("#tabs") && e.target.matches(".seg")){
    const v=e.target.dataset.view; setActive(v); render(v); window.scrollTo({top:0,behavior:"smooth"});
  }
});

/* costrizione locale (come v32b) */
function consAlgorithm(inputs){
  const hepatic=Number(inputs.hep_rev_ratio);
  const medial_e=Number(inputs.medial_e);
  const tv_insp=Number(inputs.tv_var);
  const mv_insp=Number(inputs.mv_var);
  const annulus_reversus = !!inputs.annulus_reversus;
  const strain_reversus  = !!inputs.strain_reversus;
  let flags=0;
  if (isFinite(hepatic) && hepatic>=0.8) flags++;
  if (isFinite(medial_e) && medial_e>7) flags++;
  if (isFinite(tv_insp) && tv_insp>40) flags++;
  if (isFinite(mv_insp) && mv_insp>25) flags++;
  if (annulus_reversus) flags++;
  if (strain_reversus) flags++;
  const present = flags>=3;
  const description = present ? "Costrizione pericardica: segni suggestivi presenti (≥3)." : "Costrizione pericardica: criteri non sufficienti.";
  return { present, flags, description };
}

function renderSinus(root){
  root.innerHTML="";
  root.appendChild(section("Ritmo sinusale (stima LAP e grading)"));
  const g=el("div",{class:"grid"});
  g.append(
    field("age","Età (anni)"),
    field("E","Mitral E (cm/s)"),
    field("A","Mitral A (cm/s)"),
    field("DT","DT E (ms)"),
    field("eS","e′ settale (cm/s)"),
    field("eL","e′ laterale (cm/s)"),
    field("TR","TR picco (m/s)"),
    field("PASP","PASP (mmHg)"),
    field("LARS","LARS (%)"),
    field("LAVi","LAVi (mL/m²)"),
    field("PVSD","Vene polmonari S/D (rapporto)"),
    field("IVRT","IVRT (ms)")
  );
  root.appendChild(g);

  const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const data={
      age:age.value, E:E.value, A:A.value, DT:DT.value,
      e_sept:eS.value, e_lat:eL.value, TR:TR.value, PASP:PASP.value,
      LARS:LARS.value, LAVi:LAVi.value, PV_SD:PVSD.value, IVRT:IVRT.value
    };
    const out=FDN.sinusAlgorithm(data);
    res.innerHTML="";
    if (out.error){ res.appendChild(resultBox([out.error])); lastCopyText=""; return; }
    const lapTxt = out.lap==="increased" ? "aumentate" : out.lap==="normal" ? "normali" : "indeterminate";
    const lines=[`LAP: <b>${lapTxt}</b>`, `${out.grade?`Grado di disfunzione: <b>${out.grade}</b>`:""}`, `<span class="small">E/A: ${out.EA?.toFixed(2)??"—"} · E/e′ medio: ${out.Ee_m?out.Ee_m.toFixed(1):"—"}</span>`];
    res.appendChild(resultBox(lines));
    res.appendChild(el("div",{class:"kpi"},[ el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description]) ]));
    lastCopyText = `LAP ${lapTxt}${out.grade?`, disfunzione diastolica grado ${out.grade}`:""}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderAF(root){
  root.innerHTML="";
  root.appendChild(section("Fibrillazione atriale"));
  const g=el("div",{class:"grid"});
  g.append(field("afE","Mitral E (cm/s)"), field("afeS","e′ settale (cm/s)"), field("afDT","DT E (ms)"), field("afTR","TR picco (m/s)"), field("afPASP","PASP (mmHg)"));
  root.appendChild(g); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.afAlgorithm({E:afE.value, e_sept:afeS.value, DT:afDT.value, TR:afTR.value, PASP:afPASP.value});
    const lapTxt = out.lap==="increased" ? "aumentate" : out.lap==="normal" ? "normali" : "indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`])); 
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `AF: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderTachy(root){
  root.innerHTML="";
  root.appendChild(section("Tachicardia sinusale"));
  const g=el("div",{class:"grid"});
  g.append(
    field("tIVRT","IVRT (ms)"),
    field("tPVSD","Vene polmonari S/D (rapporto)"),
    field("tPVfrac","Frazione sistolica vene polmonari (%)"),
    field("tE","Mitral E (cm/s)"),
    field("teS","e′ settale (cm/s)"),
    field("teL","e′ laterale (cm/s)")
  );
  root.appendChild(el("div",{class:"card small"},["Suggerimento: se E/A fusi, usa battito post‑extrasistolico per separare i picchi."]));
  root.appendChild(g);
  const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.tachyAlgorithm({IVRT:tIVRT.value, PV_SD:tPVSD.value, PV_sys_frac:tPVfrac.value, E:tE.value, e_sept:teS.value, e_lat:teL.value});
    const lapTxt = out.lap==="increased" ? "aumentate" : out.lap==="normal" ? "normali" : "indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`])); 
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `Tachicardia sinusale: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderPH(root){
  root.innerHTML="";
  root.appendChild(section("Ipertensione polmonare (fenotipo)"));
  const g=el("div",{class:"grid"});
  g.append(field("phE","Mitral E (cm/s)"), field("phA","Mitral A (cm/s)"), field("pheL","e′ laterale (cm/s)"), field("phLAVi","LAVi (mL/m²)"), field("phLARS","LARS (%)"));
  root.appendChild(g); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.phAlgorithm({E:phE.value,A:phA.value,e_lat:pheL.value,LAVi:phLAVi.value,LARS:phLARS.value});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`Classificazione: <b>${out.classification}</b>`,`LAP: <b>${lapTxt}</b>`]));
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `PH: ${out.classification}. LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderValv(root){
  root.innerHTML="";
  root.appendChild(section("Valvulopatie"));
  const sel=el("select",{id:"valvType"});
  [["MS","MS (stenosi mitralica)"],["MR","MR (rigurgito mitralico)"],["MAC","MAC (calcificazione anulare)"]].forEach(([v,t])=>{ sel.appendChild(el("option",{value:v},[t])); });
  root.appendChild(el("div",{class:"card"},[el("label",{for:"valvType"},["Seleziona il caso"]), sel]));
  const g=el("div",{class:"grid"});
  g.append(field("valvE","Mitral E (cm/s)"), field("valvA","Mitral A (cm/s)"), field("valvIVRT","IVRT (ms)"), field("valvIVRTTE","IVRT/(TE−e′)"), field("valvArA","Ar−A (ms)"), field("valveS","e′ settale (cm/s)"), field("valveL","e′ laterale (cm/s)"));
  const lowEFwrap=el("div",{class:"card"},[el("label",{for:"lowEF"},["FE ridotta? (solo MR)"]), el("input",{id:"lowEF",type:"checkbox"}), small("In MR si applica E/e′ medio >14 se FE ridotta.")]);
  root.append(g, lowEFwrap); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.valvAlgorithm({type:valvType.value,E:valvE.value,A:valvA.value,IVRT:valvIVRT.value,IVRT_over_TEe:valvIVRTTE.value,ArA:valvArA.value,e_sept:valveS.value,e_lat:valveL.value,lowEF:document.getElementById("lowEF").checked});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`])); 
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `Valvulopatia (${valvType.value}): LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderHTX(root){
  root.innerHTML=""; root.appendChild(section("Trapianto cardiaco"));
  const g=el("div",{class:"grid"});
  g.append(field("htxE","Mitral E (cm/s)"), field("htxeS","e′ settale (cm/s)"), field("htxeL","e′ laterale (cm/s)"), field("htxSR","Somma SRIVR (cm/s)"), field("htxTR","TR picco (m/s)"));
  root.appendChild(g); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.htxAlgorithm({E:htxE.value,e_sept:htxeS.value,e_lat:htxeL.value,SRIVR:htxSR.value,TR:htxTR.value});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`]));
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `Trapianto: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderLVAD(root){
  root.innerHTML=""; root.appendChild(section("LVAD"));
  const g=el("div",{class:"grid"});
  g.append(field("lvE","Mitral E (cm/s)"), field("lvA","Mitral A (cm/s)"), field("lvRAP","RAP (mmHg)"), field("lvPASP","PASP (mmHg)"), field("lveS","e′ settale (cm/s)"), field("lveL","e′ laterale (cm/s)"), field("lvLAVi","LAVi (mL/m²)"));
  const ias=el("div",{class:"card"},[el("label",{},["Setto interatriale"]), (()=>{ const w=el("div"); [["neutrale","neutral"],["spinto a destra","bulge_right"],["spinto a sinistra","bulge_left"]].forEach(([t,v],i)=>{ const id="ias"+i; w.appendChild(el("input",{id,type:"radio",name:"ias",value:v})); w.appendChild(el("label",{for:id},[" "+t])); w.appendChild(el("br")); }); return w; })(), small("Stima qualitativa di ΔLAP da IAS.") ]);
  root.append(g, ias); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const IAS = document.querySelector('input[name="ias"]:checked')?.value || "";
    const out=FDN.lvadAlgorithm({E:lvE.value,A:lvA.value,RAP:lvRAP.value,PASP:lvPASP.value,e_sept:lveS.value,e_lat:lveL.value,LAVi:lvLAVi.value,IAS});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`]));
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `LVAD: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderAVB(root){
  root.innerHTML=""; root.appendChild(section("Blocco AV / Pacing"));
  const g=el("div",{class:"grid"}); g.append(field("avTR","TR picco (m/s)"), field("avPASP","PASP (mmHg)"));
  const c=el("div",{class:"card"},[el("label",{for:"fuse"},["Fusione E/A presente?"]), el("input",{id:"fuse",type:"checkbox"}), small("Se fusione, E/A e E/e′ non utilizzabili.")]);
  root.append(g,c); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.avbAlgorithm({TR:avTR.value,PASP:avPASP.value,fusion:fuse.checked});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`]));
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `BAV/Pacing: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderRCM(root){
  root.innerHTML=""; root.appendChild(section("Cardiomiopatia restrittiva"));
  const g=el("div",{class:"grid"}); g.append(field("rcmE","Mitral E (cm/s)"), field("rcmA","Mitral A (cm/s)"), field("rcmDT","DT E (ms)"), field("rcmIVRT","IVRT (ms)"), field("rcmeS","e′ settale (cm/s)"), field("rcmeL","e′ laterale (cm/s)"));
  root.appendChild(g); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.rcmAlgorithm({E:rcmE.value,A:rcmA.value,DT:rcmDT.value,IVRT:rcmIVRT.value,e_sept:rcmeS.value,e_lat:rcmeL.value});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`]));
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `Restrittiva: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function renderCONS(root){
  root.innerHTML=""; root.appendChild(section("Costrizione pericardica (screening)"));
  const g=el("div",{class:"grid"}); g.append(field("consHEP","Rapporto reversal telediastolico/anterogrado (epatiche)"), field("consME","e′ mediale (cm/s)"), field("consTV","Var. TV con respiro (%)"), field("consMV","Var. MV con respiro (%)"));
  const flags=el("div",{class:"card"},[el("label",{},["Segni aggiuntivi"]), (()=>{const w=el("div"); [["Annulus reversus","annrev"],["Strain reversus","strrev"]].forEach(([t,id])=>{ w.appendChild(el("input",{id,type:"checkbox"})); w.appendChild(el("label",{for:id},[" "+t])); w.appendChild(el("br")); }); return w;})()]);
  root.append(g,flags); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Valuta"});
  btn.addEventListener("click",()=>{
    const out=consAlgorithm({hep_rev_ratio:consHEP.value, medial_e:consME.value, tv_var:consTV.value, mv_var:consMV.value, annulus_reversus:annrev.checked, strain_reversus:strrev.checked});
    res.innerHTML=""; res.appendChild(resultBox([out.description])); lastCopyText = `Costrizione: ${out.description}`;
  });
  root.appendChild(btn);
}

function renderHCM(root){
  root.innerHTML=""; root.appendChild(section("Cardiomiopatia ipertrofica (stima LAP)"));
  const g=el("div",{class:"grid"}); g.append(field("hcmE","Mitral E (cm/s)"), field("hcmeS","e′ settale (cm/s)"), field("hcmeL","e′ laterale (cm/s)"), field("hcmLAVi","LAVi (mL/m²)"), field("hcmTR","TR picco (m/s)"));
  root.appendChild(g); const res=el("div",{class:"result"}); root.appendChild(res);
  const btn=el("button",{class:"btn",html:"Calcola"});
  btn.addEventListener("click",()=>{
    const out=FDN.hcmAlgorithm({E:hcmE.value, e_sept:hcmeS.value, e_lat:hcmeL.value, LAVi:hcmLAVi.value, TR:hcmTR.value});
    const lapTxt= out.lap==="increased"?"aumentate": out.lap==="normal"?"normali":"indeterminate";
    res.innerHTML=""; res.appendChild(resultBox([`LAP: <b>${lapTxt}</b>`]));
    res.appendChild(el("div",{class:"kpi"},[el("span",{class:"pill"},["Commento"]), el("div",{class:"desc"},[out.description])]));
    lastCopyText = `HCM: LAP ${lapTxt}. ${out.description}`;
  });
  root.appendChild(btn);
}

function render(view){
  const root=document.getElementById("view");
  if (view==="sinus") return renderSinus(root);
  if (view==="af")    return renderAF(root);
  if (view==="tachy") return renderTachy(root);
  if (view==="ph")    return renderPH(root);
  if (view==="valv")  return renderValv(root);
  if (view==="htx")   return renderHTX(root);
  if (view==="lvad")  return renderLVAD(root);
  if (view==="avb")   return renderAVB(root);
  if (view==="rcm")   return renderRCM(root);
  if (view==="cons")  return renderCONS(root);
  if (view==="hcm")   return renderHCM(root);
}

render("sinus");
