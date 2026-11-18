#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Builds the shards in this repository as .libreshard files, with LibreShard's own code, and checks
// each one the way the app checks a file before installing it:
//
//   node tools/build.mjs                 build and check every shard into out/
//   node tools/build.mjs office blender  only these shards
//   node tools/build.mjs --release       also require a CHANGELOG.md entry for the version
//   node tools/build.mjs --format        rewrite each panel.json in the editor's own form
//   node tools/build.mjs --sync-base     copy the app's current libreshard.css/js into code shards
//
// A shard is a folder at the root with one of:
//   panel.json + shard.json   a panel: the editor's source plus what its manifest says. It's built
//                             like the editor's "Save" does it, from the app's panel template, but
//                             the version is the one in shard.json (the editor raises it each save).
//   manifest.json             a shard with code: its files are packaged as they are.
// Each one also has gallery.json ({ "tags": [...] }) and CHANGELOG.md, which aren't packaged.
//
// A shard may also have tools/check.js, its own checks (icons, profiles…): it runs first, from the
// shard's folder, and a non-zero exit stops that shard.
//
// For every shard, out/ gets <id>-<version>.libreshard and <id>-<version>.json: the entry for the
// gallery (libreshard/shards), with the download address of its release here, its sha256 and size.
// The screenshot is added in the gallery's pull request.
//
// Builds are reproducible: the same commit, built with the same LibreShard version and Node major,
// gives the same bytes and so the same sha256, on any system. Entries are sorted by name and dated
// by the last commit that touched the shard's folder (in UTC: zip dates have no time zone).
//
// Needs a checkout of the LibreShard app at the tag in app-version.txt, with its dependencies
// installed (npm ci): LIBRESHARD_DIR, or ./libreshard (where CI puts it). Panels carry the app's
// panel template inside, so that version is part of what gets published; app-version.txt is moved
// by hand when a new app version comes out.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// The zip writer stores each entry's date as local time: the same in UTC everywhere
process.env.TZ = 'UTC';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const REPO = 'https://github.com/libreshard/gallery-shards';
const AUTHOR = 'LibreShard';
const LICENSE = 'Apache-2.0';
// The gallery's own limits and tags (libreshard/shards, tools/check.mjs)
const TAGS = ['games', 'streaming', 'creative', 'video', 'audio', 'office', 'development', 'desktop', 'accessibility', 'other'];
const MAX_DESCRIPTION = 160;
const ID = /^[a-z0-9-]{1,64}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
// Files of a code shard that stay in the repository
const NOT_PACKAGED = new Set(['gallery.json', 'CHANGELOG.md', 'README.md', 'README.es.md', 'tools', 'docs']);
const SHARED = ['libreshard.css', 'libreshard.js'];
const APP_TAG = /^v\d+\.\d+\.\d+$/;
const CHECK_TIMEOUT_MS = 120_000;

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const only = args.filter((a) => !a.startsWith('--'));

const lf = (s) => s.replace(/\r\n/g, '\n');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = (dir, f) => fs.existsSync(path.join(dir, f));
// git's output, or null when it fails (not a repository, unknown revision)
function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// The LibreShard version every shard is built with: a tag like v0.5.1
function appTag() {
  const tag = fs.readFileSync(path.join(ROOT, 'app-version.txt'), 'utf8').trim();
  if (!APP_TAG.test(tag)) throw new Error('app-version.txt must hold a LibreShard tag like v0.5.1');
  return tag;
}

