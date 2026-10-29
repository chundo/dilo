const test = require('node:test');
const assert = require('node:assert/strict');
const { limpiarMarkdown } = require('../shared/limpiar.js');

test('quita encabezados, énfasis y código en línea', () => {
  assert.equal(limpiarMarkdown('# Título\n\nTexto **fuerte** y `codigo`.'), 'Título.\n\nTexto fuerte y codigo.');
});

test('omite bloques de código por defecto', () => {
  const r = limpiarMarkdown('Antes\n\n```js\nconst x = 1;\n```\n\nDespués');
  assert.match(r, /Bloque de código omitido/);
  assert.doesNotMatch(r, /const x/);
});

test('lee el código si omitirCodigo es false', () => {
  assert.match(limpiarMarkdown('```\nhola()\n```', { omitirCodigo: false }), /hola\(\)/);
});

test('conserva el texto de los enlaces y reemplaza URLs sueltas', () => {
  assert.equal(limpiarMarkdown('Ver [la guía](https://x.com/a) y https://y.com'), 'Ver la guía y enlace');
});

test('convierte tablas en frases', () => {
  assert.equal(limpiarMarkdown('| A | B |\n|---|---|\n| 1 | 2 |'), 'A, B.\n\n1, 2.');
});

test('listas sin viñetas y flechas legibles', () => {
  assert.equal(limpiarMarkdown('- uno\n- dos → tres'), 'uno.\ndos, luego, tres');
});

test('no rompe identificadores con guion bajo', () => {
  assert.match(limpiarMarkdown('usa snake_case_name aquí'), /snake_case_name/);
});

test('bloque de código sin cerrar (respuesta a medias)', () => {
  assert.equal(limpiarMarkdown('Hola\n```py\nprint(1)'), 'Hola.');
});
