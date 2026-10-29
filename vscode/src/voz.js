// Motores de texto a voz: `say` (macOS) y edge-tts.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { expandir } = require('./claude');

class Voz {
  constructor(onCambio) {
    this.procesos = [];
    this.temporales = [];
    this.hablando = false;
    this.onCambio = onCambio || (() => {});
    this.turno = 0;
  }

  _estado(v) {
    if (this.hablando !== v) { this.hablando = v; this.onCambio(v); }
  }

  _tmp(ext) {
    const p = path.join(os.tmpdir(), `dilo-${process.pid}-${Date.now()}${ext}`);
    this.temporales.push(p);
    return p;
  }

  _limpiarTemporales() {
    for (const p of this.temporales.splice(0)) fs.rm(p, { force: true }, () => {});
  }

  _correr(cmd, args, turno) {
    return new Promise((resolve, reject) => {
      if (turno !== this.turno) return resolve(false);
      const p = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      p.stderr.on('data', (d) => (err += d));
      this.procesos.push(p);
      p.on('error', (e) => reject(e));
      p.on('close', (code, signal) => {
        this.procesos = this.procesos.filter((x) => x !== p);
        if (signal || turno !== this.turno) return resolve(false);
        code === 0 ? resolve(true) : reject(new Error(err.trim() || `${cmd} salió con código ${code}`));
      });
    });
  }

  detener() {
    this.turno++;
    for (const p of this.procesos.splice(0)) { try { p.kill('SIGTERM'); } catch { /* */ } }
    this._limpiarTemporales();
    this._estado(false);
  }

  async hablar(texto, cfg) {
    this.detener();
    const turno = this.turno;
    if (!texto || !texto.trim()) return;
    this._estado(true);
    try {
      if (cfg.motor === 'edge-tts') await this._edge(texto, cfg, turno);
      else await this._say(texto, cfg, turno);
    } finally {
      if (turno === this.turno) { this._limpiarTemporales(); this._estado(false); }
    }
  }

  async _say(texto, cfg, turno) {
    if (process.platform !== 'darwin') return this._otroSistema(texto, turno);
    const archivo = this._tmp('.txt');
    fs.writeFileSync(archivo, texto, 'utf8');
    const args = ['-f', archivo, '-r', String(cfg.velocidadSay || 200)];
    if (cfg.vozSay) args.unshift('-v', cfg.vozSay);
    await this._correr('say', args, turno);
  }

  // edge-tts genera por trozos para empezar a sonar rápido en textos largos.
  async _edge(texto, cfg, turno) {
    const bin = expandir(cfg.rutaEdgeTts || 'edge-tts');
    const trozos = partir(texto, 900);
    const reproducir = process.platform === 'darwin' ? 'afplay'
      : process.platform === 'win32' ? null : 'ffplay';
    if (!reproducir) throw new Error('edge-tts en Windows aún no está soportado por esta extensión.');

    let siguiente = this._edgeGenerar(bin, trozos[0], cfg, turno);
    for (let i = 0; i < trozos.length; i++) {
      const mp3 = await siguiente;
      if (!mp3 || turno !== this.turno) return;
      if (i + 1 < trozos.length) siguiente = this._edgeGenerar(bin, trozos[i + 1], cfg, turno);
      const args = reproducir === 'ffplay' ? ['-nodisp', '-autoexit', '-loglevel', 'quiet', mp3] : [mp3];
      const ok = await this._correr(reproducir, args, turno);
      if (!ok) return;
    }
  }

  async _edgeGenerar(bin, trozo, cfg, turno) {
    const txt = this._tmp('.txt');
    const mp3 = this._tmp('.mp3');
    fs.writeFileSync(txt, trozo, 'utf8');
    const ok = await this._correr(bin, [
      '--voice', cfg.vozEdge || 'es-CO-SalomeNeural',
      `--rate=${cfg.velocidadEdge || '+0%'}`,
      '--file', txt, '--write-media', mp3,
    ], turno);
    return ok ? mp3 : null;
  }

  async _otroSistema(texto, turno) {
    if (process.platform === 'win32') {
      const archivo = this._tmp('.txt');
      fs.writeFileSync(archivo, texto, 'utf8');
      const ps = `Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak([IO.File]::ReadAllText('${archivo}'))`;
      return this._correr('powershell', ['-NoProfile', '-Command', ps], turno);
    }
    return this._correr('spd-say', ['-w', '-l', 'es', texto], turno);
  }

  static vocesSay() {
    return new Promise((resolve) => {
      if (process.platform !== 'darwin') return resolve([]);
      execFile('say', ['-v', '?'], (err, out) => {
        if (err) return resolve([]);
        resolve(out.split('\n').map((l) => {
          const m = l.match(/^(.+?)\s{2,}([a-z]{2}[_-][A-Z0-9]+)\s+#\s*(.*)$/);
          return m ? { nombre: m[1].trim(), idioma: m[2], ejemplo: m[3] } : null;
        }).filter(Boolean));
      });
    });
  }
}

// Parte por párrafos/oraciones sin pasar de `max` caracteres.
function partir(texto, max) {
  const oraciones = texto.split(/(?<=[.!?…:;])\s+|\n+/).filter((s) => s.trim());
  const out = [];
  let actual = '';
  for (const o of oraciones) {
    if ((actual + ' ' + o).length > max && actual) { out.push(actual); actual = o; }
    else actual = actual ? actual + ' ' + o : o;
    while (actual.length > max) { out.push(actual.slice(0, max)); actual = actual.slice(max); }
  }
  if (actual.trim()) out.push(actual);
  return out.length ? out : [texto];
}

module.exports = { Voz, partir };
