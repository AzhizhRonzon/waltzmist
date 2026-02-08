// Sound effects utility — plays short sounds for key app events
const SOUNDS = {
  match: "/sounds/match.mp3",
  messageSent: "/sounds/send.mp3",
  nudge: "/sounds/nudge.mp3",
  swipe: "/sounds/swipe.mp3",
};

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Generate a simple synthesized sound when no audio file exists
function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

export function playMatchSound() {
  // Rising arpeggio: C5 → E5 → G5
  playTone(523, 0.15, "sine", 0.12);
  setTimeout(() => playTone(659, 0.15, "sine", 0.12), 120);
  setTimeout(() => playTone(784, 0.3, "sine", 0.15), 240);
  setTimeout(() => playTone(1047, 0.4, "sine", 0.1), 400);
}

export function playMessageSentSound() {
  playTone(880, 0.08, "sine", 0.08);
  setTimeout(() => playTone(1100, 0.1, "sine", 0.06), 60);
}

export function playSwipeSound() {
  playTone(300, 0.06, "triangle", 0.05);
}

export function playNudgeSound() {
  playTone(660, 0.1, "sine", 0.1);
  setTimeout(() => playTone(880, 0.1, "sine", 0.08), 100);
}
