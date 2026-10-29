// Dilo — service worker: menú del clic derecho, atajos y voz (chrome.tts).

importScripts('limpiar.js'); // define limpiarMarkdown()

const AJUSTES_POR_DEFECTO = {
  voz: '',            // '' = elegir automáticamente una voz en español
  velocidad: 1.1,
  tono: 1.0,
  omitirCodigo: true,
  botonFlotante: true,
  botonesIA: true,
};

async function ajustes() {
  return { ...AJUSTES_POR_DEFECTO, ...(await chrome.storage.sync.get(AJUSTES_POR_DEFECTO)) };
}

// ---------- Voces ----------

function obtenerVoces() {
  return new Promise((r) => chrome.tts.getVoices((v) => r(v || [])));
}

function puntuarVoz(v) {
  const n = `${v.voiceName} ${v.lang}`;
  let p = 0;
  if (/^es/i.test(v.lang || '')) p += 100;
  if (/natural|online|neural/i.test(n)) p += 8;
  if (/premium|mejorada|enhanced|siri/i.test(n)) p += 6;
  if (/es[-_]CO/i.test(v.lang || '')) p += 4;
  if (/es[-_](MX|US|419)/i.test(v.lang || '')) p += 3;
  if (/google/i.test(n)) p += 2;
  if (!v.remote) p += 1;
  return p;
}

async function vozElegida(cfg) {
  const voces = await obtenerVoces();
  if (cfg.voz && voces.some((v) => v.voiceName === cfg.voz)) return voces.find((v) => v.voiceName === cfg.voz);
  return voces.slice().sort((a, b) => puntuarVoz(b) - puntuarVoz(a))[0];
}

// ---------- Partir el texto ----------
// Las voces de Google se cortan si una frase dura más de ~15 s: leemos por trozos cortos.
function partir(texto, max = 220) {
  const piezas = texto.split(/(?<=[.!?…:;])\s+|\n+/).filter((s) => s.trim());
  const out = [];
  let actual = '';
  for (let p of piezas) {
    while (p.length > max) {
      const corte = p.lastIndexOf(' ', max) > max * 0.5 ? p.lastIndexOf(' ', max) : max;
      if (actual) { out.push(actual); actual = ''; }
      out.push(p.slice(0, corte));
      p = p.slice(corte).trim();
    }
    if (actual && (actual + ' ' + p).length > max) { out.push(actual); actual = p; }
    else actual = actual ? `${actual} ${p}` : p;
  }
  if (actual.trim()) out.push(actual);
  return out;
}

// ---------- Estado ----------

let turno = 0;
let activo = null; // { tabId, origen }

function avisar(hablando) {
  chrome.contextMenus.update('detener', { visible: hablando }, () => void chrome.runtime.lastError);
  chrome.action.setBadgeText({ text: hablando ? '▶' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#d97706' });
  if (activo && activo.tabId != null) {
    chrome.tabs.sendMessage(activo.tabId, { tipo: 'estado', hablando, origen: activo.origen })
      .catch(() => {});
  }
  chrome.runtime.sendMessage({ tipo: 'estado', hablando }).catch(() => {}); // popup
  if (!hablando) activo = null;
}

function detener() {
  turno++;
  chrome.tts.stop();
  if (activo) avisar(false);
}

async function hablar(texto, { tabId = null, origen = null, limpiar = true } = {}) {
  detener();
  const miTurno = turno;
  const cfg = await ajustes();
  const limpio = limpiar ? limpiarMarkdown(texto, { omitirCodigo: cfg.omitirCodigo }) : String(texto || '').trim();
  if (!limpio) return;

  const voz = await vozElegida(cfg);
  if (miTurno !== turno) return;
  const trozos = partir(limpio);
  activo = { tabId, origen };
  avisar(true);

  trozos.forEach((trozo, i) => {
    const ultimo = i === trozos.length - 1;
    chrome.tts.speak(trozo, {
      enqueue: true,
      voiceName: voz ? voz.voiceName : undefined,
      lang: voz ? voz.lang : 'es-ES',
      rate: cfg.velocidad,
      pitch: cfg.tono,
      onEvent: (e) => {
        if (miTurno !== turno) return;
        if (e.type === 'error') {
          console.warn('[Dilo] error de voz:', e.errorMessage);
          if (ultimo || /voice/i.test(e.errorMessage || '')) avisar(false);
        }
        if (ultimo && (e.type === 'end' || e.type === 'interrupted' || e.type === 'cancelled')) avisar(false);
      },
    });
  });
}

// ---------- Menú del clic derecho ----------

function crearMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'leer-seleccion', title: '🔊 Leer en voz alta', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'leer-pagina', title: '🔊 Leer esta página', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'detener', title: '⏹ Detener lectura', contexts: ['all'], visible: false });
  });
}
chrome.runtime.onInstalled.addListener(crearMenus);
chrome.runtime.onStartup.addListener(crearMenus);

async function pedirAlTab(tabId, mensaje) {
  try { return await chrome.tabs.sendMessage(tabId, mensaje); } catch { return null; }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab && tab.id;
  if (info.menuItemId === 'detener') return detener();
  if (info.menuItemId === 'leer-seleccion') {
    // El content script conserva los saltos de línea y salta el código; si no responde
    // (PDF, páginas chrome://), usamos el texto plano que da Chrome.
    const r = await pedirAlTab(tabId, { tipo: 'obtenerSeleccion' });
    return hablar((r && r.texto) || info.selectionText || '', { tabId });
  }
  if (info.menuItemId === 'leer-pagina') {
    const r = await pedirAlTab(tabId, { tipo: 'obtenerPagina' });
    if (r && r.texto) return hablar(r.texto, { tabId });
  }
});

// ---------- Atajos de teclado ----------

chrome.commands.onCommand.addListener(async (comando, tab) => {
  if (comando === 'detener') return detener();
  if (comando === 'leer-seleccion' && tab) {
    if (activo) return detener(); // el mismo atajo alterna
    const r = await pedirAlTab(tab.id, { tipo: 'obtenerParaAtajo' });
    if (r && r.texto) hablar(r.texto, { tabId: tab.id, origen: r.origen || null });
  }
});

// ---------- Mensajes del content script y del popup ----------

chrome.runtime.onMessage.addListener((msg, sender, responder) => {
  const tabId = sender.tab ? sender.tab.id : msg.tabId ?? null;
  switch (msg.tipo) {
    case 'hablar':
      hablar(msg.texto, { tabId, origen: msg.origen || null, limpiar: msg.limpiar !== false });
      responder({ ok: true });
      break;
    case 'detener':
      detener();
      responder({ ok: true });
      break;
    case 'consultar':
      // El content script pregunta mientras suena: mantiene vivo el service worker
      // y corrige el estado si se perdió el evento de fin.
      chrome.tts.isSpeaking((s) => {
        if (!s && activo) avisar(false);
        responder({ hablando: !!s, origen: activo && activo.origen });
      });
      return true;
    case 'voces':
      obtenerVoces().then(async (v) => {
        const cfg = await ajustes();
        const elegida = await vozElegida(cfg);
        responder({ voces: v, elegida: elegida && elegida.voiceName });
      });
      return true;
    case 'probarVoz':
      hablar(msg.texto || 'Hola, así suena esta voz.', { tabId: null, limpiar: false });
      responder({ ok: true });
      break;
  }
});
