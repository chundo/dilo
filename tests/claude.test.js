const test = require('node:test');
const assert = require('node:assert/strict');
const { ultimaRespuesta } = require('../vscode/src/claude.js');

const L = (o) => JSON.stringify(o);
const sesion = [
  L({ type: 'user', uuid: 'u1', message: { role: 'user', content: 'hola' } }),
  L({ type: 'assistant', uuid: 'a0', message: { content: [{ type: 'text', text: 'vieja' }], stop_reason: 'end_turn' } }),
  L({ type: 'user', uuid: 'u2', message: { role: 'user', content: [{ type: 'text', text: 'pregunta' }] } }),
  L({ type: 'assistant', uuid: 'a1', message: { content: [{ type: 'text', text: 'Voy a revisar.' }] } }),
  L({ type: 'assistant', uuid: 'a2', message: { content: [{ type: 'tool_use', id: 't', name: 'Read', input: {} }], stop_reason: 'tool_use' } }),
  L({ type: 'user', uuid: 'u3', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: '...' }] } }),
  L({ type: 'assistant', uuid: 'a3', message: { content: [{ type: 'text', text: 'Respuesta final.' }], stop_reason: 'end_turn' } }),
];

test('toma solo el texto después de la última herramienta', () => {
  assert.deepEqual(ultimaRespuesta(sesion.join('\n')), { texto: 'Respuesta final.', id: 'a3' });
});

test('soloFinal devuelve null si el turno sigue en curso', () => {
  assert.equal(ultimaRespuesta(sesion.slice(0, 5).join('\n'), { soloFinal: true }), null);
});

test('ignora líneas JSON cortadas', () => {
  assert.equal(ultimaRespuesta(sesion.join('\n') + '\n{"type":"assi').texto, 'Respuesta final.');
});
