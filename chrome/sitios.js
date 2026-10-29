// Dónde poner el 🔊 en cada asistente de IA.
// Si un sitio cambia su HTML y el botón deja de aparecer, normalmente basta con
// actualizar estos selectores (inspecciona el botón "Copiar" con clic derecho → Inspeccionar).
//
//   host       expresión regular del dominio
//   copiar     botón "Copiar" de cada respuesta; el 🔊 se inserta justo después
//   turno      (opcional) contenedor de una respuesta completa con su barra de botones
//   respuesta  elemento con el texto de la respuesta del asistente
//   omitir     (opcional) partes de la respuesta que no se leen (bloques de "pensando", artefactos…)

globalThis.DILO_SITIOS = [
  {
    nombre: 'Claude',
    host: /(^|\.)claude\.ai$/,
    copiar: 'button[data-testid="action-bar-copy"], button[aria-label="Copy"], button[aria-label="Copiar"]',
    turno: '[data-test-render-count]',
    respuesta: '.font-claude-response, .font-claude-message, [data-testid="assistant-message"], [data-is-streaming] .standard-markdown',
    omitir: '[data-testid="thinking"], .artifact-block-cell, [data-testid="tool-use"]',
  },
  {
    nombre: 'ChatGPT',
    host: /(^|\.)(chatgpt\.com|chat\.openai\.com)$/,
    copiar: 'button[data-testid="copy-turn-action-button"]',
    turno: 'article, [data-testid^="conversation-turn"]',
    respuesta: '[data-message-author-role="assistant"]',
    omitir: '.sr-only',
  },
  {
    nombre: 'Gemini',
    host: /(^|\.)gemini\.google\.com$/,
    copiar: 'copy-button button, button[data-test-id="copy-button"]',
    turno: 'model-response',
    respuesta: 'message-content, .model-response-text',
  },
];
