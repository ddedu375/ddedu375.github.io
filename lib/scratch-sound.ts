// A short, soft paper-rubbing sound, created only during erasing gestures.
export function createScratchSound() {
  let context: AudioContext | undefined;
  let lastPlayed = -Infinity;
  return {
    play() {
      if (performance.now() - lastPlayed < 90) return;
      lastPlayed = performance.now();
      try {
        context ??= new AudioContext();
        if (context.state === 'suspended') void context.resume().catch(() => {});
        const duration = 0.22;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
          // Rounded, overlapping swells avoid a rapid sequence of scratchy clicks.
          const envelope = Math.sin(Math.PI * i / (samples.length - 1)) ** 2;
          samples[i] = (Math.random() * 2 - 1) * envelope;
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 950;
        filter.Q.value = 0.5;
        const highpass = context.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 180;
        highpass.Q.value = 0.5;
        const gain = context.createGain();
        gain.gain.value = 0.035;
        source.connect(highpass).connect(filter).connect(gain).connect(context.destination);
        source.start();
        source.onended = () => { source.disconnect(); highpass.disconnect(); filter.disconnect(); gain.disconnect(); };
      } catch { /* Audio feedback must never interrupt the interaction. */ }
    },
    dispose() { if (context) void context.close().catch(() => {}); },
  };
}
