// Boots index.html headlessly against bloodwork.js and asserts it actually RENDERS.
// node --check only proves it parses. This proves it works.
//   usage:  node tools/check-js.js
const fs=require('fs'), path=require('path'), root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=html.slice(html.lastIndexOf('<script>')+8, html.lastIndexOf('</script>'));
const src=fs.readFileSync(path.join(root,'bloodwork.js'),'utf8');
const DATA=JSON.parse(src.slice(src.indexOf('{')).trim().replace(/;$/,''));

const el=id=>({id,innerHTML:'',value:'',dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},
 addEventListener(){},focus(){},blur(){},style:{setProperty(){}},offsetLeft:70,offsetWidth:34,offsetTop:0,
 setAttribute(){},title:'',closest:()=>null,tHead:null,querySelector:()=>null,files:[],
 insertAdjacentHTML(){},getBoundingClientRect:()=>({top:0,bottom:0,left:0,right:0,height:70,width:0})});
const n={}; ['chips','toc','tbl','srch','q','qx','sbtn','tbtn','top','topbar','odisc','omoon','osun','pick'].forEach(i=>n[i]=el(i));
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
global.document={getElementById:i=>n[i]||(n[i]=el(i)),
 querySelector:q=>(q==='.wrap'||q==='thead tr'||q==='thead th'||q==='meta[name=theme-color]')?el(q):null,
 querySelectorAll:()=>[],addEventListener(){},
 documentElement:{dataset:{},style:{setProperty(){}},classList:{add(){},remove(){}}},
 activeElement:{id:''},createElement:()=>el('x'),fonts:{ready:Promise.resolve()}};
global.window={addEventListener(){},scrollTo(){},scrollBy(){},scrollY:0,scrollX:0,innerHeight:900,
 matchMedia:()=>({matches:false}),storage:null,BLOODWORK:DATA};
