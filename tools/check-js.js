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
  ok('88 markers', DATA.MARK.length===88, DATA.MARK.length+' markers');
  ok('legacy clin/opt fields are gone',
    DATA.MARK.every(m=>m.clin===undefined&&m.opt===undefined&&m.oc===undefined));
  // ALL 88 carry one as of 2026-08-02, by the owner's explicit decision: he wants to see where he
  // sits on every marker and accepts that position does not always matter and that assay changes
  // between draws explain some movement — the bold orange note already warns about the latter.
  // The bar moved with it: 'is there a published citable interval', not 'does it transfer
  // universally'. So the evidence GRADE now carries the doubt that rejection used to — 20 of the
  // last batch are 'weak' on purpose. What this assertion still guards is that none goes MISSING.
  ok('every marker carries an evidence reference',
    DATA.MARK.filter(m=>m.reference).length===88&&DATA.MARK.find(m=>m.id==='tt').reference,
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
    diet:['ccard',DATA.DIET.meals.filter(m=>m.at).length+1]};   // timed meal cards + Evening; untimed sections are plain rows
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
    ok('training shows the seven agreed benchmarks',count(H,'rbrow')===7&&
      BI.map(x=>x.id).join(',')==='run100,run400,runmile,run5k,run10k,run20hr,vo2max',
      BI.map(x=>x.id).join(','));
    ok('benchmark table has no separate personal-best column',!/<th[^>]*>\s*(PB|Personal best)\s*<\/th>/i.test(H));
    ok('personal bests and tiers are derived, never stored',BI.every(x=>
      ['pb','personalBest','tier','optional','core'].every(k=>x[k]===undefined)));
    ok('five timed events carry event-matched world and athletic comparisons',
      BI.filter(x=>x.kind==='time'&&x.world&&x.athletic).length===5);
    const M=BI.find(x=>x.id==='runmile');
    ok('mile uses the pooled official multi-year road-race band',
      M.athletic.min===336&&M.athletic.max===416&&M.athletic.evidence==='moderate'&&
      M.athletic.label==='Male road-mile finishers, 19–39'&&M.athletic.basis.includes('21,799'));
    const K5=BI.find(x=>x.id==='run5k'),K10=BI.find(x=>x.id==='run10k');
    ok('5K and 10K use the age-filtered recreational-runner bands',
      K5.athletic.min===1070&&K5.athletic.max===1372&&
      K5.athletic.label==='Male recreational runners, 19–39'&&K5.athletic.basis.includes('535 men aged 19–39')&&
      K10.athletic.min===2290&&K10.athletic.max===3000&&
      K10.athletic.label==='Male recreational runners, 19–39'&&K10.athletic.basis.includes('352 men aged 19–39'));
    ok('fixed-pace heart rate has no invented universal comparison',
      !BI.find(x=>x.kind==='heart-rate').world&&!BI.find(x=>x.kind==='heart-rate').athletic);
    const V=BI.find(x=>x.kind==='vo2');
    ok('VO2max uses the measured recreational-runner band and no world-record line',
      V.athletic.min===49.7&&V.athletic.max===61.1&&V.athletic.evidence==='moderate'&&
      V.athletic.label==='Male recreational runners, 30–39'&&V.athletic.basis.includes('94 male recreational runners')&&
      !V.world);
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
  // Populate the in-memory copy briefly to exercise history, PB, delta, chart and bubble
  // rendering. Nothing is written back to bloodwork.js; the shipped table correctly starts empty.
  try{
    const BI=DATA.TRAINING.benchmarks.items,R=BI.find(x=>x.id==='run100'),V=BI.find(x=>x.id==='vo2max');
    const E=runningBenchmarks(),ED=rbDetail(R,[],2);
    ok('empty benchmark rows expand to a compact range summary',
      (E.match(/onclick="rbToggle/g)||[]).length===7&&ED.includes('rbrefs')&&!ED.includes('rbcplot')&&
      ED.includes('Male PE Students')&&!ED.includes('Active men range')&&ED.includes('World record'));
    ok('active-peer cohort is explicit at a glance',
      ED.includes('Male PE Students<span class="rbage">· 21–25</span>'));
    ok('VO2max shows the recreational-runner comparison at a glance',
      !rbDetail(V,[],2).includes('Recreational runners range')&&rbDetail(V,[],2).includes('Male recreational runners<span class="rbage">· 30–39</span>'));
    ok('world-record cards show only the compact two-digit year',
      ED.includes('<span class="rbyear">· \'09</span>')&&!ED.includes('Outdoor track')&&!ED.includes('Berlin')&&!ED.includes('2009-08-16'));
    R.attempts.push(
      {date:'2026-08-01',value:14.2,method:'Hand timed',conditions:'Outdoor track · dry'},
      {date:'2026-09-01',value:13.6,method:'Hand timed',conditions:'Outdoor track · dry'});
    V.attempts.push(
      {date:'2026-08-01',value:48.0,method:'Treadmill CPET with gas analysis',conditions:'Laboratory ramp protocol'},
      {date:'2026-09-01',value:51.0,method:'Treadmill CPET with gas analysis',conditions:'Same laboratory ramp protocol'});
    const dates=['2026-08-01','2026-09-01'],H=runningBenchmarks(),D=rbDetail(R,dates,dates.length+2);
    ok('a first attempt switches the expansion to the full chart',
      D.includes('rbcplot')&&!D.includes('rbrefs'));
    ok('attempt history is visible without expanding a row',count(H,'dtl rbval')===4,count(H,'dtl rbval')+' values');
    ok('PB values stand out in green without their own column',H.includes('rbpb')&&!H.includes('>Personal best</th>'));
    ok('benchmark table has date-only headers and no summary columns',
      H.includes("Aug '26")&&H.includes("Sept '26")&&!H.includes('>Latest</th>')&&!H.includes('>Unit</th>')&&!H.includes('>Attempts</th>'));
    ok('benchmark table and chart show no descriptive copy',
      !H.includes('Speed endurance')&&!D.includes(R.quality)&&!D.includes(R.protocol));
    ok('expanded benchmark chart draws history, athletic band and world-record line',
      D.includes('rbline')&&D.includes('rbbg')&&D.includes('rbwr')&&D.includes('12.51s&ndash;14s'));
    ok('benchmark datapoint bubble records exact date, method and conditions',
      rbPtHTML(R,R.attempts[1]).includes('1 Sept 2026')&&rbPtHTML(R,R.attempts[1]).includes('Hand timed')&&
      rbPtHTML(R,R.attempts[1]).includes('Outdoor track'));
    R.attempts.length=0;V.attempts.length=0;
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
      evn===0||n.pages.innerHTML.includes('Magnesium L-threonate'), 'derived'); }
  catch(e){ ok('diet supps',false,e.message); }
  /* Kefir, nuts and dark chocolate are eaten at BOTH brunch and dinner, so each is a real entry
     in each meal — that duplication is the diet, not a mistake. What it cannot survive is DRIFT:
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
  const j14=JSON.parse(JSON.stringify(DATA)); delete j14.MARK.find(m=>m.id==='apob').target.source;
  ok('audit rejects an unsourced evidence target',audit(j14).length===1,audit(j14)[0]||'');
  const j18=JSON.parse(JSON.stringify(DATA)); delete j18.MARK.find(m=>m.id==='tt').reference.method;
  ok('audit rejects an evidence reference with no assay requirement',audit(j18).length===1,audit(j18)[0]||'');
  const j19=JSON.parse(JSON.stringify(DATA)); j19.MARK.find(m=>m.id==='tt').reference.reviewed='July 2026';
  ok('audit rejects a malformed evidence-reference review date',audit(j19).length===1,audit(j19)[0]||'');
  const j20=JSON.parse(JSON.stringify(DATA)); j20.TRAINING.benchmarks.items[0].kind='sprintish';
  ok('audit rejects an unknown benchmark kind',audit(j20).length===1,audit(j20)[0]||'');
  const j21=JSON.parse(JSON.stringify(DATA)); j21.TRAINING.benchmarks.items[0].pb=9.7;
  ok('audit rejects a stored personal best',audit(j21).length===1,audit(j21)[0]||'');
  const j22=JSON.parse(JSON.stringify(DATA)); delete j22.TRAINING.benchmarks.items[0].athletic.reviewed;
  ok('audit rejects an unreviewed active-peer band',audit(j22).length===1,audit(j22)[0]||'');
  const j23=JSON.parse(JSON.stringify(DATA)); j23.TRAINING.benchmarks.items[0].attempts.push({date:'2026-09-01',value:13.5,conditions:'Outdoor track'});
  ok('audit rejects an attempt with no timing method',audit(j23).length===1,audit(j23)[0]||'');
  const j15=JSON.parse(JSON.stringify(DATA)); j15.MARK.find(m=>m.id==='o3').target.evidence='certain';
  ok('audit rejects an unknown target evidence level',audit(j15).length===1,audit(j15)[0]||'');
  const j16=JSON.parse(JSON.stringify(DATA)); j16.MARK.find(m=>m.id==='vitd').cut.zones[1].min=10;
  ok('audit rejects overlapping decision zones',audit(j16).length===1,audit(j16)[0]||'');
  try{ setPage('nextdraw');
    const H=n.pages.innerHTML,G=[...new Set(DATA.NEXTDRAW.items.map(x=>x.g))].length;
    ok(`draw list renders ${G} active groups`, count(H,'pgst ndgtitle')===G, count(H,'pgst ndgtitle')+' groups');
    ok(`${DATA.NEXTDRAW.items.length} active decisions shown`, count(H,'nddecision')===DATA.NEXTDRAW.items.length,
      count(H,'nddecision')+' decisions');
    ok(`${DATA.NEXTDRAW.items.length} inline detail panels`, count(H,'ndmeta')===DATA.NEXTDRAW.items.length,
      count(H,'ndmeta')+' panels');
    ok(`${DATA.NEXTDRAW.deferred.length} exclusions shown`, count(H,'srow ndxrow')===DATA.NEXTDRAW.deferred.length,
      count(H,'srow ndxrow')+' exclusions');
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
