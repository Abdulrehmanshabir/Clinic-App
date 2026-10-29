let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const AudioCtor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }

  return audioContext;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

function strike(ctx: AudioContext, frequency: number, start: number, duration: number, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function playCallBell() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const ring = () => {
    const now = ctx.currentTime;
    strike(ctx, 880, now, 0.55, 0.28);
    strike(ctx, 660, now + 0.22, 0.75, 0.24);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(ring).catch(() => {});
  } else {
    ring();
  }
}
