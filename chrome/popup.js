const POR_DEFECTO = { voz: '', velocidad: 1.1, tono: 1.0, omitirCodigo: true, botonFlotante: true, botonesIA: true };
const $ = (id) => document.getElementById(id);

async function tabActiva() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function pedir(tab, mensaje) {
  try { return await chrome.tabs.sendMessage(tab.id, mensaje); } catch { return null; }
}

function etiquetaVoz(v) {
  const extra = [v.lang, v.remote ? 'en línea' : null].filter(Boolean).join(' · ');
  return `${v.voiceName}${extra ? ` (${extra})` : ''}`;
}

async function cargar() {
  const cfg = await chrome.storage.sync.get(POR_DEFECTO);

  // Voces: primero las de español
  const { voces = [], elegida } = await chrome.runtime.sendMessage({ tipo: 'voces' });
  const es = voces.filter((v) => /^es/i.test(v.lang || ''));
  const otras = voces.filter((v) => !/^es/i.test(v.lang || ''));
  const sel = $('voz');
  sel.innerHTML = '';
  sel.append(new Option(`Automática${elegida ? ` — ${elegida}` : ''}`, ''));
  const grupo = (nombre, lista) => {
    if (!lista.length) return;
    const g = document.createElement('optgroup');
    g.label = nombre;
    lista.sort((a, b) => a.voiceName.localeCompare(b.voiceName)).forEach((v) => g.append(new Option(etiquetaVoz(v), v.voiceName)));
    sel.append(g);
  };
  grupo('Español', es);
  grupo('Otros idiomas', otras);
  sel.value = cfg.voz;

  $('velocidad').value = cfg.velocidad;
  $('velocidadValor').textContent = `${Number(cfg.velocidad).toFixed(2)}×`;
  for (const k of ['omitirCodigo', 'botonFlotante', 'botonesIA']) $(k).checked = cfg[k];

  const tab = await tabActiva();
  const d = tab && await pedir(tab, { tipo: 'diagnostico' });
  if (d && d.sitio) {
    $('diagnostico').textContent = d.botones
      ? `${d.sitio}: 🔊 en ${d.botones} respuesta(s).`
      : `${d.sitio}: no encontré dónde poner el 🔊 (copiar: ${d.copiar}, respuestas: ${d.respuestas}). Revisa sitios.js.`;
  }

  const r = await chrome.runtime.sendMessage({ tipo: 'consultar' }).catch(() => null);
  document.body.classList.toggle('hablando', !!(r && r.hablando));
}

$('voz').addEventListener('change', (e) => chrome.storage.sync.set({ voz: e.target.value }));
$('velocidad').addEventListener('input', (e) => {
  $('velocidadValor').textContent = `${Number(e.target.value).toFixed(2)}×`;
});
$('velocidad').addEventListener('change', (e) => chrome.storage.sync.set({ velocidad: Number(e.target.value) }));
for (const k of ['omitirCodigo', 'botonFlotante', 'botonesIA']) {
  $(k).addEventListener('change', (e) => chrome.storage.sync.set({ [k]: e.target.checked }));
}

$('probar').addEventListener('click', () =>
  chrome.runtime.sendMessage({ tipo: 'probarVoz', texto: 'Hola, así suena esta voz leyendo tus respuestas.' }));

$('leerSeleccion').addEventListener('click', async () => {
  const tab = await tabActiva();
  const r = await pedir(tab, { tipo: 'obtenerParaAtajo' });
  if (r && r.texto) chrome.runtime.sendMessage({ tipo: 'hablar', texto: r.texto, origen: r.origen, tabId: tab.id });
});

$('leerPagina').addEventListener('click', async () => {
  const tab = await tabActiva();
  const r = await pedir(tab, { tipo: 'obtenerPagina' });
  if (r && r.texto) chrome.runtime.sendMessage({ tipo: 'hablar', texto: r.texto, tabId: tab.id });
});

$('detener').addEventListener('click', () => chrome.runtime.sendMessage({ tipo: 'detener' }));

$('atajos').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === 'estado') document.body.classList.toggle('hablando', msg.hablando);
});

cargar();
