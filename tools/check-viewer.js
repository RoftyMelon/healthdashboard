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
  const availablePages = ['record','stack','routine','diet','training','nextdraw','grooming'];
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