function loadApp() {
  const tag = appTag();
  const dir = path.resolve(process.env.LIBRESHARD_DIR || path.join(ROOT, 'libreshard'));
  if (!fs.existsSync(path.join(dir, 'panel-format.js'))) {
    throw new Error(`No LibreShard checkout at ${dir}: set LIBRESHARD_DIR (a checkout of libreshard/libreshard at ${tag} with npm ci done)`);
  }
  const version = readJson(path.join(dir, 'package.json')).version;
  if (`v${version}` !== tag) throw new Error(`The LibreShard checkout at ${dir} is ${version}, but app-version.txt says ${tag}: git -C "${dir}" switch --detach ${tag}`);
  // The same version number isn't enough: main keeps it until the next release
  const head = git(dir, 'rev-parse', 'HEAD');
  const tagged = git(dir, 'rev-parse', '--verify', '--quiet', `${tag}^{commit}`);
  const notes = [];
  if (head === null) notes.push(`${dir} isn't a git checkout: only its version was checked`);
  else if (tagged === null) throw new Error(`The LibreShard checkout at ${dir} doesn't have the tag ${tag}: git -C "${dir}" fetch --tags`);
  else if (head !== tagged) throw new Error(`The LibreShard checkout at ${dir} isn't at ${tag}: git -C "${dir}" switch --detach ${tag}`);
  const require = createRequire(path.join(dir, 'package.json'));
  const templateDir = path.join(dir, 'desktop', 'panel-template');
  const template = {};
  for (const f of fs.readdirSync(templateDir)) template[f] = lf(fs.readFileSync(path.join(templateDir, f), 'utf8'));
  // What every shard with code copies from the app: the authors' template gets the same files
  const base = require('./tools/build-shard-base.js').targets().find((t) => path.basename(t.dir) === 'shard-template').files;
  return {
    dir,
    version,
    notes,
    panel: require('./panel-format.js'),
    zip: require('./zip.js'),
    installer: require('./installer.js'),
    manifest: require('./manifest.js'),
    template,
    base,
  };
}

// The shard folders: panels first, then shards with code, in name order
function shardDirs() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .filter((name) => exists(path.join(ROOT, name), 'manifest.json') || exists(path.join(ROOT, name), 'shard.json'))
    .sort();
}

// Every file under dir, relative and with "/", without hidden files
function filesUnder(dir, rel = '') {
  const out = [];
  for (const d of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (d.name.startsWith('.')) continue;
    const r = rel ? `${rel}/${d.name}` : d.name;
    if (d.isDirectory()) out.push(...filesUnder(dir, r));
    else if (d.isFile()) out.push(r);
  }
  return out;
}

// What every shard must say the same way, whatever its kind
function checkMeta(m, name, errors) {
  if (m.id !== name) errors.push(`"id" must be the folder's name ("${name}")`);
  if (!ID.test(name)) errors.push('the folder name must use only lowercase letters, digits and hyphens');
  if (m.author !== AUTHOR) errors.push(`"author" must be "${AUTHOR}"`);
  if (m.license !== LICENSE) errors.push(`"license" must be "${LICENSE}"`);
  if (m.url !== `${REPO}/tree/main/${name}`) errors.push(`"url" must be "${REPO}/tree/main/${name}"`);
  if (typeof m.version !== 'string' || !VERSION.test(m.version)) errors.push('"version" must look like "1.0.0"');
  if (typeof m.description !== 'string' || !m.description.trim() || [...m.description].length > MAX_DESCRIPTION) {
    errors.push(`"description" must be text of up to ${MAX_DESCRIPTION} characters (the gallery's limit)`);
  }
}

// A panel's files: the app's template plus manifest.json, panel.json, layout.js and its images
function stagePanel(app, dir, name, stage, errors, warnings) {
  const images = new Set(filesUnder(dir).filter((f) => f.startsWith('images/')));
  const r = app.panel.validatePanel(readJson(path.join(dir, 'panel.json')), { files: images });
  if (!r.ok) { errors.push(...r.errors.map((m) => `panel.json: ${m}`)); return null; }
  // The editor never writes anything validatePanel drops, so a warning means a hand edit went wrong
  if (r.warnings.length) { errors.push(...r.warnings.map((m) => `panel.json: ${m}`)); return null; }
  const canonical = JSON.stringify(r.panel, null, 2) + '\n';
  if (lf(fs.readFileSync(path.join(dir, 'panel.json'), 'utf8')) !== canonical) {
    if (flag('--format')) fs.writeFileSync(path.join(dir, 'panel.json'), canonical);
    else errors.push('panel.json isn\'t in the editor\'s form: run node tools/build.mjs --format');
  }

  const meta = readJson(path.join(dir, 'shard.json'));
  checkMeta(meta, name, errors);
  const built = app.panel.buildShard({ panel: r.panel, meta, template: app.template });
  // buildShard raises the version like every save in the editor does; here shard.json decides
  built.manifest.version = meta.version;
  built.files['manifest.json'] = JSON.stringify(built.manifest, null, 2) + '\n';

  for (const [f, content] of Object.entries(built.files)) fs.writeFileSync(path.join(stage, f), content);
  const used = app.panel.imagesOf(r.panel);
  if (used.length) fs.mkdirSync(path.join(stage, 'images'));
  for (const f of used) fs.copyFileSync(path.join(dir, f), path.join(stage, f));
  for (const f of images) if (!used.includes(f)) warnings.push(`${f} isn't used by any button`);
  return meta;
}

