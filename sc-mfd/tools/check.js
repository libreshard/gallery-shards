#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// The SC MFD's own checks, run by the repository's tools/build.mjs before packaging (or by hand, from
// this folder): icons.css matches tools/icons.js, the minimal mode fits its grids, and the control
// profile and the manifest's keys match layout.js. It changes nothing: a stale file is reported, and
// the fix is to run the tool it names and commit the result.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const run = (script, ...args) => spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: root, stdio: 'inherit' }).status === 0;

let ok = run('build-icons.js', '--check');
ok = run('check-compact.js') && ok;

// build-profile.js rewrites both files: compare them with what's committed, then put that back
const GENERATED = ['LibreShard_MFD.xml', 'manifest.json'];
const before = GENERATED.map((f) => fs.readFileSync(path.join(root, f)));
let built = false;
try {
  built = run('build-profile.js');
} finally {
  const stale = GENERATED.filter((f, i) => !fs.readFileSync(path.join(root, f)).equals(before[i]));
  GENERATED.forEach((f, i) => { if (stale.includes(f)) fs.writeFileSync(path.join(root, f), before[i]); });
  if (built && stale.length) {
    console.error(`${stale.join(' and ')} ${stale.length > 1 ? "don't" : "doesn't"} match layout.js: run node tools/build-profile.js and commit the result`);
    ok = false;
  }
}
if (!built) ok = false;
process.exit(ok ? 0 : 1);
