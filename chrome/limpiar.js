// ⚠️ Archivo generado desde shared/limpiar.js — edita ese y ejecuta `npm run sync`.
// Convierte Markdown (o texto copiado de una página) en texto natural para leer en voz alta.
// Fuente única compartida por las dos extensiones: edítalo aquí y ejecuta `npm run sync`.

function limpiarMarkdown(texto, { omitirCodigo = true } = {}) {
  let t = String(texto || '').replace(/\r\n/g, '\n');

  // Front matter YAML
  t = t.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Bloques de código
  t = t.replace(/^(```|~~~)[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm, (_, __, cuerpo) =>
    omitirCodigo ? '\nBloque de código omitido.\n' : '\n' + cuerpo + '\n'
  );
  // Bloque sin cerrar al final (respuesta cortada)
  t = t.replace(/^(```|~~~)[^\n]*\n[\s\S]*$/m, omitirCodigo ? '\n' : '$&');

  // HTML y comentarios
  t = t.replace(/<!--[\s\S]*?-->/g, '');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // Imágenes y enlaces
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => (alt ? `Imagen: ${alt}.` : ''));
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  t = t.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
  t = t.replace(/^[ \t]*\[[^\]]+\]:\s*\S+.*$/gm, '');
  t = t.replace(/<?https?:\/\/[^\s>)]+>?/g, 'enlace');

  // Tablas: fila separadora fuera, celdas separadas por comas
  t = t.replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/gm, '');
  t = t.replace(/^[ \t]*\|(.*)\|[ \t]*$/gm, (_, fila) =>
    fila.split('|').map((c) => c.trim()).filter(Boolean).join(', ') + '.'
  );

  // Encabezados, citas, listas, reglas
  t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.*?)[ \t]*#*[ \t]*$/gm, (_, h) => `${h}.`);
  t = t.replace(/^[ \t]*>[ \t]?/gm, '');
  t = t.replace(/^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]+/gm, '');
  t = t.replace(/^[ \t]*[-*+][ \t]+/gm, '');
  t = t.replace(/^[ \t]*(\d+)[.)][ \t]+/gm, '$1. ');
  t = t.replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, '');

  // Énfasis y código en línea
  t = t.replace(/(\*\*|__)(.+?)\1/g, '$2');
  t = t.replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2');
  t = t.replace(/(^|[^\w_])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1$2');
  t = t.replace(/~~(.+?)~~/g, '$1');
  t = t.replace(/`([^`\n]+)`/g, '$1');

  // Símbolos que se leen mal
  t = t.replace(/\s*(→|=>|->)\s*/g, ', luego, ');
  t = t.replace(/\s*(←|<-)\s*/g, ', desde ');
  t = t.replace(/[│├└┌┐┘┤┬┴┼─]+/g, ' ');
  t = t.replace(/\\([\\`*_{}\[\]()#+\-.!|])/g, '$1');

  // Pausa al final de cada línea sin puntuación
  t = t.replace(/([^\s.,;:!?…])[ \t]*\n/g, '$1.\n');

  // Espacios
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/ *\n */g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

globalThis.limpiarMarkdown = limpiarMarkdown;
if (typeof module !== 'undefined') module.exports = { limpiarMarkdown };
