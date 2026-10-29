# Dilo for VS Code

<p><b>English</b> · <a href="README.es.md">Español</a></p>

Listen instead of reading: selected text, whole Markdown files, and Claude Code answers.

> Part of the [Dilo](https://github.com/chundo/dilo) project, which also includes a Chrome extension.

## Installation

Download `dilo-x.y.z.vsix` from [Releases](https://github.com/chundo/dilo/releases), then:

- **From VS Code:** ⌘⇧P / Ctrl+Shift+P → *Extensions: Install from VSIX…* → pick the file → restart VS Code.
- **From the terminal:**
  ```bash
  code --install-extension dilo-0.1.0.vsix
  ```
  On Mac, if `code` isn't found: ⌘⇧P → *Shell Command: Install 'code' command in PATH*. If you get `EPERM` when installing from Downloads, move the `.vsix` to another folder or give Terminal access in System Settings → Privacy & Security → Files and Folders.

## How to use it

The interface is in Spanish for now. Menu labels are shown in **bold**.

| Where | What you do | What happens |
|---|---|---|
| Editor (any file) | Select text → right-click → **Leer en voz alta** | Reads the selection |
| `.md` file or its preview | Click the 🔊 in the title bar | Reads the whole document |
| Claude Code panel | Select → right-click → **🔊 Leer en voz alta** | Reads the selection |
| Claude Code panel | Right-click → **Leer última respuesta de Claude** | Reads the full final answer |
| Status bar | Click 🔊 | Reads the latest Claude answer |
| While speaking | ⏹ in the title bar or status bar | Stops |

**Shortcuts (Mac):** `⌘⌥R` read selection · `⌘⌥L` latest Claude answer · `⌘⌥.` stop. On Windows/Linux use `Ctrl+Alt` instead of `⌘⌥`.

**Auto-read:** run *Dilo: Activar/desactivar lectura automática de Claude* (toggle auto-read). Every time Claude finishes a turn, the answer is read to you.

Before reading, code blocks, links, tables and Markdown symbols are cleaned up so it sounds natural.

## Voices

- **say** (default on macOS): the system voice, works offline. Run *Dilo: Elegir voz* (choose voice) to hear samples. For better voices: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices, and download an "Enhanced" or "Premium" voice.
- **edge-tts**: Microsoft's neural voices, free and very natural (needs internet).
  ```bash
  pipx install edge-tts   # or: pip install edge-tts
  ```
  Then set `dilo.motor` to `edge-tts`. If VS Code can't find it, put the full path in `dilo.rutaEdgeTts` (e.g. `~/.local/bin/edge-tts`).
- On Windows it uses the system voice (System.Speech); on Linux, `spd-say`.

## Settings

| Setting | Default | What it does |
|---|---|---|
| `dilo.motor` | `say` | Speech engine: `say` (system voice) or `edge-tts` |
| `dilo.vozSay` | empty | macOS voice (empty = system voice) |
| `dilo.velocidadSay` | `200` | Words per minute |
| `dilo.vozEdge` | `es-CO-SalomeNeural` | edge-tts voice |
| `dilo.velocidadEdge` | `+10%` | edge-tts speed |
| `dilo.rutaEdgeTts` | `edge-tts` | Path to the executable if it's not on the PATH |
| `dilo.omitirCodigo` | `true` | Skip code blocks |
| `dilo.autoLeerClaude` | `false` | Read every Claude answer when it finishes |
| `dilo.carpetaClaude` | `~/.claude/projects` | Where Claude Code stores its sessions |

## Technical notes

- In webview panels (Claude, Markdown preview), VS Code doesn't give extensions the selected text. Dilo copies the selection, reads it from the clipboard, and then restores whatever was on the clipboard before.
- The latest answer is read from `~/.claude/projects/<project>/*.jsonl`. It prefers the project open in VS Code and takes only the final text, without the narration between tool calls.
- The **Leer última respuesta** right-click option appears in panels whose ID contains "claude". If you don't see it, adjust the `webviewId` condition in `package.json`.
- No npm dependencies: plain JavaScript on top of the VS Code API.

## Development

Open the `vscode/` folder in VS Code and press **F5**: a new window opens with the extension loaded. To package it, run `npm run build:vscode` from the repo root.
