#!/usr/bin/env node
// Empaqueta chrome/ en dist/dilo-chrome-<versión>.zip (listo para la Chrome Web Store).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const { version } = JSON.parse(fs.readFileSync(path.join(raiz, 'chrome', 'manifest.json'), 'utf8'));
fs.mkdirSync(path.join(raiz, 'dist'), { recursive: true });
const salida = path.join(raiz, 'dist', `dilo-chrome-${version}.zip`);
fs.rmSync(salida, { force: true });
execFileSync('zip', ['-qr', salida, '.', '-x', '.*'], { cwd: path.join(raiz, 'chrome'), stdio: 'inherit' });
console.log(`Listo: ${path.relative(raiz, salida)}`);
