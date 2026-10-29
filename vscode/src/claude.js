// Lee las sesiones de Claude Code (~/.claude/projects/**/*.jsonl)
// y extrae la última respuesta del asistente.
const fs = require('fs');
const path = require('path');
const os = require('os');

function expandir(p) {
  return p && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

// Claude Code nombra la carpeta del proyecto reemplazando / y . por -
function carpetaDelProyecto(raiz, cwd) {
  if (!cwd) return null;
  const nombre = cwd.replace(/[\\/.:]/g, '-');
  const dir = path.join(raiz, nombre);
  return fs.existsSync(dir) ? dir : null;
}

function listarJsonl(dir, profundidad = 2) {
  const out = [];
  let entradas = [];
  try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entradas) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name.endsWith('.jsonl')) {
      try { out.push({ p, mtime: fs.statSync(p).mtimeMs }); } catch { /* */ }
    } else if (e.isDirectory() && profundidad > 0) {
      out.push(...listarJsonl(p, profundidad - 1));
    }
  }
  return out;
}

// Devuelve la ruta del .jsonl modificado más recientemente.
// Prefiere el proyecto abierto en VS Code; si no, cualquiera.
function sesionMasReciente(raizConfig, cwds = []) {
  const raiz = expandir(raizConfig);
  const candidatos = [];
  for (const cwd of cwds) {
    const dir = carpetaDelProyecto(raiz, cwd);
    if (dir) candidatos.push(...listarJsonl(dir, 0));
  }
  const lista = candidatos.length ? candidatos : listarJsonl(raiz, 1);
  lista.sort((a, b) => b.mtime - a.mtime);
  return lista[0] ? lista[0].p : null;
}

function esMensajeHumano(entrada) {
  if (entrada.type !== 'user' || !entrada.message) return false;
  if (entrada.isMeta || entrada.isSidechain) return false;
  const c = entrada.message.content;
  if (typeof c === 'string') return !c.startsWith('<command-') && !c.startsWith('<local-command');
  if (Array.isArray(c)) return c.some((b) => b && b.type === 'text');
  return false;
}

function bloquesTexto(entrada) {
  const c = entrada.message && entrada.message.content;
  if (typeof c === 'string') return [c];
  if (!Array.isArray(c)) return [];
  return c.filter((b) => b && b.type === 'text' && b.text).map((b) => b.text);
}

function parsear(contenido) {
  const out = [];
  for (const linea of contenido.split('\n')) {
    if (!linea.trim()) continue;
    try { out.push(JSON.parse(linea)); } catch { /* línea parcial */ }
  }
  return out;
}

// Junta todo el texto del asistente posterior al último mensaje humano.
// `soloFinal`: devuelve null si el turno aún no terminó (último bloque es tool_use).
function ultimaRespuesta(contenido, { soloFinal = false } = {}) {
  const entradas = parsear(contenido).filter((e) => !e.isSidechain);
  let inicio = 0;
  for (let i = entradas.length - 1; i >= 0; i--) {
    if (esMensajeHumano(entradas[i])) { inicio = i + 1; break; }
  }
  const turno = entradas.slice(inicio).filter((e) => e.type === 'assistant' && e.message);
  if (!turno.length) return null;

  if (soloFinal) {
    const ultima = turno[turno.length - 1];
    const c = ultima.message.content;
    const tieneTool = Array.isArray(c) && c.some((b) => b && b.type === 'tool_use');
    const stop = ultima.message.stop_reason;
    if (tieneTool || (stop && stop !== 'end_turn')) return null;
  }

  // La respuesta final suele ser el último tramo de texto; el texto intermedio
  // entre herramientas es narración. Tomamos los bloques de texto después del
  // último tool_use, y si no hay, todo el texto del turno.
  let idxUltimaTool = -1;
  turno.forEach((e, i) => {
    const c = e.message.content;
    if (Array.isArray(c) && c.some((b) => b && b.type === 'tool_use')) idxUltimaTool = i;
  });
  let tramo = turno.slice(idxUltimaTool + 1).flatMap(bloquesTexto);
  if (!tramo.join('').trim()) tramo = turno.flatMap(bloquesTexto);
  const texto = tramo.join('\n\n').trim();
  if (!texto) return null;

  const ultima = turno[turno.length - 1];
  return { texto, id: ultima.uuid || ultima.message.id || String(texto.length) };
}

module.exports = { sesionMasReciente, ultimaRespuesta, expandir };
