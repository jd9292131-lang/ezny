const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.vercel'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(root);

// JS syntax
for (const file of files.filter(f => f.endsWith('.js'))) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) errors.push(`JS inválido: ${path.relative(root, file)}\n${r.stderr}`);
}

// Broken local HTML refs
for (const file of files.filter(f => /\.(html?|htm)$/i.test(f))) {
  const html = fs.readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(https?:|\/\/|#|data:|mailto:|tel:|javascript:)/i.test(ref)) continue;
    const target = path.resolve(path.dirname(file), ref.split('?')[0]);
    if (!fs.existsSync(target)) errors.push(`Referência inexistente: ${path.relative(root, file)} -> ${ref}`);
  }
}

// SQLite compatibility should now be isolated to the adapter/migration documentation.
for (const file of files.filter(f => f.startsWith(path.join(root, 'backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt')) && f.endsWith('.js'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of [/INSERT\s+OR\s+(IGNORE|REPLACE)\s+INTO/i, /db\.prepare\s*\(/i, /\bPRAGMA\b/i, /\bAUTOINCREMENT\b/i, /strftime\s*\(/i]) {
    if (pattern.test(text) && !(/backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt[\\/]config[\\/]db\.js$/i.test(path.relative(root, file)) && pattern.source.startsWith('INSERT'))) warnings.push(`SQLite residual: ${path.relative(root, file)} (${pattern})`);
  }
}

// Secret-bearing environment files must never be part of a deployable ZIP.
for (const file of files) {
  const rel = path.relative(root, file);
  if (/^(\.env$|\.env\.local$|backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt[\\/]\.env$|backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt[\\/]\.env\.local$)/i.test(rel)) {
    errors.push(`Ficheiro de ambiente não deve ser distribuído: ${rel}`);
  }
}

console.log(`EZNY audit: ${errors.length} erro(s), ${warnings.length} aviso(s)`);
for (const e of errors) console.error('ERROR:', e);
for (const w of warnings) console.warn('WARN:', w);
process.exitCode = errors.length ? 1 : 0;