global.requestAnimationFrame=f=>f(); global.clearTimeout=()=>{};
global.getComputedStyle=()=>({paddingLeft:'20px',getPropertyValue:()=>'#FFFFFF'});
let fail=0;
process.on('unhandledRejection',e=>{console.log('  ❌ async failure:',e);process.exit(1);});
(0,eval)(js);
setTimeout(()=>{
  const ok=(name,cond,extra='')=>{console.log(`  ${cond?'✅':'❌'} ${name}${extra?'  '+extra:''}`); if(!cond)fail++;};
  const rows=h=>(h.match(/<tr class="m"/g)||[]).length;
  const cols=h=>{const th=(h.match(/<th /g)||[]).length;
    const f=h.slice(h.indexOf('<tr class="m"'),h.indexOf('</tr>',h.indexOf('<tr class="m"')));
    return [th,(f.match(/<td /g)||[]).length];};
  // two separate guards: the renderer must not DROP a marker, and the data must not LOSE one
  ok('renders a row per marker', rows(n.tbl.innerHTML)===DATA.MARK.length,
    rows(n.tbl.innerHTML)+' rows / '+DATA.MARK.length+' markers');
  ok('89 markers', DATA.MARK.length===89, DATA.MARK.length+' markers');
  ok('schema version is explicit and supported',DATA.schemaVersion===2,`schema ${DATA.schemaVersion}`);
  {const c=DATA.CALCULATIONS&&DATA.CALCULATIONS.correctedCalcium;
   ok('personal corrected-calcium rule is data-configured',c&&
     c.albuminSetpointGPerDl===4&&c.albuminMaxGPerDl===4&&
     c.coefficientMgDlPerGdl===1&&c.outputUnit==='mg/dL');}
  {const fields=['measures','matters','caveat'];
   ok('every marker has the three-part description contract',DATA.MARK.every(m=>
     m.note&&typeof m.note==='object'&&!Array.isArray(m.note)&&
     Object.keys(m.note).length===fields.length&&fields.every(k=>typeof m.note[k]==='string'&&m.note[k].trim())));
   let rendered='';
   try{rendered=(0,eval)('markerNoteHTML(window.BLOODWORK.MARK[0].note)');}catch(e){rendered=e.message;}
   ok('marker descriptions render all three visible section labels',
     (rendered.match(/class="mnsec"/g)||[]).length===3&&
     ['What it measures','Why it matters','Main caveat'].every(label=>rendered.includes(label)),
     rendered.slice(0,120));}
  {const expansions={
    tsh:'TSH (Thyroid-Stimulating Hormone)',egfr:'eGFR (Estimated Glomerular Filtration Rate)',
    apob:'ApoB (Apolipoprotein B)',hscrp:'hs-CRP (High-Sensitivity C-Reactive Protein)',
    a1c:'HbA1c (Hemoglobin A1c)',alt:'ALT (Alanine Aminotransferase)',
    ast:'AST (Aspartate Aminotransferase)',ggt:'GGT (Gamma-Glutamyl Transferase)',
    shbg:'SHBG (Sex Hormone-Binding Globulin)',dht:'DHT (Dihydrotestosterone)',
    lh:'LH (Luteinizing Hormone)',fsh:'FSH (Follicle-Stimulating Hormone)',
    mpv:'MPV (Mean Platelet Volume)',mcv:'MCV (Mean Corpuscular Volume)',
    mch:'MCH (Mean Corpuscular Hemoglobin)',mchc:'MCHC (Mean Corpuscular Hemoglobin Concentration)',
    rdw:'RDW (Red Cell Distribution Width)',tibc:'TIBC (Total Iron-Binding Capacity)',
    dheas:'DHEA-S (Dehydroepiandrosterone Sulfate)',igf1:'IGF-1 (Insulin-Like Growth Factor 1)'};
   ok('acronym-only marker descriptions open with their expanded name',
     Object.entries(expansions).every(([id,line])=>DATA.MARK.find(m=>m.id===id).note.measures.startsWith(line+'\n')),
     Object.keys(expansions).length+' expansions');
   let mcvRendered='';
   try{mcvRendered=(0,eval)('markerNoteHTML(window.BLOODWORK.MARK.find(m=>m.id==="mcv").note)');}catch(e){mcvRendered=e.message;}
   ok('the acronym expansion renders before the first description section',
     mcvRendered.startsWith('<div class="mnterm">MCV (Mean Corpuscular Volume)</div><section class="mnsec"><div class="mnlabel">What it measures</div>'),
     mcvRendered.slice(0,160));}
  ok('legacy clin/opt fields are gone',
    DATA.MARK.every(m=>m.clin===undefined&&m.opt===undefined&&m.oc===undefined));
  // ALL 89 carry one as of 2026-08-14, by the owner's explicit decision: he wants to see where he
  // sits on every marker and accepts that position does not always matter and that assay changes
  // between draws explain some movement — the bold orange note already warns about the latter.
  // The bar moved with it: 'is there a published citable interval', not 'does it transfer
  // universally'. So the evidence GRADE now carries the doubt that rejection used to — 20 of the
  // last batch are 'weak' on purpose. What this assertion still guards is that none goes MISSING.
  ok('every marker carries an evidence reference',
    DATA.MARK.filter(m=>m.reference).length===89&&DATA.MARK.find(m=>m.id==='tt').reference,
    DATA.MARK.filter(m=>m.reference).length+' references');
  ok('every evidence reference declares scope, method and review date',DATA.MARK.filter(m=>m.reference)
    .every(m=>['strong','moderate','weak'].includes(m.reference.evidence)&&m.reference.source&&
      m.reference.population&&m.reference.method&&/^\d{4}-\d{2}-\d{2}$/.test(m.reference.reviewed)));
  // esr, ige and mpv were the three deliberate Blood Count blanks — analyser-dependent enough that
  // a universal interval overstates comparability. They now carry one, weak-graded, with the
  // analyser named in method. The guard becomes: those three must SAY they are method-bound.
  {const cbc=DATA.MARK.filter(m=>m.cat==='cbc');
   ok('all 17 Blood Count markers carry a reference',
     cbc.length===17&&cbc.filter(m=>m.reference).length===17,
     `${cbc.filter(m=>m.reference).length}/${cbc.length}`);
   ok('the three analyser-bound Blood Count markers name their analyser',
     ['esr','ige','mpv'].every(id=>{const m=DATA.MARK.find(x=>x.id===id);
       return m.reference&&m.reference.method.length>300;}));}
  const targetIds=DATA.MARK.filter(m=>m.target).map(m=>m.id);
  // Seven, not five: vitamin D and selenium were culled in the target audit and restored by the
  // owner on 2026-08-05. Both are weak-graded on purpose — the grade carries the doubt, and the
  // vitamin-D window is the one the NEXTDRAW titration rule already steers by.
  ok('only the seven sanctioned optimization targets remain',
    targetIds.join(',')==='vitd,sel,o3,tg,apob,nonhdl,ldl',targetIds.join(','));
  ok('all evidence targets declare strength and source',DATA.MARK.filter(m=>m.target)
    .every(m=>['strong','moderate','weak'].includes(m.target.evidence)&&m.target.source&&m.target.label));
  const latestFor=id=>latest(DATA.MARK.find(m=>m.id===id));
  const state=id=>{const m=DATA.MARK.find(x=>x.id===id),L=latestFor(id);return status(m,L.v,L.raw);};
  const colour=id=>{const m=DATA.MARK.find(x=>x.id===id),L=latestFor(id);return tone(m,L.v,L.raw);};
  ok('reference-only results render neutral rather than green',colour('tt')==='neutral',colour('tt'));
  ok('results inside an evidence target retain green',colour('tg')==='ok',colour('tg'));
  ok('results outside a reference retain red',colour('mpv')==='out',colour('mpv'));
  // copper was 'none' while its only interval was the lab's own print. It now has a sourced one,
  // so it is judged like everything else — what must NOT happen is the printed lab interval
  // becoming the judge, which is what claim() reporting 'reference' here confirms.
  ok('copper is judged by its sourced reference, not the printed lab interval',
    claim(DATA.MARK.find(m=>m.id==='cu'),latestFor('cu').v,latestFor('cu').raw).kind==='reference');
  ok('omega-3 follows its weak evidence target, not the printed 8–11 lab interval',
    state('o3')==='watch'&&claim(DATA.MARK.find(m=>m.id==='o3'),latestFor('o3').v,latestFor('o3').raw).kind==='target',
    state('o3'));
  ok('total testosterone uses the harmonized evidence reference',
    state('tt')==='ok'&&claim(DATA.MARK.find(m=>m.id==='tt'),latestFor('tt').v,latestFor('tt').raw).kind==='reference',
    state('tt'));
  ok('platelets use the healthy-male evidence reference rather than a lab interval',
    state('plt')==='ok'&&claim(DATA.MARK.find(m=>m.id==='plt'),latestFor('plt').v,latestFor('plt').raw).kind==='reference',
    state('plt'));
  ok('white blood cells use a sourced population interval',
    state('wbc')==='ok'&&claim(DATA.MARK.find(m=>m.id==='wbc'),latestFor('wbc').v,latestFor('wbc').raw).kind==='reference',
    state('wbc'));
  // MPV now carries a sourced (weak, analyser-named) reference and reads 'out' — correct, not an
  // artefact: 12.1 fL is above the 7.4-10.8 his own laboratory printed for that draw. The guard
  // that still matters is that the judgement comes from the sourced band, not the lab's print.
  ok('MPV is judged by its sourced reference, not the printed lab interval',
    claim(DATA.MARK.find(m=>m.id==='mpv'),latestFor('mpv').v,latestFor('mpv').raw).kind==='reference',
    state('mpv'));
  {const m=DATA.MARK.find(x=>x.id==='tt'),d=DATA.DATA.draws.find(x=>x.date==='2026-07-20');
   const h=ptHTML(m,d);
   ok('printed lab reference remains in the datapoint bubble',
     h.includes('Lab reference')&&h.includes('8.63')&&h.includes('28.98 nmol/L'));}
  ok('primary gauge no longer promotes the latest lab interval',
    !mini(DATA.MARK.find(m=>m.id==='tt')).includes('Latest lab reference'));
  {const gauges=DATA.MARK.map(mini).join('');
   ok('benchmark gauges show no decision-limit layer',
     !gauges.includes('Decision limits')&&!gauges.includes('mgz'));
   ok('compact gauges expose non-colliding optimal endpoints',
     mini(DATA.MARK.find(m=>m.id==='apob')).includes('class="o"')&&
     mini(DATA.MARK.find(m=>m.id==='apob')).includes('>90</span>'));}
  ok('decision limits remain stored but do not drive status',
    DATA.MARK.some(m=>m.cut)&&state('chol')==='ok'&&
    claim(DATA.MARK.find(m=>m.id==='chol'),latestFor('chol').v,latestFor('chol').raw).kind==='reference');
  ok('LDL remains a target watch without decision-limit status',state('ldl')==='watch'&&
    claim(DATA.MARK.find(m=>m.id==='ldl'),latestFor('ldl').v,latestFor('ldl').raw).kind==='target');
  ok('eGFR 83.4 is not labelled CKD without kidney-damage evidence',state('egfr')==='ok',state('egfr'));
  ok('ApoB is a target watch, not a lab abnormality',state('apob')==='watch'&&
    claim(DATA.MARK.find(m=>m.id==='apob'),latestFor('apob').v,latestFor('apob').raw).kind==='target');
  // The vitamin-D window and the NEXTDRAW titration rule must agree. They are the same number
  // stated twice, so a change to one that skips the other is the failure this catches.
  ok('vitamin D targets the same 30-50 window its draw rule titrates to',
    (()=>{const t=DATA.MARK.find(m=>m.id==='vitd').target;
      return t&&t.min===30&&t.max===50&&t.evidence==='weak'&&
        DATA.NEXTDRAW.items.find(x=>x.en.startsWith('25-OH vitamin D')).trigger.includes('30–50');})());
  {const m=DATA.MARK.find(x=>x.id==='hg');
   const order=DATA.NEXTDRAW.items.find(x=>x.en==='Total mercury — whole blood');
   ok('mercury is a one-time whole-blood ICP-MS decision test',m&&order&&
     m.cat==='exposure'&&m.am==='critical'&&m.reference.max===6.84&&
     m.reference.evidence==='weak'&&!m.target&&m.cut.zones[1].min===5&&m.cut.zones[2].min===15&&
     order.g==='decision'&&order.draws.includes('main')&&/whole blood/i.test(order.en)&&
     /ICP-MS/.test(order.method)&&/no routine repeat/i.test(order.timing));}
  ok('routine renal calibration is deferred rather than ordered',
    !DATA.NEXTDRAW.items.some(x=>/cystatin|kidney filtration|creatinine/i.test(x.en))&&
    DATA.NEXTDRAW.deferred.some(x=>x.en==='Cystatin C + eGFRcys + combined eGFR'&&x.s==='defer')&&
    DATA.NEXTDRAW.items.find(x=>x.en.startsWith('Chemistry + liver bundle')).method.includes('Do not add creatinine'));
  ok('the inconclusive July urine assay does not create a routine repeat',
    !DATA.NEXTDRAW.items.some(x=>/urine protein\/creatinine/i.test(x.en))&&
    DATA.NEXTDRAW.deferred.some(x=>x.en==='Urine protein/creatinine ratio'&&x.s==='remove'));
  ok('Next Draw does not ask the laboratory to retain a sample',
    !DATA.NEXTDRAW.protocol.some(x=>/retained sample|hold the serum|keep the serum/i.test(`${x.t} ${x.v}`)));
  ok('glucose, HbA1c and hs-CRP do not manufacture optimal bands',
    ['glu','a1c','hscrp'].every(id=>!DATA.MARK.find(m=>m.id===id).target));
  ok('omega-3 target has a proposed floor but no evidence-defined ceiling',
    DATA.MARK.find(m=>m.id==='o3').target.min===8&&DATA.MARK.find(m=>m.id==='o3').target.max===undefined);
  ok('formula or assay-transfer conflicts are weak-graded',
    ['cacorr','pth','igf1'].every(id=>DATA.MARK.find(m=>m.id===id).reference.evidence==='weak'));
  ok('a censored uPCR above the reference ceiling is unresolved, not diagnosed high',state('upcr')==='watch'&&
    claim(DATA.MARK.find(m=>m.id==='upcr'),latestFor('upcr').v,latestFor('upcr').raw).label.includes('does not resolve'));
  ok('boot placeholder replaced', !n.tbl.innerHTML.includes('Loading…'));
  ['all','flag','crit'].forEach(f=>{ setF(f);
    const [th,td]=cols(n.tbl.innerHTML);
    ok(`view "${f}" columns line up`, th===td, `th=${th} td=${td}`); });
  setF('all');
  ['flip','goto','onQ'].forEach(fn=>{
    try{ ({flip:()=>flip(),goto:()=>goto('cbc'),onQ:()=>onQ('hemoglobine')})[fn](); ok(fn+'()',true); }
    catch(e){ ok(fn+'()',false,e.message); } });
  onQ('');
  // the three data pages render from their blocks, and every entry survives the trip
  const count=(h,c)=>(h.match(new RegExp(`class="${c}`,'g'))||[]).length;
  // mirror the renderer's hour walk exactly: a TALL block must reach a later hour AND sit
  // alone in its starting hour; everything else (sub-hour ranges included) renders as a card
  const R0=DATA.ROUTINE;
  let _hr=parseInt(R0[0].t),_hEnd=parseInt(R0[R0.length-1].t),tallN=0,cardN=0;
  while(_hr<=_hEnd){
    const evs=R0.filter(r=>parseInt(r.t)===_hr);
    const b=evs.length===1&&evs[0].until&&parseInt(evs[0].until)>_hr&&parseInt(evs[0].t.slice(3),10)===0?evs[0]:null;
    if(b){tallN++;_hr=Math.min(parseInt(b.until),_hEnd+1);continue;}
    // mirror the carried-block rule: the first mid-hour span claiming whole empty
    // hours leaves its row and renders them as its own block row
    let cEnd=0;
    for(const r of evs){
      if(!r.until||parseInt(r.t.slice(3),10)===0)continue;
      let e=Math.min(parseInt(r.until),_hEnd+1);
      for(let x=_hr+1;x<e;x++)if(R0.some(q=>parseInt(q.t)===x)){e=x;break;}
      if(e>_hr+1){cEnd=e;break;}
    }
    cardN+=evs.length;
    if(cEnd){tallN++;_hr=cEnd;continue;}
    _hr++;
  }
  const want={nextdraw:['ndrow',DATA.NEXTDRAW.items.length],
    stack:['srow',DATA.STACK.items.length],
    routine:['rev',R0.length],   // every entry renders one row now — blocks included
    training:['ccard',DATA.TRAINING.cards.length],
    grooming:['ccard',DATA.CARE.filter(c=>!c.schedule&&!c.tier).length],   // a scheduled card renders as a grid and a .tier one as a plain list — neither is a ccard
    diet:['ccard',DATA.DIET.meals.filter(m=>m.at).length+1]};   // timed meals + Evening; Weekly and the nutrition profile are plain sections
  Object.entries(want).forEach(([p,[cls,n2]])=>{
    try{ setPage(p);
      ok(`page "${p}" renders ${n2} ${cls}`, count(n.pages.innerHTML,cls)===n2,
        count(n.pages.innerHTML,cls)+' rendered'); }
    catch(e){ ok(`page "${p}"`,false,e.message); } });
  // every supplement carries an evidence tag ON THE ROW, and a sectioned tooltip behind the ⓘ.
  // Both are silent when they break: a missing tag renders as an empty span, and an info left
  // as a prose string renders as "[object Object]" without throwing.
  try{ setPage('stack');
    const H=n.pages.innerHTML, N=DATA.STACK.items.length;
    ok(`stack shows ${N} evidence tags`, count(H,'sev ')===N, count(H,'sev ')+' tags');
    ok('every tag is a known value',
      (H.match(/class="sev ([a-z]+)"/g)||[]).every(m=>/strong|moderate|weak|none/.test(m)));
    ok(`stack tooltips are sectioned`, count(H,'ntab one')===DATA.STACK.items.filter(s=>s.info).length,
      count(H,'ntab one')+' sectioned tips');
    ok('no tooltip stringified an object', !H.includes('[object Object]'));
    // 'Judge by' renders in exactly ONE place per item: the row for the parked tier, the bubble
    // for everything else. Both or neither would be silent — one is a duplicate, the other a
    // criterion that vanished.
    const parked=DATA.STACK.items.filter(s=>s.cat==='maylater'&&s.judge).length;
    const live=DATA.STACK.items.filter(s=>s.cat!=='maylater'&&s.judge).length;
    ok(`${parked} judge rows on parked items`, count(H,'sjudge')===parked, count(H,'sjudge')+' rows');
    ok(`${live} judge sections in live tooltips`, (H.match(/>Judge by</g)||[]).length===live,
      (H.match(/>Judge by</g)||[]).length+' sections');
  }catch(e){ ok('stack evidence tags',false,e.message); }
  // the routine is a RULER: every hour from wake to lights-out gets a rail mark, and a
  // gym/work block renders as ONE box owning its whole span of hours
  try{ setPage('routine');
    const R=DATA.ROUTINE;
    const hours=parseInt(R[R.length-1].t)-parseInt(R[0].t)+1;
    const blocks=tallN;
    ok(`routine marks ${hours} hours on the rail`, count(n.pages.innerHTML,'rhl')===hours,
      count(n.pages.innerHTML,'rhl')+' marks');
    ok(`routine draws ${blocks} span rows`, count(n.pages.innerHTML,'rhr rblockrow')===blocks,
      count(n.pages.innerHTML,'rhr rblockrow')+' blocks');
    // block starts/ends earn the LONG tics, clamped to the ruler's range
    const H0=parseInt(R[0].t),H1=parseInt(R[R.length-1].t),lt=new Set();
    R.forEach(r=>{if(r.until){if(parseInt(r.t.slice(3),10)===0)lt.add(parseInt(r.t));if(parseInt(r.until.slice(3),10)===0)lt.add(parseInt(r.until));}});
    lt.add(H0);   // mirror the renderer: the day's start draws a boundary line
    // mirror the suppression rule: an hour whose predecessor ended mid-hour
    // with its own cut draws no boundary line
    {let hh=H0;const mm=t=>parseInt(t.slice(3),10)/60;
     while(hh<=H1){const e2=R.filter(r=>parseInt(r.t)===hh);
       const b2=e2.length===1&&e2[0].until&&parseInt(e2[0].until)>hh&&parseInt(e2[0].t.slice(3),10)===0?e2[0]:null;
       if(b2){hh=Math.min(parseInt(b2.until),H1+1);continue;}
       const em2=e2.map(r=>{if(!r.until)return null;const uh=parseInt(r.until);
         return uh===hh?mm(r.until):(uh>hh?1:null);});
       if(e2.length&&em2.every(x=>x!=null)&&Math.max(...em2)<1)lt.delete(hh+1);
       hh++;}}
    const ltN=[...lt].filter(hh=>hh>=H0&&hh<=H1).length;
    ok(`routine draws ${ltN} long tics`, count(n.pages.innerHTML,'rhl lt')===ltN,
      count(n.pages.innerHTML,'rhl lt')+' long tics');
    // mirror the renderer: rows whose events all end inside their hour draw
    // hairlines at the fractional boundaries (17:30-style cuts)
    let rlnN=0,hr3=H0;
    while(hr3<=H1){
      const evsAll=R.filter(r=>parseInt(r.t)===hr3);
      const b3=evsAll.length===1&&evsAll[0].until&&parseInt(evsAll[0].until)>hr3&&parseInt(evsAll[0].t.slice(3),10)===0?evsAll[0]:null;
      if(b3){hr3=Math.min(parseInt(b3.until),H1+1);continue;}
      // mirror the carried-block rule: the carried span leaves this hour's row
      let car3=null,cEnd3=0;
      const evs3=evsAll.filter(r=>{
        if(car3||!r.until||parseInt(r.t.slice(3),10)===0)return true;
        let e=Math.min(parseInt(r.until),H1+1);
        for(let x=hr3+1;x<e;x++)if(R.some(q=>parseInt(q.t)===x)){e=x;break;}
        if(e<=hr3+1)return true;
        car3=r;cEnd3=e;return false;
      });
      const mins=t=>parseInt(t.slice(3),10)/60;
      const sp=evs3.map(r=>{let em=null;
        if(r.until){const uh=parseInt(r.until);em=uh===hr3?mins(r.until):(uh>hr3?1:null);}
        return {sm:mins(r.t),em};});
      if(evs3.length&&sp.every(x=>x.em!=null)){
        const st=new Set(sp.map(x=>x.sm)),en=new Set(sp.map(x=>x.em));
        rlnN+=new Set(sp.flatMap(x=>[x.sm,x.em])
          .filter(f=>f>0&&f<1&&!(st.has(f)&&en.has(f)))).size;
      }
      if(car3){hr3=cEnd3;continue;}
      hr3++;
    }
    ok(`routine cuts ${rlnN} half-hour lines`, count(n.pages.innerHTML,'rln')===rlnN,
      count(n.pages.innerHTML,'rln')+' cuts'); }
  catch(e){ ok('routine ruler',false,e.message); }
  // the dental/face protocol cards live on their own Grooming tab now — and must NOT leak back.
  // The Stack has its own cards (one per daily group), so a bare ccard count no longer proves
  // anything: it would pass with a grooming card sitting in the middle. Count the stack's own
  // exactly, then look for the CARE cards by their data-care id.
  // NOT by title. The Stack's own "May add later" tier header is plain text on the page, so a
  // Grooming card of the same name read as a leak that was never there — the check failed on a
  // string the Stack has always legitimately owned. data-care is emitted only by cardRow, which
  // renders Grooming and Training and never the Stack, so the attribute is proof where the title
  // was a guess. The id check below is what gives this one teeth: no id, no attribute, no catch.
  try{ setPage('stack');
    const daily=new Set(DATA.STACK.items.filter(s=>s.cat!=='maylater').map(s=>s.cat)).size;
    ok(`stack shows ${daily} daily cards`, count(n.pages.innerHTML,'ccard')===daily,
      count(n.pages.innerHTML,'ccard')+' on stack');
    ok('every care card carries an id', DATA.CARE.every(c=>c.id),
      DATA.CARE.filter(c=>!c.id).map(c=>c.t).join(', ')||'all present');
    ok('no care card leaked onto stack', !n.pages.innerHTML.includes('data-care="'));
    setPage('grooming');
    // a .tier card is NOT a ccard — it renders as the Stack's plain parked list, so it must be
    // out of the card count and present as a .pgtier instead. Counting it as a card was the
    // assertion that caught the switch, which is the point: the two shapes cannot both be right.
    const cards=DATA.CARE.filter(c=>!c.schedule&&!c.tier).length, grids=DATA.CARE.filter(c=>c.schedule).length,
          tiers=DATA.CARE.filter(c=>c.tier).length;
    ok(`grooming shows ${tiers} plain tier${tiers===1?'':'s'}`, count(n.pages.innerHTML,'pgtier')===tiers,
      count(n.pages.innerHTML,'pgtier')+' tiers');
    DATA.CARE.filter(c=>c.tier).forEach(c=>ok(`tier "${c.t}" renders no card`,
      !n.pages.innerHTML.includes(`ccard" data-care="${c.id}"`)));
    ok(`grooming shows ${cards} care card${cards===1?'':'s'}`, count(n.pages.innerHTML,'ccard')===cards,
      count(n.pages.innerHTML,'ccard')+' cards');
    ok(`grooming shows ${grids} schedule grid${grids===1?'':'s'}`, count(n.pages.innerHTML,'cgrid')===grids,
      count(n.pages.innerHTML,'cgrid')+' grids');
    const cg=DATA.CARE.reduce((a,c)=>a+(c.groups?c.groups.length:0),0);
    ok(`care cards show ${cg} cadence groups`, count(n.pages.innerHTML,'cgrp')===cg,
      count(n.pages.innerHTML,'cgrp')+' groups');
    // the grid must draw exactly one dot per row per day — no silently dropped or doubled cells
    const gd=DATA.CARE.filter(c=>c.schedule).reduce((a,c)=>{const days=c.schedule.days.length;
      return a+c.schedule.sections.reduce((b,s)=>b+s.rows.length*days,0);},0);
    ok(`grid draws ${gd} day cells`, count(n.pages.innerHTML,'cgdot')===gd,
      count(n.pages.innerHTML,'cgdot')+' dots'); }
  catch(e){ ok('grooming care cards',false,e.message); }
  // training cards are organised in muscle-group sub-sections; every set renders a column
  try{ setPage('training');
    const BI=DATA.TRAINING.benchmarks.items,H=n.pages.innerHTML;
    const exercises=DATA.TRAINING.cards.flatMap(c=>(c.groups||[]).flatMap(g=>g.items||[]))
      .filter(x=>x&&typeof x==='object');
    ok('training carries no hover-tooltip data or hooks',
      exercises.every(x=>x.info===undefined)&&H.includes('Shoulder prep')&&
      !H.includes('class="infob"')&&!H.includes('class="exinfo')&&
      !H.includes('onclick="pinTip(')&&!H.includes(' title='));
    ok('training has no May add later section',
      DATA.TRAINING.maylater===undefined&&!H.includes('May add later')&&!H.includes('trpark'));
    // Ten since 2026-08-12: two jumps and grip joined the seven running/VO2max rows.
    ok('training shows the ten agreed benchmarks',count(H,'rbrow')===10&&
      BI.map(x=>x.id).join(',')==='run100,run400,runmile,run5k,run10k,run20hr,vo2max,vjump,bjump,grip',
      BI.map(x=>x.id).join(','));
    ok('benchmark table has no separate personal-best column',!/<th[^>]*>\s*(PB|Personal best)\s*<\/th>/i.test(H));
    ok('personal bests and tiers are derived, never stored',BI.every(x=>
      ['pb','personalBest','tier','optional','core'].every(k=>x[k]===undefined)));
    {const timed=BI.filter(x=>x.kind==='time');
     ok('five timed events carry men and women elite context plus athletic comparisons',
       timed.length===5&&timed.every(x=>x.world&&x.athletic&&x.women&&x.women.world&&x.women.elite&&
         typeof x.women.elite.display==='string'),
       timed.map(x=>`${x.id}:${x.women?'women':'missing'}`).join(','));}
    const M=BI.find(x=>x.id==='runmile');
    /* The mile is INDEXED off the 5km row, not measured. Its own 21,799 Fifth Avenue Mile finishes
       were real but came from a mass-participation field whose median is casual entrants, and they
       sat 3% off the same cohort's 5km on Riegel in the opposite direction to the 10km — a measured
       time from the wrong population beats nothing, but loses to a modelled one from the right
       cohort. Assert the projection itself, so the row cannot drift off the curve it is defined by. */
    {const K5=BI.find(x=>x.id==='run5k'),F=Math.pow(5000/1609,1.06),near=(a,b)=>Math.abs(a-b)<=1;
     ok('mile is projected from the 5km row and shares its cohort',
       near(M.athletic.median,K5.athletic.median/F)&&near(M.athletic.min,K5.target.max/F)&&
       near(M.athletic.max,K5.athletic.max/F)&&near(M.target.min,K5.target.min/F)&&
       near(M.target.max,K5.target.max/F)&&
       M.athletic.evidence==='weak'&&M.target.evidence==='weak'&&
       M.athletic.source===K5.athletic.source&&
       M.athletic.label==='Recreational runners'&&
       /MODELLED, not measured/.test(M.athletic.basis)&&
       /Riegel/.test(M.athletic.basis),
       `${M.athletic.median} vs ${(K5.athletic.median/F).toFixed(1)}`);}
    const K5=BI.find(x=>x.id==='run5k'),K10=BI.find(x=>x.id==='run10k');
    ok('5K and 10K use the age-filtered recreational-runner bands',
      K5.athletic.min===1070&&K5.athletic.max===1372&&K5.athletic.median===1198&&
      K5.athletic.label==='Recreational runners'&&K5.athletic.basis.includes('535 men aged 19–39')&&
      K5.target.min===992&&K5.target.max===1070&&K5.target.label==='Recreational runners'&&
      K10.athletic.min===2290&&K10.athletic.max===3000&&K10.athletic.median===2628.5&&
      K10.athletic.label==='Recreational runners'&&K10.athletic.basis.includes('352 men aged 19–39')&&
      K10.target.min===2090&&K10.target.max===2290&&K10.target.label==='Recreational runners');
    ok('fixed-pace heart rate has no invented universal comparison',
      !BI.find(x=>x.kind==='heart-rate').world&&!BI.find(x=>x.kind==='heart-rate').athletic);
    const V=BI.find(x=>x.kind==='vo2');
    ok('VO2max uses the measured recreational-runner band and no world-record line',
      V.athletic.min===51.6&&V.athletic.max===59.2&&V.athletic.evidence==='moderate'&&
      V.athletic.label==='Recreational runners'&&V.athletic.basis.includes('94 male recreational runners')&&
      !V.world);
    const J=BI.find(x=>x.id==='vjump'),B=BI.find(x=>x.id==='bjump'),G=BI.find(x=>x.id==='grip'),PT=BI.filter(x=>x.target);
    ok('vertical jump uses the Plyomat trained-athlete percentiles',
      J.athletic.min===42.4&&J.athletic.max===63.5&&J.athletic.median===52.3&&
      J.target.min===63.5&&J.target.max===77.3&&J.athletic.heading==='Active men range'&&
      J.athletic.label==='Trained athletes'&&J.athletic.evidence==='weak'&&
      J.athletic.source.includes('plyomat.com'));
    ok('grip uses the international adult norms rather than inferred confidence intervals',
      G.athletic.min===43&&G.athletic.max===55.4&&G.athletic.median===49.1&&
      G.target.min===55.4&&G.target.max===61.7&&G.athletic.heading==='General men range'&&
      G.athletic.label==='Men, international norms'&&
      G.athletic.source.includes('10.1016/j.jshs.2024.101014'));
    ok('grip top rung uses the official NHL two-hand-average record with its protocol caveat',
      G.elite.label==='NHL Combine'&&G.elite.value===89.3&&
      G.elite.source==='https://records.nhl.com/draft/combine/grip-strength'&&
      G.elite.basis.includes('Sean Farmer')&&G.elite.basis.includes('average of both hands')&&
      G.elite.basis.includes('not directly interchangeable'));
    /* The sprints have no sampled adult distribution anywhere — the old band was a normal curve
       fitted to 400 PE students in an obscure journal that never reported its timing method.
       These are practitioner rules of thumb instead, pinned here so a later pass cannot drift
       them, and deliberately held to one decimal: a tenth is the finest a hand-timed sprint
       can honestly claim. The two rows must stay mutually consistent — each 400m quarter runs
       1.2 to 1.4 times the matching 100m time, and that ratio shrinks as ability rises. */
    {const S=id=>BI.find(x=>x.id===id);const H=S('run100'),Q=S('run400');
     const ratio=(q,h)=>(q/4)/h;
     ok('sprints use one-decimal practitioner benchmarks, mutually consistent',
       H.precision===1&&Q.precision===1&&
       H.athletic.min===12.6&&H.athletic.max===14.5&&H.athletic.median===13.5&&
       H.target.min===11.9&&H.target.max===12.6&&
       Q.athletic.min===66&&Q.athletic.max===86&&Q.athletic.median===75&&
       Q.target.min===59&&Q.target.max===66&&
       [H,Q].every(x=>x.athletic.evidence==='weak'&&x.target.evidence==='weak'&&
         x.athletic.label==='Recreational runners'&&x.target.label==='Recreational runners'&&
         !/ijmess|PE students/i.test(x.athletic.source+x.athletic.basis+x.target.basis))&&
       // the multiplier must fall as the athlete gets faster, never rise
       ratio(Q.athletic.max,H.athletic.max)>ratio(Q.athletic.median,H.athletic.median)&&
       ratio(Q.athletic.median,H.athletic.median)>ratio(Q.target.min,H.target.min),
       `ratios slow→fast: ${[[Q.athletic.max,H.athletic.max],[Q.athletic.median,H.athletic.median],
         [Q.target.min,H.target.min]].map(([q,h])=>ratio(q,h).toFixed(2)).join(' > ')}`);}
    ok('broad jump uses adult measured norms with an explicit modelled upper band',
      B.athletic.min===207.7&&B.athletic.max===233.7&&B.athletic.median===220.7&&
      B.target.min===233.7&&B.target.max===245.3&&B.athletic.basis.includes('2,552')&&
      B.athletic.source.includes('10.1519/JSC.0000000000004980'));
    // The P75–P90 claim is made ONCE, by the page intro, so no target may carry its own copy —
    // nine identical captions crowded out the line that should hold the actual numbers. What
    // stays per-row is the check no sentence can fake: the target starts at the peer band's edge.
    ok('all performance targets are P75–P90 and begin at the peer band edge',
      PT.map(x=>x.id).join(',')==='run100,run400,runmile,run5k,run10k,vo2max,vjump,bjump,grip'&&
      PT.every(x=>x.target.span===undefined&&
        !/(top quartile to P90|upper-quartile band|percentile)/.test(x.target.label)&&
        (x.direction==='lower'?x.target.max===x.athletic.min:x.target.min===x.athletic.max)),
      PT.map(x=>`${x.id}:${x.target.span===undefined?'edge '+(x.direction==='lower'?x.target.max===x.athletic.min:x.target.min===x.athletic.max):'span still set'}`).join(', '));
    /* Top 50%, Top 25% and Top 10% are DERIVED, so the only stored rung is the top one. Assert the
       derivation rather than the stored numbers: a grade that stopped tracking its own band would
       still render, and nothing else would notice. */
    {const bad=PT.filter(x=>{const t=rbTiers(x),lower=x.direction==='lower',by=k=>t.find(z=>z.k===k);
       return t.length!==4||by('avg').v!==x.athletic.median||
         by('good').v!==(lower?x.target.max:x.target.min)||
         by('exc').v!==(lower?x.target.min:x.target.max)||
         by('top').v!==x.elite.value||by('top').t!==x.elite.label;});
     ok('every graded row derives Top 50%/Top 25%/Top 10% and stores only the top rung',
       bad.length===0&&PT.every(x=>['Olympic entry standard','World class','NFL Combine','NHL Combine'].includes(x.elite.label)),
       bad.length?bad.map(x=>x.id).join(','):PT.map(x=>x.elite.label).join(','));}
    /* The 5km and 10km rows come from independent subgroups of one survey, so they are NOT forced
       onto a shared curve — that would swap measured times for modelled ones. What is guarded is
       that they stay physiologically coherent: every 10km rung is slower than Riegel projects from
       its 5km counterpart (recreational runners fade over distance), and the excess SHRINKS as
       ability rises. A row edited into a faster-than-Riegel 10km, or into a widening gap, is
       describing a population that does not exist. */
    {const K5=PT.find(x=>x.id==='run5k'),KX=PT.find(x=>x.id==='run10k'),RIEGEL=Math.pow(2,1.06);
     const pair=[[K5.athletic.median,KX.athletic.median],[K5.target.max,KX.target.max],[K5.target.min,KX.target.min]];
     const ratios=pair.map(([a,b])=>b/a);
     ok('the 5km and 10km ladders stay physiologically coherent',
       ratios.every(r=>r>RIEGEL&&r<2.3)&&ratios[0]>ratios[1]&&ratios[1]>ratios[2]&&
       /independent subgroups/.test(K5.athletic.basis)&&/not the same 535 men/.test(KX.athletic.basis),
       ratios.map(r=>r.toFixed(3)).join(' > ')+` vs Riegel ${RIEGEL.toFixed(3)}`);}
    ok('the top rung sits beyond Top 10% on every graded row',
      PT.every(x=>x.direction==='lower'?x.elite.value<x.target.min:x.elite.value>x.target.max),
      PT.map(x=>`${x.id}:${x.elite.value}`).join(' '));
    {const vo=PT.find(x=>x.id==='vo2max');
     ok('the VO2max world-class anchor uses the relevant physiology review and states its limits',
       vo.elite.value===85&&vo.elite.source==='https://doi.org/10.1152/physiol.00052.2014'&&
       /83-85mL\/kg\/min/.test(vo.elite.basis)&&/rare values above 90/.test(vo.elite.basis)&&
       /does not define world-class performance/.test(vo.elite.basis));}
    {const mi=PT.find(x=>x.id==='runmile'),vo=PT.find(x=>x.id==='vo2max');
     ok('a value below Top 50% earns no grade, and the best reached rung wins',
       rbGradeOf(mi,420)===null&&rbGradeOf(mi,360).k==='avg'&&rbGradeOf(mi,298).k==='exc'&&
       rbGradeOf(mi,200).k==='top'&&rbGradeOf(vo,40)===null&&rbGradeOf(vo,62.7).k==='exc'&&
       rbGradeOf(vo,90).k==='top');}
    ok('peer-range headings match the measured cohorts',
      BI.filter(x=>['run100','run400'].includes(x.id)).every(x=>x.athletic.heading==='Active men range')&&
      BI.filter(x=>['runmile','run5k','run10k','vo2max'].includes(x.id)).every(x=>x.athletic.heading==='Recreational runners range'));
    const grps=DATA.TRAINING.cards.reduce((a,c)=>a+(c.groups?c.groups.length:0),0);
    ok(`training shows ${grps} muscle groups`, count(n.pages.innerHTML,'cgrp')===grps,
      count(n.pages.innerHTML,'cgrp')+' groups');
    // mirror the renderer: uniform weight+reps collapse to one exkg line
    // ("40kg - 3x5"); uniform weight with mixed reps keeps reps columns;
    // mixed weights keep full per-set columns (kg</i> suffixes)
    let inlineN=0,colN=0,kgColN=0;
    DATA.TRAINING.cards.forEach(c=>(c.groups||[]).forEach(g=>g.items.forEach(x=>{
      if(x.sets&&x.sets.length){
        const uniW=new Set(x.sets.map(s=>String(s[0]))).size===1;
        const uniR=new Set(x.sets.map(s=>String(s[1]))).size===1;
        if(uniW&&uniR)inlineN++;
        else if(uniW){if(x.sets[0][0]!=null)inlineN++;colN+=x.sets.length;}
        else{colN+=x.sets.length;x.sets.forEach(s=>{if(s[0]!=null)kgColN++;});}}})));
    ok(`training inlines ${inlineN} weight/set specs`, count(n.pages.innerHTML,'exkg')===inlineN,
      count(n.pages.innerHTML,'exkg')+' inlined');
    ok(`training renders ${colN} set columns`, count(n.pages.innerHTML,'exset"')===colN,
      count(n.pages.innerHTML,'exset"')+' columns');
    const kgSeen=(n.pages.innerHTML.match(/kg<\/i>/g)||[]).length;
    ok(`training keeps ${kgColN} per-set weights`, kgSeen===kgColN, kgSeen+' in columns'); }
  catch(e){ ok('training groups',false,e.message); }
  // Populate the in-memory copy briefly to exercise history, PB, delta and chart rendering.
  // Nothing is written back to bloodwork.js.
  try{
    const BI=DATA.TRAINING.benchmarks.items,R=BI.find(x=>x.id==='run100'),M=BI.find(x=>x.id==='runmile'),
      B=BI.find(x=>x.id==='bjump'),V=BI.find(x=>x.id==='vo2max'),F=BI.find(x=>x.id==='run20hr');
    const E=runningBenchmarks(),ED=rbDetail(R,[],2),MD=rbDetail(M,[],2),BD=rbDetail(B,[],2),
      K5D=rbDetail(BI.find(x=>x.id==='run5k'),[],2),VD=rbDetail(V,[],2),FD=rbDetail(F,[],2);
    // An untested row now draws the plot too, so the bands are visible before the first attempt.
    // rbrefs is reserved for a row with no band AND no record — nothing to plot at all.
    // count PLOT lines only: the legend keys draw the same class, so a bare class match doubles it
    const rungs=d=>(d.match(/<line class="rbt rbt-[a-z]+(?: rbmen-elite)?" data-tier=/g)||[]).length;
    ok('untested benchmark rows still draw their full grade ladder',
      (E.match(/onclick="rbToggle/g)||[]).length===10&&ED.includes('rbcplot')&&
      ED.includes('Recreational runners')&&rungs(ED)===4&&
      !ED.includes('top quartile to P90')&&ED.includes('World record'));
    ok('the shaded band is gone from every graded row',
      BI.filter(x=>x.target).every(x=>{const d=rbDetail(x,[],2);
        return !d.includes('class="rbtg"')&&!d.includes('class="rbbg"')&&!d.includes('<line class="rbmed"');}));
    ok('mile plots four rungs and labels its Top 25% and Top 10% values on the axis',
      rungs(MD)===4&&MD.includes('4:58')&&MD.includes('5:22')&&MD.includes('>4:00<')&&
      !MD.includes('P25–P75'));
    ok('broad jump plots four rungs and labels its own',
      rungs(BD)===4&&BD.includes("234")&&BD.includes("245")&&BD.includes(">"+rbFmt(B,B.elite.value)+"/")&&
      />221\/87</.test(BD)&&
      // the NFL rung round-trips to exactly the 130-inch combine mark it came from
      BD.includes(">330/130<")&&BD.includes(">cm/in<")&&
      !BD.includes('P25–P75'));
    ok('VO2max keeps its cohort name above the ladder',
      !VD.includes('Recreational runners range')&&
      VD.includes('Recreational runners')&&rungs(VD)===4);
    ok('performance chart scale spans Top 50% through the top rung',
      // VO2max renders whole numbers now, so the axis reads 55/59/63, not 55.4/59.2/62.7
      />55<\/span>/.test(VD)&&/>59<\/span>/.test(VD)&&/>63<\/span>/.test(VD)&&
      />85<\/span>/.test(VD));
    {const ids=['run400','run5k','run10k'],missing=ids.filter(id=>{
       const x=BI.find(y=>y.id===id),d=rbDetail(x,[],2),axis=(d.match(/<div class="rbcy">[\s\S]*?<\/div>/)||[])[0]||'';
       return !axis.includes(`>${rbFmt(x,x.elite.value)}</span>`)||
         !axis.includes(`class="rbcytick rbcywr"`)||!axis.includes(`>${x.world.display}</span>`);
     });
     ok('colliding world-record and entry-standard numbers both remain on the axis',
       missing.length===0,missing.join(',')||'all visible');
     const placed=rbSpreadLabels([{id:'entry',y:100,h:12},{id:'record',y:94,h:12}]),
       entry=placed.find(x=>x.id==='entry'),record=placed.find(x=>x.id==='record');
     ok('the upper world-record number yields above a nearby entry-standard number',
       record.top+record.h+3<=entry.top,`${record.top}px above ${entry.top}px`);}
    /* Dropping target.span once made the legend fall through to a numeric range instead of
       printing nothing — the band's edges appeared a third time, beside an axis and an intro
       that already carried them. A target legend prints the cohort alone.
       The peer-only branch is NOT asserted here: every benchmark with a peer band now also
       carries a target, so `athletic && !target` matches nothing and any check over it would
       pass vacuously — coverage that reads real and tests nothing. */
    ok('no target legend prints a range',
      BI.filter(x=>x.target).every(x=>!/<small class="rbrange">/.test(rbDetail(x,[],2))),
      BI.filter(x=>x.target).filter(x=>/<small class="rbrange">/.test(rbDetail(x,[],2))).map(x=>x.id).join(',')||'none leaking');
    /* Each rung's legend key must pair to its own plotted line by data-tier, or fitRbChart cannot
       find the y to sit beside and the key drifts off its line. Assert the pairing, not the count:
       four of each with no shared attribute would pass a count and still render misaligned. */
    /* Every rung names ITSELF inside the plot now, so the pairing to guard is label-to-line: one
       label per plotted rung, each carrying that rung's own class, plus the record. A label with
       no matching line would float at whatever y the last edit left it, with nothing to notice. */
    ok('every graded chart labels each rung inside the plot, on its own line',
      BI.filter(x=>x.target).every(x=>{const d=rbDetail(x,[],2);
        const lines=[...d.matchAll(/<line class="rbt rbt-([a-z]+)(?: rbmen-elite)?" data-tier="([a-z]+)"/g)];
        const labs=[...d.matchAll(/<span class="rbclabi rbt-([a-z]+)(?: rbclab-men-elite)?" style="top:([-0-9.]+)px"/g)];
        const lineY=Object.fromEntries(lines.map(m=>[m[2],null]));
        [...d.matchAll(/<line class="rbt rbt-[a-z]+(?: rbmen-elite)?" data-tier="([a-z]+)" x1="0" x2="1000" y1="([-0-9.]+)"/g)]
          .forEach(m=>lineY[m[1]]=m[2]);
        return lines.length===4&&labs.length===4&&
          lines.map(m=>m[2]).join(',')==='avg,good,exc,top'&&
          labs.every(m=>lineY[m[1]]===m[2])&&           // label sits exactly on its own line
          !d.includes('class="rbcpad"')&&               // the side legend is gone
          d.includes('class="rbcdots"')&&               // dots ride their own layer
          (d.split(`class="rbsource" href="${x.target.source}"`).length-1)===1&&
          d.includes(`class="rbsource" href="${x.elite.source}"`)&&
          d.includes(rbFmt(x,x.athletic.median));}));
    ok('fixed-pace remains personal progression only, with no ladder',
      FD.includes('Personal progression only')&&!FD.includes('rbt-')&&!FD.includes('percentile<'));
    const hiddenPeer=JSON.parse(JSON.stringify(V));
    Object.assign(hiddenPeer.athletic,{min:-999,max:999,label:'Hidden peer sentinel',span:'hidden'});
    ok('hidden peer-band metadata cannot affect a target-plus-median chart or legend',
      rbDetail(hiddenPeer,[],2)===VD);
    /* A row with a peer band but no target still works: it keeps the shaded band and shows the one
       rung it can derive. Top 25% and Top 10% come from the target, so a row without one must not
       invent them — a ladder that quietly filled its middle rungs from the band edges would put
       two named grades on the page that no source ever stated. */
    const peerOnly=JSON.parse(JSON.stringify(V)); delete peerOnly.target; delete peerOnly.elite;
    const peerOnlyDetail=rbDetail(peerOnly,[],2);
    ok('a peer-only row keeps its band and derives only Top 50%',
      peerOnlyDetail.includes('class="rbbg"')&&!peerOnlyDetail.includes('class="rbtg"')&&
      (peerOnlyDetail.match(/<line class="rbt rbt-[a-z]+" data-tier=/g)||[]).length===1&&
      peerOnlyDetail.includes('data-tier="avg"')&&
      !/>Top 25%<|>Top 10%</.test(peerOnlyDetail)&&
      peerOnlyDetail.includes(`aria-label="Source for ${peerOnly.athletic.label}"`)&&
      !peerOnlyDetail.includes('Source ↗')&&
      peerOnlyDetail.includes('rbclabi rbt-avg'));
    ok('population source is a compact linked arrow after the comparison name, not a median row',
      VD.includes(`class="rbsource" href="${V.target.source}"`)&&VD.includes('&nbsp;<a class="rbsource"')&&
      VD.includes('class="rbcohline"')&&VD.includes('>↗</a></b>')&&
      !VD.includes('Source ↗')&&!VD.includes('class="rblinks"'));
    ok('5K cohort arrow keeps the requested primary-study URL and accessible label',
      K5D.includes('class="rbsource" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5000509/"')&&
      K5D.includes('aria-label="Source for Recreational runners"'));
    ok('the world record draws one line and names itself beside it',
      (ED.match(/<line class="rbwr"/g)||[]).length===1&&!ED.includes('class="rbsw wr"')&&
      /<span class="rbclabi rbclab-wr"/.test(ED)&&
      /aria-label="Source for the men's world record">↗<\/a>/.test(ED)&&!ED.includes('>Source ↗<'));
    ok('world-record cards show only the compact sex label and source arrow',
      ED.includes('Men · World record')&&!ED.includes('Usain Bolt')&&!ED.includes("'09")&&
      !ED.includes('Outdoor track')&&!ED.includes('Berlin')&&!ED.includes('2009-08-16'));
    {const timed=BI.filter(x=>x.kind==='time');
     const olympic=timed.filter(x=>x.id!=='runmile');
     const waParis='https://assets.aws.worldathletics.org/document/64b027b60f3d42ed998901b5.pdf';
     ok('timed references use accessible blue-men and pink-women theme tokens',
       html.includes('--sex-men:#3D6AA8; --sex-women:#9C5C7C;')&&
       html.includes('--sex-men:#7FB3F0; --sex-women:#D9A3BC;')&&
       html.includes('.rbwr{stroke:var(--sex-men)')&&
       html.includes('.rbwomen-wr{stroke:var(--sex-women)')&&
       html.includes('.rbwomen-elite{stroke:var(--sex-women)'));
     ok('every mixed-sex chart classes lines, labels and axis values by sex',
       timed.every(x=>{const d=rbDetail(x,[],2);return d.includes('class="rbt rbt-top rbmen-elite"')&&
         d.includes('class="rbclabi rbt-top rbclab-men-elite"')&&
         d.includes('class="rbcytick rbcy-men-elite"')&&
         d.includes('class="rbwomen-wr"')&&d.includes('class="rbwomen-elite"')&&
         d.includes('class="rbcytick rbcy-women-wr"')&&d.includes('class="rbcytick rbcy-women-elite"');})&&
       !BD.includes('rbmen-elite'));
     ok('all timed world records keep current primary World Athletics sources and review dates',
       timed.every(x=>x.world.source.startsWith('https://worldathletics.org/')&&
         x.women.world.source.startsWith('https://worldathletics.org/')&&
         x.world.reviewed==='2026-08-20'&&x.women.world.reviewed==='2026-08-20'));
     ok('all Paris entry standards use the primary World Athletics document',
       olympic.every(x=>x.elite.source===waParis&&x.women.elite.source===waParis&&
         x.elite.reviewed==='2026-08-20'&&x.women.elite.reviewed==='2026-08-20'));
     ok('the road-distance entry notes preserve World Athletics equivalent-road eligibility',
       ['run5k','run10k'].every(id=>{const x=BI.find(y=>y.id===id);
         return x.elite.basis.includes('allowed the standard to be achieved in the equivalent road')&&
           x.women.elite.basis.includes('allowed the standard to be achieved in the equivalent road');}));
     ok('the four-minute mile uses direct World Athletics historical evidence, not an invented classification',
       M.elite.value===240&&M.elite.source==='https://worldathletics.org/heritage/news/roger-bannister-sub-four-minute-mile-70-years'&&
       M.elite.basis.includes('historical benchmark')&&M.elite.basis.includes('not a competition entry standard')&&
       M.elite.reviewed==='2026-08-20');
     ok('women records and elite standards render as secondary context without changing the grade ladder',
       timed.every(x=>{const d=rbDetail(x,[],2),plain=JSON.parse(JSON.stringify(x));delete plain.women;
         return (d.match(/<line class="rbwomen-wr"/g)||[]).length===1&&
           (d.match(/<line class="rbwomen-elite"/g)||[]).length===1&&
           d.includes('class="rbclabi rbclab-women-wr"')&&
           d.includes('class="rbclabi rbclab-women-elite"')&&
           d.includes(`>${x.women.world.display}</span>`)&&d.includes(`>${x.women.elite.display}</span>`)&&
           d.includes('Men · World record')&&d.includes('Women · World record')&&
           !d.includes(x.world.athlete)&&!d.includes(x.women.world.athlete)&&
           !d.includes(`'${x.world.date.slice(2,4)}`)&&!d.includes(`'${x.women.world.date.slice(2,4)}`)&&
           d.includes(`Women · ${x.women.elite.label}`)&&
           JSON.stringify(rbTiers(x))===JSON.stringify(rbTiers(plain))&&
           rbGradeOf(x,x.athletic.median).k===rbGradeOf(plain,plain.athletic.median).k;
       }),timed.map(x=>x.id).join(','));
     ok('the women mile overlay is the 4:30 World class mark, not an Olympic equivalent',
       M.women.elite.label==='World class'&&M.women.elite.value===270&&M.women.elite.display==='4:30'&&
       MD.includes('>4:30</span>')&&MD.includes('Women · World class')&&
       !MD.includes('Olympic entry equivalent'));
     ok('the other four women overlays retain their Olympic entry standards',
       timed.filter(x=>x.id!=='runmile').every(x=>x.women.elite.label==='Olympic entry standard'));}
    const savedR=R.attempts.slice(),savedV=V.attempts.slice();
    R.attempts.push(
      {date:'2026-08-01',value:14.2},
      {date:'2026-08-20',value:14.0},
      {date:'2026-09-01',value:13.6});
    V.attempts.push(
      {date:'2026-08-01',value:48.0},
      {date:'2026-09-01',value:51.0});
    const months=['2026-08','2026-09'],H=runningBenchmarks(),D=rbDetail(R,months,months.length+2);
    ok('a first attempt switches the expansion to the full chart',
      D.includes('rbcplot')&&!D.includes('rbrefs'));
    const visible=BI.reduce((n,x)=>n+new Set(x.attempts.map(a=>String(a.date).slice(0,7))).size,0);
    ok('each populated benchmark-month shows one result without expanding the row',
      count(H,'rbval')===visible,`${count(H,'rbval')} of ${visible} values`);
    ok('PB values stand out in green without their own column',H.includes('rbpb')&&!H.includes('>Personal best</th>'));
    // Shared month buckets prevent two August tests from producing duplicate Aug '26 headers.
    ok('benchmark table preserves one shared column per testing month',
      (H.match(/Aug '26/g)||[]).length===1&&(H.match(/Sept '26/g)||[]).length===1&&
      !H.includes(' title=')&&H.includes('style="--rbw:669px"')&&!H.includes('>Result</th>')&&
      !H.includes('>Latest</th>')&&!H.includes('>Unit</th>')&&!H.includes('>Attempts</th>'));
    const rrow=(H.match(/<tr class="rbrow" data-rbrow="run100"[\s\S]*?<\/tr>/)||[])[0]||'';
    ok('a monthly cell shows that row\'s latest exact-date attempt',
      (rrow.match(/class="rbattempt"/g)||[]).length===2&&rrow.includes('>14s</span>')&&
      !rrow.includes('14.2s')&&rrow.includes('>13.6s</span>'));
    ok('all exact attempts stay in the chart and share their month-column centre',
      (D.match(/left:25%/g)||[]).length===2&&(D.match(/left:75%/g)||[]).length===1&&D.includes('colspan="4"'));
    const before=rbDetail(V,months,4);
    R.attempts.push({date:'2026-08-31',value:13.9});
    const after=rbDetail(V,months,4);R.attempts.pop();
    ok('an unrelated exact date inside an existing month cannot move another chart',before===after);
    ok('benchmark definitions and attempts contain only useful structured fields',
      BI.every(x=>x.quality===undefined&&x.protocol===undefined&&
        x.attempts.every(a=>Object.keys(a).sort().join(',')==='date,value')));
    ok('expanded benchmark chart draws history, the full grade ladder and the world-record line',
      D.includes('rbline')&&!D.includes('rbtg')&&!D.includes('rbbg')&&!D.includes('rbmed')&&D.includes('rbwr')&&
      (D.match(/<line class="rbt rbt-[a-z]+(?: rbmen-elite)?" data-tier=/g)||[]).length===4);
    ok('benchmark results and chart points have no tooltip hooks',
      !H.includes('dtl rbval')&&!D.includes('dtl rbpt')&&!H.includes(' title=')&&
      !D.includes(' title=')&&!html.includes('function rbPtHTML'));
    ok('laboratory datapoint bubbles remain enabled',html.includes('function ptHTML'));
    R.attempts.splice(0,R.attempts.length,...savedR);V.attempts.splice(0,V.attempts.length,...savedV);
  }catch(e){
    DATA.TRAINING.benchmarks.items.forEach(x=>x.attempts.length=0);
    ok('benchmark history rendering',false,e.message);
  }
  // every meal card embeds a derived Supps sub-section (the evening card's title IS its list)
  try{ setPage('diet');
    const timed=DATA.DIET.meals.filter(m=>m.at).length;
    ok(`diet embeds ${timed+1} Supplements sub-sections`,
      count(n.pages.innerHTML,'cgrp')===timed+1,
      count(n.pages.innerHTML,'cgrp')+' sections');
    const evn=DATA.STACK.items.filter(x=>Array.isArray(x.when)&&x.when.some(w=>w.at==='evening')&&(x.status==='taking'||x.status==='planned')&&x.cat!=='maylater').length;
    const shown=(n.pages.innerHTML.match(/<b>Evening<\/b>/g)||[]).length;
    ok('diet shows the Evening card', shown===1, shown+' rendered');
    ok(`evening card derives ${evn} item(s) from STACK.when`,
      evn===0||n.pages.innerHTML.includes('Magnesium L-threonate'), 'derived');
    const H=n.pages.innerHTML,pi=H.indexOf('class="pgsec dietprofile"'),wi=H.indexOf('>Weekly</div>');
    ok('diet shows one standalone nutritional profile',pi>=0&&(H.match(/dietprofile/g)||[]).length===1,'one section');
    ok('nutritional profile follows the Weekly rotation',wi>=0&&pi>wi,'below Weekly');
    ok('nutritional profile shows equal-choice averages including Weekly',
      H.includes('~3,250 kcal')&&H.includes('~174 g')&&!H.includes('g/kg')&&
      H.includes('~250 g')&&H.includes('~165 g')&&H.includes('~58 g')&&H.includes('~36 g')&&
      !H.includes('Weekly starter adds')&&!H.includes('Approximate daily intake')&&
      !H.includes('Ranges reflect')&&!H.includes('class="dpbasis"')&&!H.includes('class="dpnote"'),
      'current averages'); }
  catch(e){ ok('diet supps',false,e.message); }
  /* Kefir is eaten in more than one meal, so each occurrence is a real entry rather than a
     mistaken duplicate. What repeated food-and-portion entries cannot survive is DRIFT:
     the tooltip payload is stored twice, so an edit that lands on one copy leaves the other
     stale and nothing on the page says so. Same name AND same portion must therefore mean the
     same data. Olive oil is deliberately exempt: same name, 10mL vs 50mL, genuinely different. */
  {
    const seen={},drift=[];
    DATA.DIET.meals.forEach(m=>(m.items||[]).forEach(x=>{
      if(typeof x!=='object'||!x.info)return;
      const k=x.n+'@'+x.amt, j=JSON.stringify(x.info);
      if(seen[k]&&seen[k]!==j)drift.push(k); else seen[k]=j;}));
    ok('repeated foods carry identical data', drift.length===0, drift.join(', ')||'no drift');
  }
  {
    const pre=DATA.DIET.meals.find(m=>m.id==='presnack'),dinner=DATA.DIET.meals.find(m=>m.id==='dinner');
    const wa=pre&&pre.items.find(x=>x&&x.n==='Walnuts + almonds');
    const pi=dinner&&dinner.items.find(x=>x&&x.n==='Pistachios');
    const chocolate=DATA.DIET.meals.flatMap(m=>(m.items||[]).filter(x=>x&&x.n==='Dark chocolate').map(x=>({meal:m.id,item:x})));
    ok('walnuts and almonds sit with the muesli; dinner keeps pistachios',
      wa&&wa.amt==='~22g'&&pi&&pi.amt==='~8g'&&
      JSON.stringify(wa.info).includes('Walnut 12g, almond 10g')&&
      JSON.stringify(wa.info.Notes)===JSON.stringify([['','3 Walnuts'],['','8 Almonds']])&&
      JSON.stringify(pi.info).includes('Pistachio 8g'),'split correctly');
    ok('the full 20g chocolate serving sits only in the pre-workout snack',
      chocolate.length===1&&chocolate[0].meal==='presnack'&&chocolate[0].item.amt==='~20g');
  }
  try{ setPage('markers'); ok('back to markers', n.pages.hidden===true); }
  catch(e){ ok('back to markers',false,e.message); }
  const j2=JSON.parse(JSON.stringify(DATA)); j2.STACK.items[0].status='yolo';
  ok('audit rejects a bad STACK status', audit(j2).length===1);
  // The draw list is an order generator, not a wish list. Every row must declare a complete
  // decision contract, and only active rows may reach the clipboard.
  const j9=JSON.parse(JSON.stringify(DATA)); j9.NEXTDRAW.items[0].g='someday';
  ok('audit rejects an unknown draw-list group', audit(j9).length===1, audit(j9)[0]||'');
  const j10=JSON.parse(JSON.stringify(DATA)); delete j10.NEXTDRAW.items[0].decision;
  ok('audit rejects a draw-list item with no decision', audit(j10).length===1, audit(j10)[0]||'');
  const j11=JSON.parse(JSON.stringify(DATA)); j11.NEXTDRAW.items[0].draws=['ghost'];
  ok('audit rejects an unknown draw collection', audit(j11).length===1, audit(j11)[0]||'');
  const j12=JSON.parse(JSON.stringify(DATA)); j12.NEXTDRAW.deferred[0].en=j12.NEXTDRAW.items[0].en;
  ok('audit rejects an active/deferred duplicate', audit(j12).length===1, audit(j12)[0]||'');
  const j13=JSON.parse(JSON.stringify(DATA)); j13.MARK[0].opt=[30,50];
  ok('audit rejects a legacy optimal band',audit(j13).length===1,audit(j13)[0]||'');
  const jNote=JSON.parse(JSON.stringify(DATA)); delete jNote.MARK[0].note.caveat;
  ok('audit rejects an incomplete marker description',audit(jNote).length===1,audit(jNote)[0]||'');
  const jNoteExtra=JSON.parse(JSON.stringify(DATA)); jNoteExtra.MARK[0].note.advice='Take more';
  ok('audit rejects an unknown marker-description section',audit(jNoteExtra).length===1,audit(jNoteExtra)[0]||'');
  const j14=JSON.parse(JSON.stringify(DATA)); delete j14.MARK.find(m=>m.id==='apob').target.source;
  ok('audit rejects an unsourced evidence target',audit(j14).length===1,audit(j14)[0]||'');
  const j18=JSON.parse(JSON.stringify(DATA)); delete j18.MARK.find(m=>m.id==='tt').reference.method;
  ok('audit rejects an evidence reference with no assay requirement',audit(j18).length===1,audit(j18)[0]||'');
  const j19=JSON.parse(JSON.stringify(DATA)); j19.MARK.find(m=>m.id==='tt').reference.reviewed='July 2026';
  ok('audit rejects a malformed evidence-reference review date',audit(j19).length===1,audit(j19)[0]||'');
  const j20=JSON.parse(JSON.stringify(DATA)); j20.TRAINING.benchmarks.items[0].kind='sprintish';
  ok('audit rejects an unknown benchmark kind',audit(j20).some(x=>x.includes('kind must be')),audit(j20)[0]||'');
  const j21=JSON.parse(JSON.stringify(DATA)); j21.TRAINING.benchmarks.items[0].pb=9.7;
  ok('audit rejects a stored personal best',audit(j21).length===1,audit(j21)[0]||'');
  const j22=JSON.parse(JSON.stringify(DATA)); delete j22.TRAINING.benchmarks.items[0].athletic.reviewed;
  ok('audit rejects an unreviewed active-peer band',audit(j22).length===1,audit(j22)[0]||'');
  const jTargetSpan=JSON.parse(JSON.stringify(DATA)); jTargetSpan.TRAINING.benchmarks.items.find(x=>x.target).target.span='P75–P90';
  ok('audit rejects a legacy benchmark target span',audit(jTargetSpan).length===1,audit(jTargetSpan)[0]||'');
  const jWomenField=JSON.parse(JSON.stringify(DATA)); jWomenField.TRAINING.benchmarks.items[0].women.world.note='legacy';
  ok('audit rejects an unknown women-overlay field',audit(jWomenField).some(x=>x.includes('women.world has unknown field')),audit(jWomenField)[0]||'');
  const jWomenDisplay=JSON.parse(JSON.stringify(DATA)); delete jWomenDisplay.TRAINING.benchmarks.items[0].women.elite.display;
  ok('audit requires an exact women-elite display string',audit(jWomenDisplay).some(x=>x.includes('women.elite.display is required')),audit(jWomenDisplay)[0]||'');
  const jWomenOrder=JSON.parse(JSON.stringify(DATA)); jWomenOrder.TRAINING.benchmarks.items[0].women.elite.value=9;
  ok('audit keeps the women world record beyond the elite reference',audit(jWomenOrder).some(x=>x.includes('women world record must be beyond')),audit(jWomenOrder)[0]||'');
  const jWomenLegacy=JSON.parse(JSON.stringify(DATA)); jWomenLegacy.TRAINING.benchmarks.items[0].women.entry=
    JSON.parse(JSON.stringify(jWomenLegacy.TRAINING.benchmarks.items[0].women.elite));
  ok('audit rejects the legacy women.entry key',audit(jWomenLegacy).some(x=>x.includes('women has unknown field "entry"')),audit(jWomenLegacy)[0]||'');
  const jWomenKind=JSON.parse(JSON.stringify(DATA)); jWomenKind.TRAINING.benchmarks.items.find(x=>x.kind==='vo2').women=
    JSON.parse(JSON.stringify(jWomenKind.TRAINING.benchmarks.items[0].women));
  ok('audit limits women overlays to timed running events',audit(jWomenKind).some(x=>x.includes('women overlays are only valid')),audit(jWomenKind)[0]||'');
  const j23=JSON.parse(JSON.stringify(DATA)); j23.TRAINING.benchmarks.items[0].attempts.push({date:'2026-09-01',value:13.5});
  ok('audit accepts a date-and-result-only attempt',audit(j23).length===0,audit(j23)[0]||'');
  const legacyAttemptFields=['method','conditions','course','note'];
  ok('audit rejects every legacy attempt-metadata field',legacyAttemptFields.every(field=>{
    const sample=JSON.parse(JSON.stringify(DATA));
    sample.TRAINING.benchmarks.items[0].attempts.push({date:'2026-09-02',value:13.5,[field]:'legacy'});
    return audit(sample).length===1;
  }),legacyAttemptFields.join(', '));
  const legacyBenchmarkFields=['quality','protocol'];
  ok('audit rejects hidden benchmark description fields',legacyBenchmarkFields.every(field=>{
    const sample=JSON.parse(JSON.stringify(DATA));sample.TRAINING.benchmarks.items[0][field]='legacy';
    return audit(sample).length===1;
  }),legacyBenchmarkFields.join(', '));
  const jTrainingTip=JSON.parse(JSON.stringify(DATA));
  jTrainingTip.TRAINING.cards[0].groups[0].items[0].info='legacy tooltip';
  ok('audit rejects a Training exercise tooltip',audit(jTrainingTip).length===1,audit(jTrainingTip)[0]||'');
  const jTrainingPark=JSON.parse(JSON.stringify(DATA));
  jTrainingPark.TRAINING.maylater={t:'May add later',items:[]};
  ok('audit rejects a Training parked section',audit(jTrainingPark).length===1,audit(jTrainingPark)[0]||'');
  const j15=JSON.parse(JSON.stringify(DATA)); j15.MARK.find(m=>m.id==='o3').target.evidence='certain';
  ok('audit rejects an unknown target evidence level',audit(j15).length===1,audit(j15)[0]||'');
  const j16=JSON.parse(JSON.stringify(DATA)); j16.MARK.find(m=>m.id==='vitd').cut.zones[1].min=10;
  ok('audit rejects overlapping decision zones',audit(j16).length===1,audit(j16)[0]||'');
  const j24=JSON.parse(JSON.stringify(DATA)); j24.DIET.profile.basis='';
  ok('audit rejects a malformed nutritional profile',audit(j24).length===1,audit(j24)[0]||'');
  const j25=JSON.parse(JSON.stringify(DATA)); j25.DIET.meals.find(m=>m.id==='brunch').items.find(x=>x.rotation).rotation='ghost';
  ok('audit rejects an unknown food rotation',audit(j25).length===1,audit(j25)[0]||'');
  try{ setPage('nextdraw');
    const H=n.pages.innerHTML,G=[...new Set(DATA.NEXTDRAW.items.map(x=>x.g))].length;
    ok(`draw list renders ${G} active groups`, count(H,'pgst ndgtitle')===G, count(H,'pgst ndgtitle')+' groups');
    ok('optional section starts collapsed',count(H,'pgsec ndlist ndgroup')===1,
      count(H,'pgsec ndlist ndgroup')+' collapsed groups');
    ok(`${DATA.NEXTDRAW.items.length} active decisions shown`, count(H,'nddecision')===DATA.NEXTDRAW.items.length,
      count(H,'nddecision')+' decisions');
    ok(`${DATA.NEXTDRAW.items.length} inline detail panels`, count(H,'ndmeta')===DATA.NEXTDRAW.items.length,
      count(H,'ndmeta')+' panels');
    ok('deferred exclusions stay source-only',count(H,'srow ndxrow')===0&&
      !H.includes('Deferred / not this draw')&&!H.includes(`${DATA.NEXTDRAW.deferred.length} deferred`)&&
      !H.includes('Why not now')&&!H.includes('Reconsider when'));
    const main=ndOrder('main',false),all=ndOrder('main',true);
    ok('recommended copy excludes optional rows',main.every(x=>x.g!=='optional')&&all.length>main.length);
    ok('optional copy adds every optional main row',all.length-main.length===DATA.NEXTDRAW.items.filter(x=>x.g==='optional'&&x.draws.includes('main')).length);
    ok('deferred rows never enter copies',DATA.NEXTDRAW.deferred.every(x=>!all.some(y=>y.en===x.en)));
    ok('recommended main copy has no duplicate orders',new Set(main.map(x=>x.en)).size===main.length);
  }catch(e){ ok('draw list groups',false,e.message); }
  const j5=JSON.parse(JSON.stringify(DATA)); j5.STACK.items[0].ev='pretty good';
  ok('audit rejects an unknown evidence tag', audit(j5).length===1, audit(j5)[0]||'');
  const j6=JSON.parse(JSON.stringify(DATA)); delete j6.STACK.items[0].ev;
  ok('audit rejects a MISSING evidence tag', audit(j6).length===1, audit(j6)[0]||'');
  // the order regressed once in DIET by rename-and-reinsert, which appends; guard it here
  const j7=JSON.parse(JSON.stringify(DATA)); const i7=j7.STACK.items[0].info;
  j7.STACK.items[0].info={Dose:i7.Dose,'What it does':i7['What it does'],Evidence:i7.Evidence};
  ok('audit rejects out-of-order tooltip sections', audit(j7).length===1, audit(j7)[0]||'');
  const j8=JSON.parse(JSON.stringify(DATA)); j8.STACK.items[0].info='back to a prose string';
  ok('audit rejects a prose-string info', audit(j8).length>=1, audit(j8)[0]||'');
  // a per-value collection time is a claim about provenance: malformed, or unexplained, it lies
  const clone=()=>JSON.parse(JSON.stringify(DATA));
  const zn=j=>j.DATA.draws.find(d=>d.date==='2020-12-10').v.zn;
  const j3=clone(); zn(j3).t='9:58';
  ok('audit rejects a malformed value time', audit(j3).length===1, audit(j3)[0]||'');
  const j4=clone(); zn(j4).t='11:00'; delete zn(j4).cx;
  ok('audit rejects a value time with no cx', audit(j4).length===1, audit(j4)[0]||'');
  console.log(fail?`\n  ${fail} FAILED`:'\n  all passed');
  process.exit(fail?1:0);
},40);