// A shard with code: its files as they are, minus what stays in the repository
function stageCode(app, dir, name, stage, errors, warnings) {
  const meta = readJson(path.join(dir, 'manifest.json'));
  checkMeta(meta, name, errors);
  for (const f of SHARED) {
    const file = path.join(dir, f);
    const current = fs.existsSync(file) ? lf(fs.readFileSync(file, 'utf8')) : null;
    if (current === null || current === app.base[f]) continue;
    if (flag('--sync-base')) fs.writeFileSync(file, app.base[f]);
    else warnings.push(`${f} differs from the app's shard-base: run node tools/build.mjs --sync-base ${name}`);
  }
  for (const rel of filesUnder(dir)) {
    if (NOT_PACKAGED.has(rel.split('/')[0])) continue;
    fs.mkdirSync(path.dirname(path.join(stage, rel)), { recursive: true });
    fs.copyFileSync(path.join(dir, rel), path.join(stage, rel));
  }
  return meta;
}

// The date every entry of a shard's zip gets: the last commit that touched its folder. A folder that
// isn't committed, or has changes, still builds (with a warning); a release needs a clean commit.
function shardDate(name, errors, warnings) {
  const release = flag('--release');
  if (git(ROOT, 'rev-parse', '--is-shallow-repository') === 'true') {
    (release ? errors : warnings).push('the repository is a shallow clone, so the date of the last commit can be wrong (CI needs fetch-depth: 0)');
  }
  const seconds = git(ROOT, 'log', '-1', '--format=%ct', '--', name);
  if (!seconds) {
    (release ? errors : warnings).push('not committed yet: the file is dated now and nobody else can rebuild it');
    return new Date();
  }
  if (git(ROOT, 'status', '--porcelain', '--', name)) {
    (release ? errors : warnings).push('has uncommitted changes: the file won\'t match a build of the last commit');
  }
  return new Date(Number(seconds) * 1000);
}

// The shard's own checks (tools/check.js), run from its folder with the same LibreShard checkout
function runCheck(app, dir, errors) {
  const file = path.join(dir, 'tools', 'check.js');
  if (!fs.existsSync(file)) return false;
  const r = spawnSync(process.execPath, [file], {
    cwd: dir, encoding: 'utf8', timeout: CHECK_TIMEOUT_MS, env: { ...process.env, LIBRESHARD_DIR: app.dir },
  });
  if (r.status === 0) return true;
  const why = r.error ? r.error.message : r.signal ? `stopped (${r.signal})` : `exit code ${r.status}`;
  errors.push(`tools/check.js failed: ${why}`);
  const output = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-20);
  for (const line of output) if (line.trim()) errors.push(`  ${line}`);
  return false;
}

// The staged folder as a zip that doesn't depend on the system or the time: names in code-unit
// order (not the file system's, not the locale's) and one fixed date
function reproducibleZip(app, stage, date) {
  const files = app.zip.filesUnder(stage, { hidden: false }).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return app.zip.createZip(files.map((rel) => ({ name: rel, data: fs.readFileSync(path.join(stage, rel)) })), { date });
}

function changelogHas(dir, version) {
  const file = path.join(dir, 'CHANGELOG.md');
  if (!fs.existsSync(file)) return false;
  const v = version.replace(/\./g, '\\.');
  return new RegExp(`^## \\[${v}\\]`, 'm').test(fs.readFileSync(file, 'utf8'));
}

