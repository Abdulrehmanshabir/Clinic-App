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

export async function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  return ctx.state === "running";
}

function strike(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

// Call Bell: soft descending "ding-dong" doorbell (sine wave)
export function playCallBell() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const ring = () => {
    const now = ctx.currentTime;
    strike(ctx, 1046.5, now, 0.55, 0.3, "sine");
    strike(ctx, 783.99, now + 0.32, 0.95, 0.26, "sine");
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(ring).catch(() => {});
  } else {
    ring();
  }
}

// Break Bell: sharp triple "beep-beep-beep" alert (square wave)
export function playBreakBell() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const ring = () => {
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      strike(ctx, 880, now + i * 0.22, 0.12, 0.16, "square");
    }
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(ring).catch(() => {});
  } else {
    ring();
  }
}
