const vscode = require('vscode');
const fs = require('fs');
const { Voz } = require('./voz');
const { limpiarMarkdown } = require('./limpiar');
const { sesionMasReciente, ultimaRespuesta, expandir } = require('./claude');

let voz;
let barra;
let ultimoMarkdown; // último documento Markdown activo (para la vista previa)
let vigilante;
let ultimaLeidaId;

function cfg() {
  const c = vscode.workspace.getConfiguration('dilo');
  return {
    motor: c.get('motor'),
    vozSay: c.get('vozSay'),
    velocidadSay: c.get('velocidadSay'),
    vozEdge: c.get('vozEdge'),
    velocidadEdge: c.get('velocidadEdge'),
    rutaEdgeTts: c.get('rutaEdgeTts'),
    omitirCodigo: c.get('omitirCodigo'),
    autoLeerClaude: c.get('autoLeerClaude'),
    carpetaClaude: c.get('carpetaClaude'),
  };
}

async function leer(texto, { markdown = true } = {}) {
  const c = cfg();
  const limpio = markdown ? limpiarMarkdown(texto, { omitirCodigo: c.omitirCodigo }) : texto;
  if (!limpio.trim()) {
    vscode.window.setStatusBarMessage('$(info) No hay texto para leer', 2500);
    return;
  }
  try {
    await voz.hablar(limpio, c);
  } catch (e) {
    const msg = String(e && e.message || e);
    if (c.motor === 'edge-tts' && /ENOENT/.test(msg)) {
      const r = await vscode.window.showErrorMessage(
        'No encontré edge-tts. Instálalo con `pipx install edge-tts` o indica su ruta en los ajustes.',
        'Abrir ajustes', 'Usar voz del sistema');
      if (r === 'Abrir ajustes') vscode.commands.executeCommand('workbench.action.openSettings', 'dilo.rutaEdgeTts');
      if (r === 'Usar voz del sistema') {
        await vscode.workspace.getConfiguration('dilo').update('motor', 'say', vscode.ConfigurationTarget.Global);
        return leer(texto, { markdown });
      }
    } else {
      vscode.window.showErrorMessage(`Dilo: ${msg}`);
    }
  }
}

function esMarkdown(doc) {
  return doc && (doc.languageId === 'markdown' || /\.(md|markdown|mdx)$/i.test(doc.fileName));
}

// ---------- Comandos ----------

async function leerSeleccion() {
  const ed = vscode.window.activeTextEditor;
  if (!ed) return leerUltimaRespuesta();
  const textos = ed.selections.filter((s) => !s.isEmpty).map((s) => ed.document.getText(s));
  if (!textos.length) return leerDocumento();
  return leer(textos.join('\n\n'));
}

// En los webviews (panel de Claude, vista previa Markdown) VS Code no entrega
// la selección: copiamos, leemos el portapapeles y lo restauramos.
async function leerSeleccionWebview() {
  const anterior = await vscode.env.clipboard.readText();
  const marca = `\u200b__leer_voz_${Date.now()}__`;
  await vscode.env.clipboard.writeText(marca);
  try {
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
  } catch { /* algunos webviews no lo exponen */ }

  let texto = '';
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 40));
    texto = await vscode.env.clipboard.readText();
    if (texto !== marca) break;
  }
  await vscode.env.clipboard.writeText(anterior);

  if (!texto || texto === marca) {
    vscode.window.showInformationMessage(
      'No pude obtener la selección de este panel. Cópiala (⌘C) y usa "Leer el portapapeles", o usa "Leer última respuesta de Claude".');
    return;
  }
  return leer(texto);
}

async function leerDocumento(uri) {
  let doc;
  if (uri instanceof vscode.Uri && uri.scheme === 'file') doc = await vscode.workspace.openTextDocument(uri);
  else if (vscode.window.activeTextEditor) doc = vscode.window.activeTextEditor.document;

  // Sin editor de texto activo (p. ej. vista previa Markdown): buscar el fuente
  if (!doc) {
    const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
    const etiqueta = tab && tab.label ? tab.label.replace(/^(Preview|Vista previa)\s+/i, '').trim() : '';
    doc = (etiqueta && vscode.workspace.textDocuments.find((d) => esMarkdown(d) && d.fileName.endsWith(etiqueta)))
      || (ultimoMarkdown && await vscode.workspace.openTextDocument(ultimoMarkdown));
  }
  if (!doc) return vscode.window.showInformationMessage('Abre un archivo para leerlo.');
  return leer(doc.getText(), { markdown: esMarkdown(doc) });
}

function carpetasAbiertas() {
  return (vscode.workspace.workspaceFolders || []).map((f) => f.uri.fsPath);
}

async function leerUltimaRespuesta() {
  const c = cfg();
  const archivo = sesionMasReciente(c.carpetaClaude, carpetasAbiertas());
  if (!archivo) {
    return vscode.window.showInformationMessage(`No encontré sesiones de Claude Code en ${c.carpetaClaude}.`);
  }
  const r = ultimaRespuesta(fs.readFileSync(archivo, 'utf8'));
  if (!r) return vscode.window.showInformationMessage('La sesión más reciente aún no tiene respuesta de Claude.');
  ultimaLeidaId = r.id;
  return leer(r.texto);
}

async function leerPortapapeles() {
  return leer(await vscode.env.clipboard.readText());
}

