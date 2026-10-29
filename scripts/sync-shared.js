#!/usr/bin/env node
// Copia shared/limpiar.js a cada extensión. Ejecuta después de editar shared/limpiar.js:
//   node scripts/sync-shared.js        (o: npm run sync)
// Con --check falla si alguna copia está desactualizada (útil en CI).
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const origen = path.join(raiz, 'shared', 'limpiar.js');
const destinos = [
  path.join(raiz, 'vscode', 'src', 'limpiar.js'),
  path.join(raiz, 'chrome', 'limpiar.js'),
];
const aviso = '// ⚠️ Archivo generado desde shared/limpiar.js — edita ese y ejecuta `npm run sync`.\n';
const contenido = aviso + fs.readFileSync(origen, 'utf8');
const comprobar = process.argv.includes('--check');

let desactualizados = 0;
for (const d of destinos) {
  const actual = fs.existsSync(d) ? fs.readFileSync(d, 'utf8') : '';
  if (actual === contenido) continue;
  if (comprobar) { console.error(`Desactualizado: ${path.relative(raiz, d)}`); desactualizados++; }
  else { fs.writeFileSync(d, contenido); console.log(`Actualizado: ${path.relative(raiz, d)}`); }
}
if (desactualizados) { console.error('Ejecuta: npm run sync'); process.exit(1); }
if (comprobar) console.log('shared/limpiar.js sincronizado ✔');
