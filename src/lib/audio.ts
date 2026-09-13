// Web Audio API guitar chord sound synthesizer (zero external dependencies)
import { getShape } from './chordShapes';

// Standard guitar tuning open string MIDI note numbers: E2 (40), A2 (45), D3 (50), G3 (55), B3 (59), E4 (64)
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play an acoustic guitar pluck sound for a specific frequency
 */
function playStringPluck(ctx: AudioContext, freq: number, startTime: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Rich acoustic harmonics mix using triangle + lowpass
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startTime);

  // Filter for warm wooden acoustic tone
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(freq * 4, 3200), startTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 1.2);

  // Pluck envelope: sharp attack, natural exponential decay
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + 1.8);
}

/**
 * Strum a guitar chord based on its frets
 */
export function playChord(chord: string) {
  if (typeof window === 'undefined') return;

  const shape = getShape(chord);
  if (!shape) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const strumSpeed = 0.032; // 32ms between each string for realistic acoustic strum

  shape.frets.forEach((fret, stringIdx) => {
    if (fret < 0) return; // muted string (x)

    const midi = OPEN_STRING_MIDI[stringIdx] + fret;
    const freq = midiToFreq(midi);
    const pluckTime = now + stringIdx * strumSpeed;

    playStringPluck(ctx, freq, pluckTime);
  });
}
