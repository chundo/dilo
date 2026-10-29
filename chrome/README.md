# Dilo for Chrome

<p><b>English</b> · <a href="README.es.md">Español</a></p>

Listen instead of reading: selected text, whole pages, and answers from **Claude, ChatGPT and Gemini**, with a 🔊 next to the Copy button on every answer.

Works in Chrome, Edge, Brave and Arc.

> Part of the [Dilo](https://github.com/chundo/dilo) project, which also includes a VS Code extension.

## Installation (2 minutes, no Chrome Web Store needed)

1. Open `chrome://extensions` (in Edge: `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the repository's `chrome/` folder (or unzip `dilo-chrome-x.y.z.zip` from [Releases](https://github.com/chundo/dilo/releases)).
4. Pin the 🔊 icon to the toolbar from the extensions menu.
5. Reload any tabs you already had open so the extension runs in them.

> If macOS won't let you pick a folder on your Desktop, give Chrome access in System Settings → Privacy & Security → Files and Folders.

## How to use it

The interface is in Spanish for now. Menu labels are shown in **bold**.

| Where | What you do | What happens |
|---|---|---|
| Any page | Select text → a floating 🔊 appears → click it | Reads the selection |
| Any page | Select → right-click → **🔊 Leer en voz alta** | Reads the selection |
| Any page | Right-click on an empty spot → **🔊 Leer esta página** | Reads the article or main content (skips menus and footers) |
| Claude / ChatGPT / Gemini | 🔊 next to **Copy** on each answer | Reads that whole answer |
| While speaking | The same button turns into ⏹ · right-click → **⏹ Detener lectura** · `⌥⇧S` | Stops |

**Shortcuts:** `⌥⇧R` (Alt+Shift+R) reads the selection. With nothing selected, it reads the latest assistant answer, or the whole page if you're not on an AI site. Press it again to stop. `⌥⇧S` stops. You can change them at `chrome://extensions/shortcuts`.

Before reading, code blocks, buttons, long links and Markdown symbols are removed so it sounds natural.

## Voices

Click the extension icon → **Voz** → ▶ to hear a sample.

- **Automatic** (default): picks the best Spanish voice available. It prefers "Natural", "Premium" or "Enhanced" voices, and Colombian or Mexican Spanish.
- **Chrome on Mac:** uses macOS voices. For better ones, go to System Settings → Accessibility → Spoken Content → System Voice → Manage Voices, download an "Enhanced" or "Premium" voice, and restart Chrome.
- **Microsoft Edge:** includes the "Online (Natural)" neural voices, such as Salomé (Colombia) or Dalia (Mexico). These sound the best.
- Any voice in any language installed on your system can be chosen; the list shows Spanish voices first.

## Settings (in the popup)

- Voice and speed (0.6× to 2×)
- Skip code blocks
- Show the floating 🔊 when selecting text
- Show the 🔊 on Claude, ChatGPT and Gemini answers

Settings sync with your Chrome account.

## Project structure

```
chrome/
├── manifest.json   Permissions (contextMenus, tts, storage), shortcuts and scripts
├── background.js   Service worker: context menu, shortcuts and speech via chrome.tts
├── content.js      On every page: floating 🔊, 🔊 on AI sites and text extraction
├── sitios.js       Selectors for Claude, ChatGPT and Gemini (the only file to touch if they change)
├── limpiar.js      Generated from shared/limpiar.js (don't edit it here)
├── popup.html/js   Toolbar popup: buttons and settings
└── iconos/         16, 32, 48 and 128 px icons
```

No dependencies and no build step: plain JavaScript.

## If the 🔊 doesn't show up on Claude, ChatGPT or Gemini

These sites change their HTML from time to time. To diagnose it:

1. Open a conversation and click the extension icon. At the bottom of the popup you'll see something like `Claude: 🔊 en 4 respuesta(s)` (found 4) or `no encontré dónde poner el 🔊 (copiar: 0, respuestas: 3)` (couldn't find where to put it).
2. Right-click the **Copy** button of an answer → **Inspect**, and look at its `data-testid` or `aria-label`.
3. Update `copiar` (and `respuesta` if needed) in `sitios.js`.
4. In `chrome://extensions`, press ↻ on the extension card and reload the page.

To support another assistant (Perplexity, Copilot…), add an entry with the same fields to `sitios.js`. See [CONTRIBUTING.md](../CONTRIBUTING.md).

## Development

- After editing a file: press ↻ in `chrome://extensions` and reload the tab.
- Service worker console: `chrome://extensions` → the **service worker** link on the card.
- Content script errors show up in the page's normal console (⌥⌘I).
- To publish on the Chrome Web Store: run `npm run build:chrome` from the repo root to get `dist/dilo-chrome-x.y.z.zip`, and upload it from the Developer Dashboard (one-time USD 5 registration fee).

## Limitations

- It doesn't run on internal pages (`chrome://`, the Chrome Web Store) or inside Chrome's PDF viewer. There, right-click → **Leer en voz alta** still works using the plain text Chrome provides.
- Some Google voices cut off on long sentences, so the extension reads text in short chunks; you may notice a brief pause between them.
