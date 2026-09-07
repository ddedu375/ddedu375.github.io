// A gentle ascending major chord for discovering a new style.
export function playUnlockSound(): () => void {
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    const audio = context;
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * 0.085;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.38);
      oscillator.onended = () => {
        oscillator.disconnect(); gain.disconnect();
        if (index === 2) void audio.close().catch(() => {});
      };
    });
  } catch { /* Sound must never interrupt the toast. */ }
  return () => { if (context && context.state !== 'closed') void context.close().catch(() => {}); };
}