async function elegirVoz() {
  const c = cfg();
  if (c.motor === 'edge-tts') {
    const voces = [
      'es-CO-SalomeNeural', 'es-CO-GonzaloNeural', 'es-MX-DaliaNeural', 'es-MX-JorgeNeural',
      'es-ES-ElviraNeural', 'es-ES-AlvaroNeural', 'es-AR-ElenaNeural', 'es-US-PalomaNeural',
      'en-US-AriaNeural', 'en-US-GuyNeural',
    ];
    const v = await vscode.window.showQuickPick(voces, { placeHolder: 'Voz de edge-tts' });
    if (v) {
      await vscode.workspace.getConfiguration('dilo').update('vozEdge', v, vscode.ConfigurationTarget.Global);
      leer(`Hola, soy ${v.split('-')[2].replace('Neural', '')}. Así sueno.`, { markdown: false });
    }
    return;
  }
  const voces = await Voz.vocesSay();
  if (!voces.length) return vscode.window.showInformationMessage('No pude listar las voces del sistema.');
  voces.sort((a, b) => (b.idioma.startsWith('es') - a.idioma.startsWith('es')) || a.nombre.localeCompare(b.nombre));
  const v = await vscode.window.showQuickPick(
    [{ label: '(voz del sistema)', nombre: '' }, ...voces.map((x) => ({ label: x.nombre, description: x.idioma, detail: x.ejemplo, nombre: x.nombre }))],
    { placeHolder: 'Elige una voz (las "Mejorada"/"Premium" se descargan en Ajustes > Accesibilidad > Contenido leído)', matchOnDescription: true });
  if (v) {
    await vscode.workspace.getConfiguration('dilo').update('vozSay', v.nombre, vscode.ConfigurationTarget.Global);
    leer('Hola, así suena esta voz.', { markdown: false });
  }
}

// ---------- Lectura automática ----------

function configurarAuto() {
  if (vigilante) { vigilante.close(); vigilante = undefined; }
  const c = cfg();
  if (!c.autoLeerClaude) return;
  const raiz = expandir(c.carpetaClaude);
  if (!fs.existsSync(raiz)) return;

  // Marca como ya leída la respuesta actual para no leer algo viejo al activar
  const actual = sesionMasReciente(c.carpetaClaude, carpetasAbiertas());
  if (actual) {
    const r = ultimaRespuesta(fs.readFileSync(actual, 'utf8'));
    if (r) ultimaLeidaId = r.id;
  }

  let temporizador;
  try {
    vigilante = fs.watch(raiz, { recursive: true }, (_ev, nombre) => {
      if (!nombre || !String(nombre).endsWith('.jsonl')) return;
      clearTimeout(temporizador);
      temporizador = setTimeout(revisarAuto, 1200);
    });
  } catch (e) {
    vscode.window.showWarningMessage(`Dilo: no pude vigilar ${raiz} (${e.message}).`);
  }
}

function revisarAuto() {
  const c = cfg();
  const archivo = sesionMasReciente(c.carpetaClaude, carpetasAbiertas());
  if (!archivo) return;
  const r = ultimaRespuesta(fs.readFileSync(archivo, 'utf8'), { soloFinal: true });
  if (!r || r.id === ultimaLeidaId) return;
  ultimaLeidaId = r.id;
  leer(r.texto);
}

async function toggleAuto() {
  const conf = vscode.workspace.getConfiguration('dilo');
  const nuevo = !conf.get('autoLeerClaude');
  await conf.update('autoLeerClaude', nuevo, vscode.ConfigurationTarget.Global);
  vscode.window.setStatusBarMessage(nuevo ? '$(unmute) Lectura automática de Claude activada' : '$(mute) Lectura automática desactivada', 3000);
}

// ---------- Activación ----------

function activate(context) {
  barra = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
  barra.command = 'dilo.detener';

  const pintarBarra = (hablando) => {
    vscode.commands.executeCommand('setContext', 'dilo.hablando', hablando);
    if (hablando) {
      barra.text = '$(debug-stop) Detener lectura';
      barra.tooltip = 'Detener lectura (⌘⌥.)';
      barra.command = 'dilo.detener';
      barra.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      barra.text = cfg().autoLeerClaude ? '$(unmute) Auto' : '$(unmute)';
      barra.tooltip = 'Leer última respuesta de Claude (⌘⌥L)';
      barra.command = 'dilo.leerUltimaRespuesta';
      barra.backgroundColor = undefined;
    }
    barra.show();
  };

  voz = new Voz(pintarBarra);
  pintarBarra(false);

  const reg = (id, fn) => context.subscriptions.push(vscode.commands.registerCommand(id, fn));
  reg('dilo.leerSeleccion', leerSeleccion);
  reg('dilo.leerSeleccionWebview', leerSeleccionWebview);
  reg('dilo.leerDocumento', leerDocumento);
  reg('dilo.leerUltimaRespuesta', leerUltimaRespuesta);
  reg('dilo.leerPortapapeles', leerPortapapeles);
  reg('dilo.detener', () => voz.detener());
  reg('dilo.toggleAuto', toggleAuto);
  reg('dilo.elegirVoz', elegirVoz);

  const recordarMd = (ed) => { if (ed && esMarkdown(ed.document)) ultimoMarkdown = ed.document.uri; };
  recordarMd(vscode.window.activeTextEditor);
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(recordarMd),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('dilo.autoLeerClaude') || e.affectsConfiguration('dilo.carpetaClaude')) {
        configurarAuto();
        pintarBarra(voz.hablando);
      }
    }),
    barra,
    { dispose: () => { voz.detener(); if (vigilante) vigilante.close(); } },
  );

  configurarAuto();
}

function deactivate() {
  if (voz) voz.detener();
  if (vigilante) vigilante.close();
}

module.exports = { activate, deactivate };
