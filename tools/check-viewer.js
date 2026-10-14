#!/usr/bin/env node
// Generic smoke test: boot this folder's shared viewer against this folder's data.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'bloodwork.js'), 'utf8'), context);
const DATA = JSON.parse(JSON.stringify(context.window.BLOODWORK));

const el = id => ({ id, innerHTML: '', value: '', dataset: {}, classList: {
  add() {}, remove() {}, toggle() {}, contains: () => false
}, addEventListener() {}, focus() {}, blur() {}, style: { setProperty() {} },
offsetLeft: 70, offsetWidth: 34, offsetTop: 0, setAttribute() {}, title: '',
closest: () => null, tHead: null, querySelector: () => null, files: [],
insertAdjacentHTML() {}, getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0, height: 70, width: 0 }) });
const elements = {};
['chips','toc','tbl','srch','q','qx','sbtn','tbtn','top','topbar','odisc','omoon','osun','pick','pages']
  .forEach(id => { elements[id] = el(id); });
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.document = {
  getElementById: id => elements[id] || (elements[id] = el(id)),
  querySelector: query => ['.wrap','thead tr','thead th','meta[name=theme-color]'].includes(query) ? el(query) : null,
  querySelectorAll: () => [], addEventListener() {},
  documentElement: { dataset: {}, style: { setProperty() {} }, classList: { add() {}, remove() {}, contains: () => false } },
  activeElement: { id: '' }, createElement: () => el('x'), fonts: { ready: Promise.resolve() }
};
global.window = { addEventListener() {}, scrollTo() {}, scrollBy() {}, scrollY: 0, scrollX: 0,
  innerHeight: 900, matchMedia: () => ({ matches: false, addEventListener() {} }), storage: null, BLOODWORK: DATA };
global.requestAnimationFrame = fn => fn();
global.clearTimeout = () => {};
global.getComputedStyle = () => ({ paddingLeft: '20px', getPropertyValue: () => '#FFFFFF' });

let failures = 0;
const check = (label, condition, detail = '') => {
  console.log(`  ${condition ? '✅' : '❌'} ${label}${detail ? `  ${detail}` : ''}`);
  if (!condition) failures++;
};
process.on('unhandledRejection', error => { console.error(`  ❌ async failure: ${error.message}`); process.exit(1); });
(0, eval)(script);

