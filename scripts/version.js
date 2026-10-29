#!/usr/bin/env node
// Sube la versión de las dos extensiones a la vez.
//   npm run bump -- patch     0.1.0 → 0.1.1
//   npm run bump -- minor     0.1.0 → 0.2.0
//   npm run bump -- major     0.1.0 → 1.0.0
//   npm run bump -- 0.3.2     versión exacta
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const archivos = ['vscode/package.json', 'chrome/manifest.json'];
const arg = process.argv[2];
if (!arg) {
  console.error('Uso: npm run bump -- <patch|minor|major|x.y.z>');
  process.exit(1);
}

const leer = (f) => JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8'));
const actual = leer(archivos[0]).version;
let nueva;
if (/^\d+\.\d+\.\d+$/.test(arg)) nueva = arg;
else {
  const [ma, mi, pa] = actual.split('.').map(Number);
  nueva = { major: `${ma + 1}.0.0`, minor: `${ma}.${mi + 1}.0`, patch: `${ma}.${mi}.${pa + 1}` }[arg];
  if (!nueva) { console.error(`Valor no válido: ${arg}`); process.exit(1); }
}

for (const f of archivos) {
  const json = leer(f);
  json.version = nueva;
  fs.writeFileSync(path.join(raiz, f), JSON.stringify(json, null, 2) + '\n');
  console.log(`${f}: ${actual} → ${nueva}`);
}

console.log(`
Ahora:
  git add -A
  git commit -m "Versión ${nueva}"
  git tag v${nueva}
  git push origin main --tags
`);
