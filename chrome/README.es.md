# Dilo para Chrome

<p><a href="README.md">English</a> · <b>Español</b></p>

Escucha en lugar de leer: texto seleccionado, páginas completas y las respuestas de **Claude, ChatGPT y Gemini**, con un 🔊 junto al botón de copiar de cada respuesta.

Funciona en Chrome, Edge, Brave y Arc.

> Parte del proyecto [Dilo](https://github.com/chundo/dilo/blob/main/README.es.md), que también tiene una extensión para VS Code.

## Instalación (2 minutos, sin Chrome Web Store)

1. Abre `chrome://extensions` (en Edge: `edge://extensions`).
2. Activa **Modo de desarrollador** (arriba a la derecha).
3. Clic en **Cargar descomprimida** y elige la carpeta `chrome/` del repositorio (o descomprime `dilo-chrome-x.y.z.zip` de [Releases](https://github.com/chundo/dilo/releases)).
4. Fija el ícono 🔊 en la barra con la chincheta del menú de extensiones.
5. Recarga las pestañas que ya tenías abiertas para que la extensión funcione en ellas.

> Si macOS no te deja elegir la carpeta del Escritorio, dale permiso a Chrome en Ajustes del Sistema → Privacidad y seguridad → Archivos y carpetas.

## Cómo se usa

| Dónde | Qué haces | Qué pasa |
|---|---|---|
| Cualquier página | Seleccionas texto → aparece un 🔊 flotante → clic | Lee la selección |
| Cualquier página | Seleccionas → clic derecho → **🔊 Leer en voz alta** | Lee la selección |
| Cualquier página | Clic derecho en un espacio vacío → **🔊 Leer esta página** | Lee el artículo o contenido principal (sin menús ni pie de página) |
| Claude / ChatGPT / Gemini | 🔊 junto a **Copiar** en cada respuesta | Lee esa respuesta completa |
| Mientras habla | El mismo botón cambia a ⏹ · clic derecho → **⏹ Detener** · `⌥⇧S` | Detiene |

**Atajos:** `⌥⇧R` (Alt+Shift+R) lee la selección; si no hay selección, lee la última respuesta del asistente o, si no estás en un asistente, la página completa. Pulsarlo otra vez detiene la lectura. `⌥⇧S` detiene. Puedes cambiarlos en `chrome://extensions/shortcuts`.

Antes de leer se quitan los bloques de código, los botones, los enlaces largos y los símbolos de Markdown para que suene natural.

## Voces

Clic en el ícono de la extensión → **Voz** → ▶ para escuchar una muestra.

- **Automática** (por defecto): elige la mejor voz en español disponible. Prefiere las "Natural", "Premium" o "Mejorada" y el español de Colombia o de México.
- **Chrome en Mac:** usa las voces de macOS. Para tener voces mejores, ve a Ajustes del Sistema → Accesibilidad → Contenido leído → Voz del sistema → Gestionar voces y descarga **Paulina (Mejorada)**, **Mónica (Mejorada)** u otra. Después reinicia Chrome.
- **Microsoft Edge:** trae las voces neuronales "Online (Natural)", como Salomé (Colombia) o Dalia (México). Son las de mejor calidad.

## Ajustes (en el popup)

- Voz y velocidad (0,6× a 2×)
- Saltar bloques de código
- Mostrar el 🔊 flotante al seleccionar texto
- Mostrar el 🔊 en las respuestas de Claude, ChatGPT y Gemini

Los ajustes se sincronizan con tu cuenta de Chrome.

## Estructura del proyecto

```
chrome/
├── manifest.json   Permisos (contextMenus, tts, storage), atajos y scripts
├── background.js   Service worker: menú del clic derecho, atajos y voz con chrome.tts
├── content.js      En cada página: 🔊 flotante, 🔊 en asistentes y extracción del texto
├── sitios.js       Selectores de Claude, ChatGPT y Gemini (lo único que hay que tocar si cambian)
├── limpiar.js      Generado desde shared/limpiar.js (no lo edites aquí)
├── popup.html/js   Ventana del ícono: botones y ajustes
└── iconos/         16, 32, 48 y 128 px
```

No tiene dependencias ni paso de compilación: es JavaScript plano.

## Si el 🔊 no aparece en Claude, ChatGPT o Gemini

Estos sitios cambian su HTML de vez en cuando. Para diagnosticarlo:

1. Abre una conversación y haz clic en el ícono de la extensión. Abajo del popup verás algo como `Claude: 🔊 en 4 respuesta(s)` o `no encontré dónde poner el 🔊 (copiar: 0, respuestas: 3)`.
2. Haz clic derecho sobre el botón **Copiar** de una respuesta → **Inspeccionar**, y fíjate en su `data-testid` o su `aria-label`.
3. Actualiza `copiar` (y si hace falta `respuesta`) en `sitios.js`.
4. En `chrome://extensions`, pulsa ↻ en la tarjeta de la extensión y recarga la página.

Para agregar otro asistente (Perplexity, Copilot…), añade una entrada a `sitios.js` con los mismos campos.

## Desarrollo

- Después de editar un archivo: ↻ en `chrome://extensions` y recarga la pestaña.
- Consola del service worker: `chrome://extensions` → enlace **service worker** de la tarjeta.
- Los errores del content script salen en la consola normal de la página (⌥⌘I).
- Para publicarla en la Chrome Web Store: `npm run build:chrome` en la raíz genera `dist/dilo-chrome-x.y.z.zip`, que se sube desde el Developer Dashboard (el registro cuesta USD 5 una sola vez).

## Limitaciones

- No funciona en páginas internas (`chrome://`, Chrome Web Store) ni en el visor de PDF de Chrome. En esos casos, el clic derecho **Leer en voz alta** sigue funcionando con el texto plano que entrega Chrome.
- Algunas voces de Google se cortan en frases largas. Por eso la extensión lee el texto en trozos cortos, y entre trozos puede notarse una pausa breve.
