# Contributing to Dilo · Cómo contribuir

¡Gracias por querer ayudar! Issues and pull requests are welcome in English or Spanish.

## Getting started · Para empezar

```bash
git clone https://github.com/chundo/dilo.git
cd dilo
npm test
```

There are no dependencies to install. Node.js 18+ is enough.

## Where things live · Dónde está cada cosa

| You want to… | Edit |
|---|---|
| Change how text is cleaned before reading | `shared/limpiar.js`, then run `npm run sync` |
| Fix the 🔊 on Claude / ChatGPT / Gemini, or add a new AI site | `chrome/sitios.js` |
| Change browser behaviour (floating button, page reading) | `chrome/content.js` |
| Change voices or the context menu in the browser | `chrome/background.js` |
| Change VS Code commands, menus or settings | `vscode/package.json`, `vscode/src/extension.js` |
| Change how VS Code finds the latest Claude Code answer | `vscode/src/claude.js` |

> ⚠️ `vscode/src/limpiar.js` and `chrome/limpiar.js` are generated. Edit `shared/limpiar.js` and run `npm run sync`. CI fails if they are out of sync.

## Adding an AI site · Agregar un sitio de IA

Add an entry to `chrome/sitios.js`:

```js
{
  nombre: 'Perplexity',
  host: /(^|\.)perplexity\.ai$/,
  copiar: 'button[aria-label="Copy"]',   // the Copy button of each answer
  turno: '.answer-container',             // optional: one answer + its toolbar
  respuesta: '.prose',                    // element containing the answer text
  omitir: '.citation',                    // optional: parts that shouldn't be read
}
```

Find the selectors with right-click on the **Copy** button → **Inspect**. Prefer `data-testid` or `aria-label` over CSS classes, because generated class names change often. Then press ↻ on the extension card in `chrome://extensions`, reload the page, and click the extension icon: the popup shows how many buttons it found.

## Tests · Pruebas

- `npm test` runs the unit tests in `tests/`.
- Add a test when you change `shared/limpiar.js` or `vscode/src/claude.js`.
- Before opening a PR, run both extensions by hand at least once (F5 in `vscode/`, and **Load unpacked** for `chrome/`).

## Translations · Traducciones

The UI is in Spanish. If you'd like to add English or another language, open an issue first so we can agree on the approach. The Chrome extension would use `_locales/` and the VS Code extension would use `package.nls.json`.

## Pull requests

- Keep PRs focused: one fix or feature per PR.
- Describe what you tested and on which OS and browser.
- Bump `version` in `vscode/package.json` and/or `chrome/manifest.json` only when preparing a release.

## Releases (maintainers)

```bash
npm run build                       # dist/dilo-x.y.z.vsix + dist/dilo-chrome-x.y.z.zip
gh release create vX.Y.Z dist/* --generate-notes
```
