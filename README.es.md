<p align="center">
  <img src="chrome/iconos/128.png" width="96" alt="Dilo">
</p>

<h1 align="center">Dilo</h1>

<p align="center">
  <b>Escucha en lugar de leer.</b> Dilo lee en voz alta el texto seleccionado, los archivos Markdown y las respuestas de los asistentes de IA, tanto en VS Code como en el navegador.
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="#vs-code">VS Code</a> ·
  <a href="#chrome">Chrome</a> ·
  <a href="CONTRIBUTING.md">Contribuir</a>
</p>

---

Los asistentes de IA escriben mucho. **Dilo** pone un 🔊 justo donde lo necesitas, para que escuches la respuesta mientras sigues trabajando:

- 🔊 **junto al botón Copiar** de cada respuesta en Claude, ChatGPT y Gemini.
- 🔊 **flotante** al seleccionar texto en cualquier página.
- **Clic derecho → Leer en voz alta** en VS Code, en el panel de Claude Code, en la vista previa de Markdown y en cualquier página web.
- **Leer la última respuesta de Claude Code** con un atajo. También puede leer cada respuesta automáticamente al terminar.
- Antes de leer limpia los bloques de código, los enlaces, las tablas y los símbolos de Markdown, para que suene natural.

Usa las voces que ya tienes en macOS, Windows, Chrome y Edge. Si quieres voces neuronales, puedes usar [edge-tts](https://github.com/rany2/edge-tts), que es gratis. No necesita cuenta ni API key, y no te rastrea.

## VS Code

Descarga `dilo-x.y.z.vsix` desde [Releases](https://github.com/chundo/dilo/releases). Luego, en VS Code, pulsa **⌘⇧P → Extensions: Install from VSIX…** y elige el archivo.

| Dónde | Acción |
|---|---|
| Cualquier editor | Seleccionas → clic derecho → **Leer en voz alta** (`⌘⌥R`) |
| Archivo o vista previa Markdown | El 🔊 de la barra de título lee el documento completo |
| Panel de Claude Code | Clic derecho → **Leer última respuesta de Claude** (`⌘⌥L`) |
| Barra de estado | 🔊 lee la última respuesta de Claude · ⏹ detiene (`⌘⌥.`) |

Documentación completa: [vscode/README.es.md](vscode/README.es.md)

## Chrome

Funciona en Chrome, Edge, Brave y Arc.

1. Descarga `dilo-chrome-x.y.z.zip` desde [Releases](https://github.com/chundo/dilo/releases) y descomprímelo, o clona este repositorio.
2. Abre `chrome://extensions` y activa el **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida** y elige la carpeta `chrome/`.

| Dónde | Acción |
|---|---|
| Claude / ChatGPT / Gemini | 🔊 junto a **Copiar** en cada respuesta |
| Cualquier página | Seleccionas → 🔊 flotante, o clic derecho → **Leer en voz alta** |
| Cualquier página | Clic derecho → **Leer esta página** (salta menús y pie de página) |
| Atajos | `Alt+Shift+R` leer · `Alt+Shift+S` detener |

**Consejo:** en Microsoft Edge tienes las voces neuronales "Online (Natural)" gratis, por ejemplo Salomé de Colombia. Son las que mejor suenan.

Documentación completa: [chrome/README.es.md](chrome/README.es.md)

## Estructura del repositorio

```
dilo/
├── shared/limpiar.js     Limpieza de texto compartida por las dos extensiones (fuente única)
├── vscode/               Extensión de VS Code
├── chrome/               Extensión de Chrome (Manifest V3)
├── scripts/              sync-shared.js, zip-chrome.js
├── tests/                Pruebas con node:test
└── .github/workflows/    CI: sincronización, pruebas y empaquetado
```

## Desarrollo

Necesitas Node.js 18 o superior. No hay dependencias de ejecución.

```bash
npm test             # pruebas
npm run sync         # copia shared/limpiar.js a las dos extensiones
npm run build        # genera dist/dilo-x.y.z.vsix y dist/dilo-chrome-x.y.z.zip
```

- **VS Code:** abre `vscode/` y pulsa **F5**.
- **Chrome:** carga `chrome/` como extensión descomprimida y pulsa ↻ en su tarjeta después de cada cambio.

Si el 🔊 deja de aparecer en un sitio de IA, lo más probable es que haya cambiado su HTML. Actualiza los selectores en [`chrome/sitios.js`](chrome/sitios.js). Al pulsar el ícono de la extensión en ese sitio verás un diagnóstico.

## Privacidad

Dilo no recopila, guarda ni envía datos, y no tiene analíticas. Las voces locales (macOS, Windows y las voces sin conexión de Chrome) no salen de tu equipo. Las **voces en línea** sí envían el texto que se lee al servicio de voz de Google o de Microsoft para generar el audio. Son las voces de Google en Chrome, las "Online (Natural)" de Edge y edge-tts en VS Code. Si eso te importa, elige una voz local.

## Licencia

[MIT](LICENSE) © 2026 Segundo
