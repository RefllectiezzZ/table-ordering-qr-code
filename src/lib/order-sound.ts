export const ORDERS_SOUND_STORAGE_KEY = "restaurant_orders_sound_enabled";

const soundListeners = new Set<() => void>();

function notifySoundListeners(): void {
  soundListeners.forEach((listener) => listener());
}

export function subscribeOrdersSoundEnabled(onStoreChange: () => void): () => void {
  soundListeners.add(onStoreChange);
  return () => {
    soundListeners.delete(onStoreChange);
  };
}

export function readOrdersSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ORDERS_SOUND_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function ordersSoundServerSnapshot(): boolean {
  return false;
}

export function writeOrdersSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_SOUND_STORAGE_KEY, enabled ? "1" : "0");
    notifySoundListeners();
  } catch {
    // localStorage may be unavailable in private mode.
  }
}

/**
 * Short beep via Web Audio API. Must be called from a user gesture when
 * enabling sound for the first time (browser autoplay policy).
 */
export function playNewOrderBeep(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => void ctx.close();
  } catch {
    // Audio may be blocked or unavailable.
  }
}
