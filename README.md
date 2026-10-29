<p align="center">
  <img src="chrome/iconos/128.png" width="96" alt="Dilo">
</p>

<h1 align="center">Dilo</h1>

<p align="center">
  <b>Listen instead of reading.</b> Read aloud selected text, Markdown files and AI assistant answers — in VS Code and in your browser.
</p>

<p align="center">
  <a href="README.es.md">Español</a> ·
  <a href="#vs-code">VS Code</a> ·
  <a href="#chrome">Chrome</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

AI assistants write a lot. **Dilo** (Spanish for *"say it"*) puts a 🔊 button where you need it, so you can listen to an answer while you keep working:

- 🔊 **next to the Copy button** on every answer in Claude, ChatGPT and Gemini
- 🔊 **floating button** when you select text on any web page
- **Right-click → Read aloud** in VS Code, in the Claude Code panel, in Markdown previews and on any web page
- **Read the latest Claude Code answer** with one shortcut, or have every answer read automatically when it finishes
- Code blocks, links, tables and Markdown symbols are cleaned up before reading, so it sounds natural

It uses voices you already have (macOS, Windows, Chrome and Edge voices), with optional free neural voices via [edge-tts](https://github.com/rany2/edge-tts). No account, no API key, no tracking.

> The interface is in Spanish for now. Translations are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## VS Code

Download `dilo-x.y.z.vsix` from [Releases](https://github.com/chundo/dilo/releases), then in VS Code: **⌘⇧P / Ctrl+Shift+P → Extensions: Install from VSIX…**

| Where | Action |
|---|---|
| Any editor | Select text → right-click → **Leer en voz alta** (`⌘⌥R` / `Ctrl+Alt+R`) |
| Markdown file or preview | 🔊 button in the title bar reads the whole document |
| Claude Code panel | Right-click → **Leer última respuesta de Claude** (`⌘⌥L` / `Ctrl+Alt+L`) |
| Status bar | 🔊 reads the latest Claude answer · ⏹ stops (`⌘⌥.`) |

Full docs: [vscode/README.md](vscode/README.md)

## Chrome

Works in Chrome, Edge, Brave and Arc.

1. Download `dilo-chrome-x.y.z.zip` from [Releases](https://github.com/chundo/dilo/releases) and unzip it (or clone this repo).
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → choose the `chrome/` folder.

| Where | Action |
|---|---|
| Claude / ChatGPT / Gemini | 🔊 next to **Copy** on each answer |
| Any page | Select text → floating 🔊, or right-click → **Leer en voz alta** |
| Any page | Right-click → **Leer esta página** (skips menus and footers) |
| Shortcuts | `Alt+Shift+R` read · `Alt+Shift+S` stop |

**Tip:** in Microsoft Edge you get the free "Online (Natural)" neural voices, which sound the best.

Full docs: [chrome/README.md](chrome/README.md)

## Repository layout

```
dilo/
├── shared/limpiar.js     Text cleanup shared by both extensions (single source of truth)
├── vscode/               VS Code extension
├── chrome/               Chrome extension (Manifest V3)
├── scripts/              sync-shared.js, zip-chrome.js
├── tests/                node:test unit tests
└── .github/workflows/    CI: sync check, tests, packaging
```

## Development

Requires Node.js 18+. No runtime dependencies.

```bash
npm test             # unit tests
npm run sync         # copy shared/limpiar.js into both extensions
npm run build        # dist/dilo-x.y.z.vsix and dist/dilo-chrome-x.y.z.zip
```

- **VS Code:** open `vscode/` and press **F5**.
- **Chrome:** load `chrome/` unpacked, then press ↻ on the extension card after each change.

If the 🔊 stops showing up on an AI site, its HTML probably changed: update the selectors in [`chrome/sitios.js`](chrome/sitios.js). Click the extension icon on that site to see a diagnostic.

## Privacy

Dilo itself doesn't collect, store or send any data, and has no analytics. Local voices (macOS, Windows, offline Chrome voices) never leave your machine. **Online voices** — Google voices in Chrome, "Online (Natural)" voices in Edge, and edge-tts in VS Code — send the text being read to Google's or Microsoft's speech service to generate the audio. Pick a local voice if that matters to you.

## License

[MIT](LICENSE) © 2026 Segundo
