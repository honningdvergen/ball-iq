// Sound for quiz videos (Shorts + long-form).
//
// Why this exists: the first quiz reel shipped SILENT (anullsrc) and Alex deleted it from TikTok
// ("quiet and not fit for tiktok at all", 09-23). Every quiz video now gets:
//   • a music bed — Kevin MacLeod, CC BY 4.0 (credit line returned for the caption/description)
//   • a clock tick on every countdown second (higher + louder for the last 3)
//   • a two-note chime on the reveal (no sound between questions: Alex found the whoosh bad, 09-23)
// The effects are synthesised here (no third-party samples = nothing to license or get claimed).
//
//   import { mixQuizAudio } from './quizaudio.mjs';
//   const credit = mixQuizAudio({ video, out, total, events: questionEvents(...) });

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MUSIC_DIR = path.join(HERE, 'state', 'media', 'music');
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const SR = 44100;

// Upbeat, quiz-appropriate beds (all Kevin MacLeod, CC BY 4.0 — see music/LICENCES.md).
export const TRACKS = {
  monkeys: ['monkeys_spinning_monkeys.mp3', 'Monkeys Spinning Monkeys'],
  investigations: ['investigations.mp3', 'Investigations'],
  duck: ['fluffing_a_duck.mp3', 'Fluffing a Duck'],
  polka: ['pixel_peeker_polka__faster.mp3', 'Pixel Peeker Polka - faster'],
  elevator: ['local_forecast__elevator.mp3', 'Local Forecast - Elevator'],
  weasel: ['scheming_weasel_faster.mp3', 'Scheming Weasel faster'],
  builder: ['the_builder.mp3', 'The Builder'],
  sneaky: ['sneaky.mp3', 'Sneaky Snitch'],
};
export const creditFor = (key) => `🎵 ${TRACKS[key][1]} – Kevin MacLeod (incompetech.com), CC BY 4.0`;

// ---- synthesis ----
function tone(sec, fn) { const n = Math.round(sec * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i / SR); return a; }
const SFX = {
  tick: tone(0.03, (t) => 0.45 * Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 160)),
  tickHot: tone(0.04, (t) => 0.7 * Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-t * 120)),
  chime: tone(0.9, (t) => {
    const n1 = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 5);
    const t2 = t - 0.13, n2 = t2 > 0 ? Math.sin(2 * Math.PI * 1318.5 * t2) * Math.exp(-t2 * 4.5) : 0;
    return 0.38 * (n1 + n2);
  }),
  whoosh: (() => {           // band-limited noise swell, deterministic (seeded) so re-renders are identical
    let s = 7, lp = 0;
    return tone(0.35, (t) => { s = (s * 16807) % 2147483647; const w = s / 2147483647 * 2 - 1; lp += (w - lp) * (0.05 + 0.4 * t / 0.35); return 0.5 * lp * Math.sin(Math.PI * t / 0.35); });
  })(),
};

function writeWav(file, buf) {
  const pcm = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) pcm.writeInt16LE(Math.max(-1, Math.min(1, buf[i])) * 32767 | 0, i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}

/** events: [{ t: seconds, type: 'tick'|'tickHot'|'chime'|'whoosh' }] */
export function sfxTrack(total, events, file) {
  const buf = new Float32Array(Math.ceil(total * SR));
  for (const e of events) {
    const s = SFX[e.type]; if (!s) throw new Error('unknown sfx ' + e.type);
    const o = Math.round(e.t * SR);
    for (let i = 0; i < s.length && o + i < buf.length; i++) buf[o + i] += s[i];
  }
  writeWav(file, buf);
}

/** Standard countdown pattern: ticks each second of thinking, hot ticks for the last 3, chime at reveal.
 *  No transition sound between questions — Alex 09-23: "the sound when switching … is bad". */
export function questionEvents(qStart, thinkStart, thinkEnd, reveal) {
  const ev = [];
  for (let t = thinkStart; t < thinkEnd - 0.01; t += 1) ev.push({ t, type: thinkEnd - t <= 3.01 ? 'tickHot' : 'tick' });
  ev.push({ t: reveal, type: 'chime' });
  return ev;
}

/** Mux music bed + effects under a silent video. Returns the credit line to put in the caption/description. */
export function mixQuizAudio({ video, out, total, events, track = 'monkeys', musicVol = 0.28, skip = 2 }) {
  const tmp = path.join(os.tmpdir(), `sfx-${process.pid}-${Date.now()}.wav`);
  sfxTrack(total, events, tmp);
  // track 'none': ticks + chime only (Alex 09-23 on the polka bed under Guess the XI: "shockingly bad")
  if (track === 'none') {
    execFileSync(FFMPEG, ['-y', '-i', video, '-i', tmp, '-filter_complex', '[1:a]alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=11[a]',
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], { stdio: ['ignore', 'ignore', 'pipe'] });
    fs.rmSync(tmp, { force: true });
    return '';
  }
  const [file] = TRACKS[track] || TRACKS.monkeys;
  const fadeOut = Math.max(0, total - 1.2).toFixed(2);
  execFileSync(FFMPEG, ['-y', '-i', video,
    '-stream_loop', '-1', '-ss', String(skip), '-i', path.join(MUSIC_DIR, file),
    '-i', tmp,
    '-filter_complex',
    `[1:a]atrim=0:${total},asetpts=N/SR/TB,volume=${musicVol},afade=in:d=0.4,afade=out:st=${fadeOut}:d=1.2[m];` +
    `[2:a]volume=1.0[s];[m][s]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  fs.rmSync(tmp, { force: true });
  return creditFor(track in TRACKS ? track : 'monkeys');
}