setTimeout(() => {
  const rowCount = (elements.tbl.innerHTML.match(/<tr class="m"/g) || []).length;
  check('viewer runtime audit accepts the data', (0, eval)('audit(window.BLOODWORK)').length === 0);
  check('viewer renders every marker', rowCount === DATA.MARK.length, `${rowCount}/${DATA.MARK.length}`);
  check('viewer replaced the loading state', !elements.tbl.innerHTML.includes('Loading…'));
  {const sample=JSON.parse(JSON.stringify(DATA));
   sample.DATA={draws:[{id:'formula-smoke-test',date:'2026-01-01',v:{
     ca:{r:9.4,u:'mg/dL'},alb:{r:3.5,u:'g/dL'}
   }}]};
   (0,eval)('derive')(sample);
   const derived=sample.DATA.draws[0].v.cacorr;
   check(DATA.CALCULATIONS&&DATA.CALCULATIONS.correctedCalcium
       ?'configured corrected calcium is derived'
       :'unconfigured corrected calcium stays absent',
     DATA.CALCULATIONS&&DATA.CALCULATIONS.correctedCalcium
       ?derived&&derived.r===9.9&&derived.u==='mg/dL'
       :derived===undefined);
   sample.DATA.draws[0].v.cacorr={r:9.1,u:'mg/dL'};
   (0,eval)('derive')(sample);
   check('a reported corrected-calcium result always wins',sample.DATA.draws[0].v.cacorr.r===9.1);}
  {const sample=JSON.parse(JSON.stringify(DATA)),audit=(0,eval)('audit'),render=(0,eval)('rbHRHTML'),
     benchmark=sample.TRAINING.benchmarks.items.find(x=>x.kind==='heart-rate'),
     attempt={date:'2026-01-01',value:140};
   benchmark.attempts=[attempt];
   const record={benchmark:benchmark.id,date:attempt.date,distance:null,elapsed:91,timer:90,
     averageHR:140,maxHR:160,pauses:[],samples:[[0,110],[60,160],[91,125]],
     summary:{distance:200,timer:60}};
   sample.TRAINING.activityRecords=[record];
   check('heart-rate activities accept a test summary and unknown full distance',audit(sample).length===0);
   const preview=render(benchmark,attempt,record),svg=preview.match(/<svg class="rbhrsvg"[^>]*>/)[0];
   check('test summary supplies pace and speed without shortening the full trace',
     preview.includes('Test average <b>140 bpm')&&preview.includes('5:00/km')&&preview.includes('12.0 km/h')&&
     svg.includes('aria-valuemax="91"')&&preview.includes('356.00,123.75'));
   check('HR-only timelines have no speed trace, axis or speed aria label',
     !preview.includes('class="rbpacetrace"')&&!preview.includes('class="rbpacelabel"')&&
     svg.includes('aria-label="Heart rate timeline.')&&!svg.includes('speed'));
   for(const [label,change] of [
     ['null summary',r=>r.summary=null],
     ['array summary',r=>r.summary=[]],
     ['incomplete summary',r=>delete r.summary.timer],
     ['extra summary field',r=>r.summary.note='not allowed'],
     ['zero test distance',r=>r.summary.distance=0],
     ['non-finite test distance',r=>r.summary.distance=Infinity],
     ['negative test duration',r=>r.summary.timer=-1],
     ['test duration beyond full timer',r=>r.summary.timer=91],
     ['unknown full distance without a summary',r=>delete r.summary],
     ['missing full distance',r=>delete r.distance],
     ['zero full distance',r=>r.distance=0]
   ]){const invalid=JSON.parse(JSON.stringify(sample));change(invalid.TRAINING.activityRecords[0]);
     check('audit rejects '+label,audit(invalid).length>0);}
   const timed=sample.TRAINING.benchmarks.items.find(x=>x.kind==='time');
   timed.attempts=[{date:attempt.date,value:90}];
   const outdoor={...record,benchmark:timed.id,distance:200,speeds:[[0,2],[91,3]]};
   delete outdoor.summary;sample.TRAINING.activityRecords=[outdoor];
   const ordinary=render(timed,timed.attempts[0],outdoor);
   check('ordinary timed activities retain full-timer summaries and speed rendering',
     audit(sample).length===0&&ordinary.includes('Average <b>140 bpm')&&
     ordinary.includes('7:30/km')&&ordinary.includes('8.0 km/h')&&
     ordinary.includes('class="rbpacetrace"')&&ordinary.includes('Heart rate and speed timeline.'));}
  {const sample=JSON.parse(JSON.stringify(DATA)),boot=(0,eval)('boot');
   sample.ROUTINE=[{t:'07:00',do:'Test start'},{t:'23:00',do:'Test end'}];
   sample.SCREEN={note:'First <em>line</em> & "quoted"\nSecond line'};
   try{
     boot(sample,false);(0,eval)("renderPage('routine')");
     check('routine notes preserve line breaks while escaping HTML',
       elements.pages.innerHTML.includes('<div class="pgscr" style="font-style:normal">First &lt;em&gt;line&lt;/em&gt; &amp; &quot;quoted&quot;<br>Second line</div>'));
   }finally{boot(DATA,false);}}
  {const sample=JSON.parse(JSON.stringify(DATA)),boot=(0,eval)('boot'),
     icons=['🍽️','🏃 🥣','🏃🏽','🏃‍♂️','👩‍💻'];
   sample.ROUTINE=icons.map((icon,i)=>({t:String(7+i).padStart(2,'0')+':00',do:icon}));
   sample.ROUTINE.push({t:'23:00',do:'Walk & rest'});
   try{
     boot(sample,false);(0,eval)("renderPage('routine')");
     const routine=elements.pages.innerHTML;
     check('single, paired, modified and joined emojis use the same routine icon slot',
       icons.every(icon=>routine.includes(`<div class="rdo ricon">${icon}</div>`))&&
       !routine.includes('rpair'));
     check('ordinary routine text stays outside the emoji icon slot',
       routine.includes('<div class="rdo">Walk &amp; rest</div>'));
   }finally{boot(DATA,false);}}
  // Record grouping is opt-in, lossless and exact; native disclosures keep details off the row.
  {const heading=Number((html.match(/\.rechead h2\{font-size:(\d+)px/)||[])[1]),
     label=Number((html.match(/\.reclabel\{font-size:(\d+)px/)||[])[1]),
     value=Number((html.match(/\.recvalue\{font-size:(\d+)px/)||[])[1]),
     title='A long record label that needs room for its full medical description',
     row=(0,eval)('recordRowsHTML')({rows:[[title,'Result stays readable']]});
   check('Record section titles are larger than both row labels and results',heading>label&&heading>value);
   check('Long record labels use full-width stacked results without losing content',
     row.includes('class="recrow reclong"')&&row.includes(title)&&row.includes('Result stays readable'));
  }
  {const sample=JSON.parse(JSON.stringify(DATA)),audit=(0,eval)('audit'),
     render=(0,eval)('recordRowsHTML'),boot=(0,eval)('boot'),
     section={t:'Record <section>',groupRows:true,rows:[
       ['Alpha <b>& "label"</b>','1 Jan 2026','Lot <em>& "first"</em>'],
       ['Beta','2 Jan 2026'],
       ['Alpha <b>& "label"</b>','1 Jan 2026'],
       ['alpha <b>& "label"</b>','3 Jan 2026'],
       ['Alpha <b>& "label"</b>','4 Jan 2026','Lot second']
     ]},
     snapshot=JSON.stringify(section),
     countClass=(markup,cls)=>Array.from(markup.matchAll(/\bclass="([^"]*)"/g)).filter(m=>m[1].split(/\s+/).includes(cls)).length,
     labels=markup=>Array.from(markup.matchAll(/<[^>]+class="reclabel"[^>]*>([^<]*)</g),m=>m[1]),
     dates=markup=>Array.from(markup.matchAll(/<[^>]+class="recdate"[^>]*>([^<]*)</g),m=>m[1]);
   sample.RECORD={sections:[section]};
   check('Record audit accepts optional grouping and a third detail string',audit(sample).length===0);
   const grouped=render(section),
     groups=grouped.split(/<[^>]+class="recrow"[^>]*>/).slice(1),
     expectedLabels=['Alpha &lt;b&gt;&amp; &quot;label&quot;&lt;/b&gt;','Beta','alpha &lt;b&gt;&amp; &quot;label&quot;&lt;/b&gt;'];
   check('Record groups nonconsecutive exact labels in first-seen order',
     countClass(grouped,'recrow')===3&&JSON.stringify(labels(grouped))===JSON.stringify(expectedLabels));
   check('Record grouping preserves repeated dates and per-label value order',
     countClass(grouped,'recdate')===5&&
     JSON.stringify(groups.map(dates))===JSON.stringify([['1 Jan 2026','1 Jan 2026','4 Jan 2026'],['2 Jan 2026'],['3 Jan 2026']]));
   check('Record grouping does not mutate source rows',JSON.stringify(section)===snapshot);
   const disclosures=Array.from(grouped.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g));
   check('Record details use closed native date-labelled disclosures',
     disclosures.length===2&&countClass(grouped,'recdetail')===2&&
     disclosures.every(([,attrs,body],i)=>!/(?:^|\s)open(?:\s|=|$)/.test(attrs)&&
       /^\s*<summary\b[^>]*><span class="recdate">[^<]+<\/span><\/summary>/.test(body)&&
       body.includes('aria-label="Details for '+expectedLabels[0]+' — '+section.rows[i?4:0][1]+'"')&&
       body.includes('class="recmetatext"'))&&
     !/on(?:click|mouseover)=|\stitle=/.test(grouped));
   check('Record labels and hidden details are HTML-escaped',
     grouped.includes(expectedLabels[0])&&
     grouped.includes('Lot &lt;em&gt;&amp; &quot;first&quot;&lt;/em&gt;')&&
     !grouped.includes('<b>')&&!grouped.includes('<em>'));
   const escaped=render({rows:[['A','Date <b>& "value"</b>','Detail <i>& "text"</i>']]});
   check('Record date summaries also escape supplied HTML',
     escaped.includes('Date &lt;b&gt;&amp; &quot;value&quot;&lt;/b&gt;')&&
     escaped.includes('Detail &lt;i&gt;&amp; &quot;text&quot;&lt;/i&gt;')&&
     !escaped.includes('<b>')&&!escaped.includes('<i>'));
   for(const mode of ['omitted','false']){
     const ungrouped={...section};if(mode==='omitted')delete ungrouped.groupRows;else ungrouped.groupRows=false;
     sample.RECORD.sections=[ungrouped];const markup=render(ungrouped),
       values=Array.from(markup.matchAll(/<dd class="recvalue">(?:<details\b[^>]*><summary\b[^>]*>)?([^<]+)/g),m=>m[1]);
     check('Record grouping '+mode+' retains every row in source order',
       audit(sample).length===0&&countClass(markup,'recrow')===section.rows.length&&
       JSON.stringify(labels(markup))===JSON.stringify([expectedLabels[0],'Beta',expectedLabels[0],expectedLabels[2],expectedLabels[0]])&&
       JSON.stringify(values)===JSON.stringify(section.rows.map(row=>row[1])));
   }
   sample.RECORD.sections=[section];
   for(const [label,change] of [
     ['string grouping flag',s=>s.groupRows='true'],
     ['numeric grouping flag',s=>s.groupRows=1],
     ['null grouping flag',s=>s.groupRows=null],
     ['object grouping flag',s=>s.groupRows={}],
     ['non-array row',s=>s.rows[0]='not a row'],
     ['missing row value',s=>s.rows[0]=['Label']],
     ['extra row field',s=>s.rows[0]=['Label','Value','Detail','Extra']],
     ['non-string label',s=>s.rows[0][0]=42],
     ['blank label',s=>s.rows[0][0]='  '],
     ['non-string value',s=>s.rows[0][1]=42],
     ['blank value',s=>s.rows[0][1]='  '],
     ['empty detail',s=>s.rows[0][2]=''],
     ['blank detail',s=>s.rows[0][2]='  '],
     ['null detail',s=>s.rows[0][2]=null],
     ['numeric detail',s=>s.rows[0][2]=42],
     ['object detail',s=>s.rows[0][2]={text:'Detail'}],
     ['undefined third field',s=>s.rows[0][2]=undefined]
   ]){const invalid=JSON.parse(JSON.stringify(sample));change(invalid.RECORD.sections[0]);
     check('Record audit rejects '+label,audit(invalid).length>0);}
   try{
     boot(sample,false);(0,eval)("renderPage('record')");
     check('Records use their dedicated layout without the standing-fact count',
       countClass(elements.pages.innerHTML,'recordview')===1&&
       countClass(elements.pages.innerHTML,'recsection')===1&&
       elements.pages.innerHTML.includes('Record &lt;section&gt;')&&
       elements.pages.innerHTML.includes(grouped)&&
       !/\d+ standing facts?/.test(elements.pages.innerHTML));
   }finally{boot(DATA,false);}}
  const availablePages = ['record','stack','routine','diet','training','nextdraw','grooming'];
  {const sample=JSON.parse(JSON.stringify(DATA)),boot=(0,eval)('boot');
   sample.RECORD={sections:[
     {t:'Results',date:'2026-01-01',rows:[['Recorded test','12 IU/L']],foot:'Source-only method and interpretation'},
     {t:'Profile',line:'Recorded profile',rows:[],foot:'Source-only profile context'},
     {t:'Unrecorded',rows:[],empty:'Advice that is not recorded data'}
   ]};
   const source=JSON.stringify(sample.RECORD);
   try{
     boot(sample,false);(0,eval)("renderPage('record')");
     const result=elements.pages.innerHTML;
     check('Records hide contextual notes but retain recorded fields and source provenance',
       result.includes('Recorded test')&&result.includes('12 IU/L')&&result.includes('2026-01-01')&&
       result.includes('Recorded profile')&&!result.includes('Source-only')&&!result.includes('Advice that')&&
       !result.includes('recfoot')&&JSON.stringify(sample.RECORD)===source);
     check('Records use neutral empty states in both personal and Starter views',
       result.includes('<div class="recempty">'+(sample._template?.cardShells?'—':'Not recorded')+'</div>'));
   }finally{boot(DATA,false);}
  }
  availablePages.forEach(page => {
    try {
      (0, eval)(`setPage('${page}')`);
      check(`${page} page renders`, !elements.pages.innerHTML.includes('problem') && !elements.pages.innerHTML.includes('[object Object]'));
    } catch (error) { check(`${page} page renders`, false, error.message); }
  });
  (0, eval)("setPage('nextdraw')");
  check('deferred Next Draw exclusions stay source-only',
    !elements.pages.innerHTML.includes('Deferred / not this draw') &&
    !elements.pages.innerHTML.includes('ndxrow'));
  if (DATA._template && DATA._template.blank) {
    (0, eval)("setPage('markers')");
    check("blank marker table shows the UI-only date placeholder", elements.tbl.innerHTML.includes("MMM 'YY"));
    (0, eval)("setPage('routine')");
    check('blank routine shows the 07:00–23:00 ruler',
      elements.pages.innerHTML.includes('07:00') && elements.pages.innerHTML.includes('23:00'));
    (0, eval)("setPage('training')");
    check('blank training keeps all seven running benchmarks',
      (elements.pages.innerHTML.match(/class="rbrow/g) || []).length === 7);
  }
  if (failures) process.exit(1);
  console.log(`\n  all passed (${DATA._template && DATA._template.blank ? 'blank Starter' : 'populated dashboard'})`);
}, 0);
