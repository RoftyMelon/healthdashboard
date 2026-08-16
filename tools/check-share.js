#!/usr/bin/env node
// Validate the personal dashboard and the distributable Starter as one shared viewer release.
// This script only reads and validates. It never copies files or creates an archive.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const personalRoot = path.resolve(__dirname, '..');
const starterRoot = path.resolve(process.argv[2] || path.join(personalRoot, '..', 'Health Dashboard Starter'));
const fail = message => { console.error(`\n❌ ${message}`); process.exit(1); };
const requireFile = file => {
  if (!fs.existsSync(file)) fail(`Missing ${file}`);
  return fs.readFileSync(file);
};
const run = (label, command, args, cwd) => {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) fail(`${label}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status || 1);
};
const loadData = root => {
  const file = path.join(root, 'bloodwork.js');
  const context = { window: {} };
  vm.createContext(context);
  try { vm.runInContext(requireFile(file).toString('utf8'), context, { filename: file }); }
  catch (error) { fail(`${file} could not be loaded: ${error.message}`); }
  if (!context.window.BLOODWORK || typeof context.window.BLOODWORK !== 'object') {
    fail(`${file} does not define window.BLOODWORK`);
  }
  return JSON.parse(JSON.stringify(context.window.BLOODWORK));
};
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value;
const same = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
const markerMap = data => new Map((data.MARK || []).map(marker => [marker.id, marker]));
const referenceCore = marker => {
  const reference = marker.reference;
  return reference && {
    min: reference.min, max: reference.max, evidence: reference.evidence,
    label: reference.label, source: reference.source, reviewed: reference.reviewed
  };
};
const benchmarkCore = item => {
  const { attempts, ...comparison } = item;
  return comparison;
};

if (!fs.existsSync(starterRoot)) fail(`Starter folder not found: ${starterRoot}`);

run('Personal CSS', 'python3', ['tools/check-css.py'], personalRoot);
run('Personal rendering/data', 'node', ['tools/check-js.js'], personalRoot);
run('Personal generic viewer boot', 'node', ['tools/check-viewer.js'], personalRoot);
run('Starter CSS', 'python3', ['tools/check-css.py'], starterRoot);
run('Starter template', 'node', ['tools/check-template.js'], starterRoot);
run('Starter blank-package protection', 'node', ['tools/check-template.js', '--blank'], starterRoot);
run('Starter generic viewer boot', 'node', ['tools/check-viewer.js'], starterRoot);

const personalViewer = requireFile(path.join(personalRoot, 'index.html'));
const starterViewer = requireFile(path.join(starterRoot, 'index.html'));
if (!personalViewer.equals(starterViewer)) fail('index.html differs between the personal dashboard and Starter');

const viewer = personalViewer.toString('utf8');
const viewerVersion = viewer.match(/<meta name="health-dashboard-viewer-version" content="([^"]+)">/);
const supportedSchema = viewer.match(/const SUPPORTED_SCHEMA_VERSION\s*=\s*(\d+)/);
if (!viewerVersion) fail('Shared index.html has no health-dashboard-viewer-version meta tag');
if (!supportedSchema) fail('Shared index.html has no SUPPORTED_SCHEMA_VERSION constant');

const personal = loadData(personalRoot);
const starter = loadData(starterRoot);
const schemaVersion = Number(supportedSchema[1]);
if (personal.schemaVersion !== schemaVersion || starter.schemaVersion !== schemaVersion) {
  fail(`Data schema mismatch: viewer supports ${schemaVersion}, personal=${personal.schemaVersion}, Starter=${starter.schemaVersion}`);
}

const personalMarkers = markerMap(personal);
const starterMarkers = markerMap(starter);
if (personalMarkers.size !== starterMarkers.size) fail('Marker catalogues have different sizes');
for (const [id, marker] of personalMarkers) {
  const templateMarker = starterMarkers.get(id);
  if (!templateMarker) fail(`Starter is missing marker ${id}`);
  if (!same(marker.note, templateMarker.note)) fail(`Generic marker description differs for ${id}`);
  if (!same(referenceCore(marker), referenceCore(templateMarker))) fail(`Reference core differs for ${id}`);
  if (!same(marker.target || null, templateMarker.target || null)) fail(`Optimal target differs for ${id}`);
}

const personalBenchmarks = personal.TRAINING && personal.TRAINING.benchmarks && personal.TRAINING.benchmarks.items || [];
const starterBenchmarks = starter.TRAINING && starter.TRAINING.benchmarks && starter.TRAINING.benchmarks.items || [];
const starterBenchmarkIds = starterBenchmarks.map(item => item.id);
const sharedPersonalOrder = personalBenchmarks.filter(item => starterBenchmarkIds.includes(item.id)).map(item => item.id);
if (!starterBenchmarks.length || sharedPersonalOrder.join('|') !== starterBenchmarkIds.join('|')) {
  fail('Starter benchmark definitions are missing or reordered');
}
starterBenchmarks.forEach(templateItem => {
  const personalItem = personalBenchmarks.find(item => item.id === templateItem.id);
  if (!personalItem || !same(benchmarkCore(personalItem), benchmarkCore(templateItem))) {
    fail(`Public benchmark metadata differs for ${templateItem.id}`);
  }
});

const personalChangelog = requireFile(path.join(personalRoot, 'CHANGELOG.md'));
const starterChangelog = requireFile(path.join(starterRoot, 'CHANGELOG.md'));
if (!personalChangelog.equals(starterChangelog)) fail('CHANGELOG.md differs between the two folders');
const changelog = personalChangelog.toString('utf8');
const expectedHeading = `## Viewer ${viewerVersion[1]} · Schema ${schemaVersion} ·`;
if (!changelog.includes(expectedHeading)) fail(`CHANGELOG.md has no current ${expectedHeading} entry`);
const currentEntry = changelog.slice(changelog.indexOf(expectedHeading)).split(/\n## /)[0].trim();

console.log(`\n✅ Shared release valid: Viewer ${viewerVersion[1]} · Schema ${schemaVersion}`);
console.log(`✅ Personal data remains separate; Starter blank-package protection passed`);
console.log(`\n${currentEntry}`);
