# Dilo para VS Code

<p><a href="README.md">English</a> · <b>Español</b></p>

Escucha en lugar de leer: texto seleccionado, archivos Markdown completos y las respuestas de Claude Code.

> Parte del proyecto [Dilo](https://github.com/chundo/dilo/blob/main/README.es.md), que también tiene una extensión para Chrome.

## Instalación

Descarga `dilo-x.y.z.vsix` desde [Releases](https://github.com/chundo/dilo/releases) y luego:

- **Desde VS Code:** ⌘⇧P → *Extensions: Install from VSIX…* → elige el archivo → reinicia VS Code.
- **Desde la terminal:**
  ```bash
  code --install-extension dilo-0.1.0.vsix
  ```
  En Mac, si `code` no existe: ⌘⇧P → *Shell Command: Install 'code' command in PATH*. Si sale `EPERM` desde Descargas, mueve el `.vsix` a otra carpeta o da acceso a la Terminal en Ajustes del Sistema → Privacidad y seguridad → Archivos y carpetas.

## Cómo se usa

| Dónde | Qué haces | Qué pasa |
|---|---|---|
| Editor (cualquier archivo) | Seleccionas texto → clic derecho → **Leer en voz alta** | Lee la selección |
| Archivo `.md` o su vista previa | Clic en el 🔊 de la barra de título | Lee el documento completo |
| Panel de Claude Code | Seleccionas → clic derecho → **🔊 Leer en voz alta** | Lee la selección |
| Panel de Claude Code | Clic derecho → **Leer última respuesta de Claude** | Lee la respuesta final completa |
| Barra de estado | Clic en 🔊 | Lee la última respuesta de Claude |
| Mientras habla | ⏹ en la barra de título o de estado | Detiene |

**Atajos (Mac):** `⌘⌥R` leer selección · `⌘⌥L` última respuesta de Claude · `⌘⌥.` detener. En Windows/Linux, `Ctrl+Alt` en lugar de `⌘⌥`.

**Lectura automática:** comando *Dilo: Activar/desactivar lectura automática de Claude*. Cada vez que Claude termina un turno, te lee la respuesta.

Antes de leer, se limpian los bloques de código, enlaces, tablas y símbolos de Markdown para que suene natural.

## Voces

- **say** (por defecto en macOS): voz del sistema, sin internet. Ejecuta *Dilo: Elegir voz* para escuchar muestras. Para voces mejores: Ajustes del Sistema → Accesibilidad → Contenido leído → Voz del sistema → Gestionar voces, y descarga una "Mejorada" o "Premium" en español.
- **edge-tts**: voces neuronales de Microsoft, gratis y muy naturales (requiere internet).
  ```bash
  pipx install edge-tts   # o: pip install edge-tts
  ```
  Luego, en ajustes: `dilo.motor` = `edge-tts`. Si VS Code no lo encuentra, pon la ruta completa en `dilo.rutaEdgeTts` (ej. `~/.local/bin/edge-tts`).
- En Windows usa la voz del sistema (System.Speech) y en Linux `spd-say`.

## Ajustes

| Ajuste | Por defecto | Para qué |
|---|---|---|
| `dilo.motor` | `say` | `say` (voz del sistema) o `edge-tts` |
| `dilo.vozSay` | vacío | Voz de macOS (vacío = voz del sistema) |
| `dilo.velocidadSay` | `200` | Palabras por minuto |
| `dilo.vozEdge` | `es-CO-SalomeNeural` | Voz de edge-tts |
| `dilo.velocidadEdge` | `+10%` | Velocidad de edge-tts |
| `dilo.rutaEdgeTts` | `edge-tts` | Ruta al ejecutable si no está en el PATH |
| `dilo.omitirCodigo` | `true` | Saltar bloques de código |
| `dilo.autoLeerClaude` | `false` | Leer cada respuesta de Claude al terminar |
| `dilo.carpetaClaude` | `~/.claude/projects` | Dónde están las sesiones de Claude Code |

## Notas técnicas

- En los paneles web (Claude, vista previa Markdown) VS Code no entrega la selección a las extensiones. Por eso Dilo copia el texto, lo lee desde el portapapeles y después restaura lo que había ahí.
- La última respuesta se lee de `~/.claude/projects/<proyecto>/*.jsonl`. Se prioriza el proyecto abierto en VS Code y se toma solo el texto final, sin la narración entre herramientas.
- La opción "Leer última respuesta" del clic derecho aparece en los paneles cuyo identificador contiene "claude". Si no la ves, ajusta la condición `webviewId` en `package.json`.
- Sin dependencias de npm: es JavaScript plano sobre la API de VS Code.

## Desarrollo

Abre la carpeta `vscode/` en VS Code y pulsa **F5**: se abre una ventana con la extensión cargada. Para empaquetar, desde la raíz del repo: `npm run build:vscode`.