async function build(app, name) {
  const dir = path.join(ROOT, name);
  const errors = [];
  const warnings = [];
  const panel = exists(dir, 'shard.json');
  if (panel && exists(dir, 'manifest.json')) return { errors: ['a folder has either shard.json (a panel) or manifest.json (code), not both'], warnings };

  let gallery = {};
  try { gallery = readJson(path.join(dir, 'gallery.json')); } catch { errors.push('gallery.json is missing or isn\'t valid JSON'); }
  const tags = gallery.tags;
  if (!Array.isArray(tags) || !tags.length || tags.length > 3 || tags.some((t) => !TAGS.includes(t))) {
    errors.push(`gallery.json: "tags" must be one to three of ${TAGS.join(', ')}`);
  }

  const checked = runCheck(app, dir, errors);
  if (errors.length) return { errors, warnings };
  const date = shardDate(name, errors, warnings);

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), `gallery-${name}-`));
  try {
    const meta = (panel ? stagePanel : stageCode)(app, dir, name, stage, errors, warnings);
    if (!meta) return { errors, warnings };
    if (flag('--release') && !changelogHas(dir, meta.version)) errors.push(`CHANGELOG.md has no "## [${meta.version}]" entry`);
    if (!exists(stage, 'LICENSE')) fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(stage, 'LICENSE'));
    if (errors.length) return { errors, warnings };

    const file = `${name}-${meta.version}.libreshard`;
    const data = reproducibleZip(app, stage, date);
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, file), data);

    const prepared = await app.installer.prepare(path.join(OUT, file), { appVersion: app.version });
    try {
      if (!prepared.ok) return { errors: prepared.errors.map((m) => `LibreShard refuses the file: ${m}`), warnings };
      const m = prepared.manifest;
      if (!m.keys.length) errors.push('the shard presses no keys');
      if (errors.length) return { errors, warnings };
      const entry = {
        id: m.id,
        name: m.name,
        author: m.author,
        description: m.description,
        icon: m.icon,
        version: m.version,
        minAppVersion: m.minAppVersion,
        license: m.license,
        url: m.url,
        tags,
        keys: m.keys,
        apps: m.apps?.length ? m.apps : undefined,
        download: {
          url: `${REPO}/releases/download/${name}-v${m.version}/${file}`,
          sha256: crypto.createHash('sha256').update(data).digest('hex'),
          size: data.length,
        },
      };
      fs.writeFileSync(path.join(OUT, `${name}-${m.version}.json`), JSON.stringify(entry, null, 2) + '\n');
      const risk = app.manifest.classifyKeys(m.keys);
      const notes = [];
      if (risk.dangerous.length) notes.push(`system shortcuts: ${risk.dangerous.join(', ')}`);
      if (risk.canType) notes.push('can type text and press Enter');
      if (risk.warning) notes.push('WARNING: system shortcuts and typing together');
      notes.push(`sha256 ${entry.download.sha256}, dated ${date.toISOString()}${checked ? ', tools/check.js passed' : ''}`);
      return { errors, warnings, file, summary: `${m.version}, ${panel ? 'panel' : 'code'}, ${m.keys.length} keys, ${prepared.size.files} files, ${data.length} bytes`, notes };
    } finally {
      prepared.cleanup?.();
    }
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

async function main() {
  const app = loadApp();
  const all = shardDirs();
  const unknown = only.filter((n) => !all.includes(n));
  if (unknown.length) throw new Error(`No shard folder named ${unknown.join(', ')}`);
  const names = only.length ? only : all;
  console.log(`LibreShard ${app.version} at ${app.dir}, Node ${process.versions.node}`);
  for (const m of app.notes) console.log(`warning: ${m}`);
  let failed = 0;
  for (const name of names) {
    const r = await build(app, name);
    if (r.errors.length) {
      failed++;
      console.log(`✖ ${name}`);
      for (const m of r.errors) console.log(`  - ${m}`);
    } else {
      console.log(`✔ ${name}: out/${r.file} (${r.summary})`);
      for (const m of r.notes) console.log(`  ${m}`);
    }
    for (const m of r.warnings) console.log(`  warning: ${m}`);
  }
  console.log(`${names.length} shards, ${failed} with problems`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
