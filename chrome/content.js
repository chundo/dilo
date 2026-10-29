// Dilo — content script: botón flotante al seleccionar, 🔊 en las respuestas
// de Claude/ChatGPT/Gemini y extracción de texto de la página.
(() => {
  if (window.__diloCargado) return;
  window.__diloCargado = true;

  const ICONO_VOZ = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>`;
  const ICONO_STOP = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

  let cfg = { omitirCodigo: true, botonFlotante: true, botonesIA: true };
  let estado = { hablando: false, origen: null };
  let sondeo = null;
  const sitio = (globalThis.DILO_SITIOS || []).find((s) => s.host.test(location.hostname));

  chrome.storage.sync.get(cfg, (v) => { cfg = { ...cfg, ...v }; iniciarIA(); });
  chrome.storage.onChanged.addListener((cambios) => {
    for (const [k, { newValue }] of Object.entries(cambios)) cfg[k] = newValue;
    if (!cfg.botonFlotante) ocultarFlotante();
    if ('botonesIA' in cambios) cfg.botonesIA ? iniciarIA() : quitarBotonesIA();
  });

  const enviar = (msg) => chrome.runtime.sendMessage(msg).catch(() => {});
  const hablar = (texto, origen) => texto && texto.trim() && enviar({ tipo: 'hablar', texto, origen });
  const detener = () => enviar({ tipo: 'detener' });

  // ---------- Texto legible de un nodo ----------

  const SALTAR = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'svg', 'BUTTON', 'TEXTAREA',
    'INPUT', 'SELECT', 'OPTION', 'IFRAME', 'CANVAS', 'VIDEO', 'AUDIO', 'IMG', 'MATH']);
  const BLOQUE = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'TR', 'TABLE', 'BLOCKQUOTE', 'SECTION', 'ARTICLE',
    'HEADER', 'FOOTER', 'MAIN', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'HR', 'BR', 'DETAILS', 'SUMMARY']);
  const TITULO = /^H[1-6]$/;

  function textoDeNodo(raiz, { omitir = '', modoPagina = false } = {}) {
    const partes = [];
    const visitar = (n) => {
      if (n.nodeType === Node.TEXT_NODE) { partes.push(n.nodeValue.replace(/\s+/g, ' ')); return; }
      if (n.nodeType !== Node.ELEMENT_NODE && n.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
      const el = n;
      if (el.nodeType === Node.ELEMENT_NODE) {
        const tag = el.tagName;
        if (SALTAR.has(tag) || el.hidden || el.getAttribute('aria-hidden') === 'true') return;
        if (el.dataset && (el.dataset.diloBoton || el.id === 'dilo-flotante')) return;
        if (omitir && el.matches && el.matches(omitir)) return;
        if (modoPagina && /^(NAV|ASIDE|FOOTER|FORM)$/.test(tag)) return;
        if (modoPagina && /^(navigation|banner|contentinfo|complementary|dialog)$/.test(el.getAttribute('role') || '')) return;
        if (el.isConnected && el.getClientRects && el.getClientRects().length === 0 && tag !== 'BR' && !el.closest('details')) {
          // Elemento conectado pero invisible (display:none)
          if (getComputedStyle(el).display === 'none') return;
        }
        if (tag === 'PRE') {
          partes.push(cfg.omitirCodigo ? '\nBloque de código omitido.\n' : `\n${el.textContent}\n`);
          return;
        }
        if (tag === 'BR') { partes.push('\n'); return; }
        const esBloque = BLOQUE.has(tag) || TITULO.test(tag);
        if (esBloque) partes.push('\n');
        el.childNodes.forEach(visitar);
        if (TITULO.test(tag)) partes.push('.');
        if (tag === 'TD' || tag === 'TH') partes.push(', ');
        if (esBloque) partes.push('\n');
        return;
      }
      n.childNodes.forEach(visitar);
    };
    visitar(raiz);
    return partes.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function textoSeleccion() {
    const a = document.activeElement;
    if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|url|email)?$/i.test(a.type)))) {
      const t = a.value.slice(a.selectionStart || 0, a.selectionEnd || 0);
      if (t.trim()) return t;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
    const cont = document.createElement('div');
    for (let i = 0; i < sel.rangeCount; i++) cont.appendChild(sel.getRangeAt(i).cloneContents());
    const t = textoDeNodo(cont);
    return t || sel.toString();
  }

  function textoPagina() {
    const raiz = document.querySelector('article') || document.querySelector('main, [role="main"]') || document.body;
    return textoDeNodo(raiz, { modoPagina: true });
  }

  // ---------- Botón flotante al seleccionar ----------

  let flotante, botonFlotante;

  function crearFlotante() {
    if (flotante) return;
    flotante = document.createElement('div');
    flotante.id = 'dilo-flotante';
    flotante.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;display:none;';
    const sombra = flotante.attachShadow({ mode: 'closed' });
    sombra.innerHTML = `<style>
      button{all:initial;box-sizing:border-box;width:32px;height:32px;border-radius:50%;cursor:pointer;
        display:flex;align-items:center;justify-content:center;background:#1f2937;color:#fff;
        box-shadow:0 2px 8px rgba(0,0,0,.25);transition:transform .12s ease,background .12s ease}
      button:hover{transform:scale(1.08);background:#111827}
      button.activo{background:#d97706}
      @media (prefers-color-scheme: dark){button{background:#f3f4f6;color:#111827}button:hover{background:#fff}button.activo{background:#f59e0b;color:#111827}}
    </style><button type="button" title="Leer en voz alta" aria-label="Leer en voz alta">${ICONO_VOZ(16)}</button>`;
    botonFlotante = sombra.querySelector('button');
    botonFlotante.addEventListener('mousedown', (e) => e.preventDefault()); // no perder la selección
    botonFlotante.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (estado.hablando && estado.origen === 'flotante') return detener();
      hablar(textoSeleccion(), 'flotante');
    });
    document.documentElement.appendChild(flotante);
  }

  function ocultarFlotante() {
    if (flotante && !(estado.hablando && estado.origen === 'flotante')) flotante.style.display = 'none';
  }

  function mostrarFlotante() {
    if (!cfg.botonFlotante) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return ocultarFlotante();
    if (sel.toString().trim().length < 3) return ocultarFlotante();
    const rects = sel.getRangeAt(sel.rangeCount - 1).getClientRects();
    const r = rects[rects.length - 1] || sel.getRangeAt(0).getBoundingClientRect();
    if (!r || (!r.width && !r.height)) return ocultarFlotante();
    crearFlotante();
    const x = Math.min(window.innerWidth - 40, Math.max(4, r.right + 6));
    let y = r.bottom + 6;
    if (y > window.innerHeight - 40) y = Math.max(4, r.top - 38);
    flotante.style.left = `${x}px`;
    flotante.style.top = `${y}px`;
    flotante.style.display = 'block';
  }

  let tSel;
  const programar = () => { clearTimeout(tSel); tSel = setTimeout(mostrarFlotante, 120); };
  document.addEventListener('mouseup', (e) => { if (e.target !== flotante) programar(); }, true);
  document.addEventListener('keyup', (e) => { if (e.shiftKey || e.key === 'Shift' || (e.key === 'a' && (e.metaKey || e.ctrlKey))) programar(); }, true);
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) ocultarFlotante();
  });
  window.addEventListener('scroll', ocultarFlotante, { passive: true, capture: true });

  // ---------- 🔊 en las respuestas de los asistentes ----------

  let contador = 0;
  const copiaDe = new Map(); // id del botón → botón "Copiar"
  let observador;

  function mensajeDe(copiar) {
    if (!sitio) return null;
    if (sitio.turno) {
      const t = copiar.closest(sitio.turno);
      if (t) {
        const els = t.querySelectorAll(sitio.respuesta);
        return els.length ? els[els.length - 1] : null;
      }
    }
    let el = copiar.parentElement;
    for (let i = 0; el && i < 12; i++, el = el.parentElement) {
      if (el.matches(sitio.respuesta)) return el;
      const els = el.querySelectorAll(sitio.respuesta);
      if (els.length) return els[els.length - 1];
    }
    return null;
  }

  // El botón "Copiar" suele estar envuelto en contenedores de tooltip: insertamos
  // después del envoltorio más externo que solo contiene ese botón.
  function anclaDe(copiar) {
    let a = copiar;
    for (let i = 0; i < 3 && a.parentElement && a.parentElement.children.length === 1; i++) a = a.parentElement;
    return a;
  }

  function crearBotonIA(copiar) {
    const id = `ia-${++contador}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = copiar.className;
    b.dataset.diloBoton = id;
    b.title = 'Leer en voz alta';
    b.setAttribute('aria-label', 'Leer en voz alta');
    const svg = copiar.querySelector('svg');
    const t = Math.round((svg && svg.getBoundingClientRect().width) || 18) || 18;
    b.dataset.tam = t;
    b.innerHTML = ICONO_VOZ(t);
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (estado.hablando && estado.origen === id) return detener();
      const msj = mensajeDe(copiaDe.get(id) || copiar);
      if (msj) hablar(textoDeNodo(msj, { omitir: sitio.omitir }), id);
    });
    copiaDe.set(id, copiar);
    return b;
  }

  function escanear() {
    if (!sitio || !cfg.botonesIA) return;
    document.querySelectorAll(sitio.copiar).forEach((copiar) => {
      if (copiar.dataset.diloBoton) return;
      if (copiar.closest(sitio.respuesta) || copiar.closest('pre')) return; // copiar de un bloque de código
      const ancla = anclaDe(copiar);
      const sig = ancla.nextElementSibling;
      if (sig && sig.dataset && sig.dataset.diloBoton) return;
      if (!mensajeDe(copiar)) return; // p. ej. botón copiar de un mensaje del usuario
      ancla.insertAdjacentElement('afterend', crearBotonIA(copiar));
    });
    pintar();
  }

  function iniciarIA() {
    if (!sitio || !cfg.botonesIA || observador) return;
    let pendiente = false;
    observador = new MutationObserver(() => {
      if (pendiente) return;
      pendiente = true;
      setTimeout(() => { pendiente = false; escanear(); }, 250);
    });
    observador.observe(document.body, { childList: true, subtree: true });
    escanear();
  }

  function quitarBotonesIA() {
    if (observador) { observador.disconnect(); observador = undefined; }
    document.querySelectorAll('[data-dilo-boton]').forEach((b) => b.remove());
    copiaDe.clear();
  }

  function ultimaRespuesta() {
    if (!sitio) return null;
    const els = document.querySelectorAll(sitio.respuesta);
    const el = els[els.length - 1];
    if (!el) return null;
    let origen = null;
    for (const [id, copiar] of copiaDe) if (copiar.isConnected && mensajeDe(copiar) === el) origen = id;
    return { texto: textoDeNodo(el, { omitir: sitio.omitir }), origen };
  }

  // ---------- Estado (iconos ▶/⏹) ----------

  function pintar() {
    document.querySelectorAll('button[data-dilo-boton]').forEach((b) => {
      const activo = estado.hablando && estado.origen === b.dataset.diloBoton;
      const t = Number(b.dataset.tam) || 18;
      const html = activo ? ICONO_STOP(t) : ICONO_VOZ(t);
      if (b.dataset.icono !== (activo ? 'stop' : 'voz')) {
        b.innerHTML = html;
        b.dataset.icono = activo ? 'stop' : 'voz';
        b.title = activo ? 'Detener lectura' : 'Leer en voz alta';
      }
    });
    if (botonFlotante) {
      const activo = estado.hablando && estado.origen === 'flotante';
      botonFlotante.classList.toggle('activo', activo);
      botonFlotante.innerHTML = activo ? ICONO_STOP(14) : ICONO_VOZ(16);
      botonFlotante.title = activo ? 'Detener lectura' : 'Leer en voz alta';
      if (!activo && window.getSelection().isCollapsed) ocultarFlotante();
    }
  }

  function actualizarEstado(nuevo) {
    estado = nuevo;
    pintar();
    clearInterval(sondeo);
    if (estado.hablando) {
      sondeo = setInterval(async () => {
        const r = await chrome.runtime.sendMessage({ tipo: 'consultar' }).catch(() => null);
        if (!r || !r.hablando) actualizarEstado({ hablando: false, origen: null });
      }, 4000);
    }
  }

  // ---------- Mensajes del service worker ----------

  chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
    switch (msg.tipo) {
      case 'estado':
        actualizarEstado({ hablando: msg.hablando, origen: msg.hablando ? msg.origen : null });
        break;
      case 'obtenerSeleccion':
        responder({ texto: textoSeleccion() });
        break;
      case 'obtenerPagina':
        responder({ texto: textoPagina() });
        break;
      case 'diagnostico':
        responder(sitio ? {
          sitio: sitio.nombre,
          copiar: document.querySelectorAll(sitio.copiar).length,
          respuestas: document.querySelectorAll(sitio.respuesta).length,
          botones: document.querySelectorAll('button[data-dilo-boton]').length,
        } : { sitio: null });
        break;
      case 'obtenerParaAtajo': {
        const sel = textoSeleccion();
        if (sel.trim()) { responder({ texto: sel, origen: 'flotante' }); break; }
        const r = ultimaRespuesta();
        responder(r && r.texto ? r : { texto: textoPagina() });
        break;
      }
    }
  });

  // Para pruebas desde la consola
  window.__dilo = { textoDeNodo, textoSeleccion, textoPagina, ultimaRespuesta, escanear, sitio };
})();
