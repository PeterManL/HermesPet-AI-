// Web Audio API Synthesizer Engine for HermesPet
// Procedural audio generation ensures 100% offline capability, zero assets loading latency,
// and highly dynamic sound effects tailored to each pet species' specific theme!

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Safe initializer that can be called on user interaction to comply with autoplay policy
export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  return isMuted;
}

export function getMutedStatus(): boolean {
  return isMuted;
}

// Utility to create a sound effect chain with gain envelope
function createSynthChain(duration: number, type: OscillatorType = "sine") {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Default envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(isMuted ? 0 : 0.15, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  return { ctx, osc, gainNode };
}

// 1. HERMES (Cyber Fox) - Tech-inspired synthesizers
const playHermesSound = (action: string) => {
  if (isMuted) return;
  const duration = action === "sad_sigh" ? 0.5 : 0.15;
  const { ctx, osc, gainNode } = createSynthChain(duration, "triangle");

  if (action === "happy_dance" || action === "click") {
    // Digitized high-speed sweep
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } else if (action === "curious_look") {
    // Cyber double beep
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.06);
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime + 0.06);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } else if (action === "sad_sigh") {
    // Sinking robot sweep
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
};

// 2. MOCHI (Pink Slime) - Wet, bouncy bubbles
const playMochiSound = (action: string) => {
  if (isMuted) return;
  const duration = action === "sad_sigh" ? 0.6 : 0.25;
  const { ctx, osc, gainNode } = createSynthChain(duration, "sine");

  if (action === "happy_dance" || action === "click") {
    // Quick ascending squishy bubble
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } else if (action === "curious_look") {
    // Double springy slide
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } else if (action === "sad_sigh") {
    // Sinking melt
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.55);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }
};

// 3. KURO (Abyss Cat) - Mysterious dark meows and purrs
const playKuroSound = (action: string) => {
  if (isMuted) return;
  if (action === "happy_dance" || action === "click") {
    // Cyber Meow pitch envelope
    const duration = 0.22;
    const { ctx, osc } = createSynthChain(duration, "sine");
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    // quick pitch peak then curve down
    osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } else if (action === "curious_look") {
    // High pitched kitten alert squeak
    const duration = 0.12;
    const { ctx, osc } = createSynthChain(duration, "triangle");
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } else if (action === "sad_sigh") {
    // Slow low-frequency feline purr/groan
    const duration = 0.65;
    const { ctx, osc, gainNode } = createSynthChain(duration, "sawtooth");
    
    // Low purr freq
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    
    // Add rapid vibrato/tremolo to simulate cat purring throat modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(28, ctx.currentTime); // 28Hz vibration
    lfoGain.gain.setValueAtTime(0.04, ctx.currentTime); // subtle volume wobble
    
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    
    osc.start();
    lfo.start();
    osc.stop(ctx.currentTime + duration);
    lfo.stop(ctx.currentTime + duration);
  }
};

// 4. PIPPIN (Clockwork Bird) - Mechanical clicks and chirps
const playPippinSound = (action: string) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  
  if (action === "happy_dance" || action === "click") {
    // Rapid clockwork mechanical bell chirp (chirp chirp)
    const playBellChirp = (delay: number, pitch: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.3, ctx.currentTime + delay + 0.06);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.08);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.09);
    };
    
    playBellChirp(0, 1800);
    playBellChirp(0.08, 2200);
  } else if (action === "curious_look") {
    // Clockwork ticking springs
    const playTick = (delay: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(120, ctx.currentTime + delay);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.02);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.03);
    };
    
    playTick(0);
    playTick(0.06);
    playTick(0.12);
  } else if (action === "sad_sigh") {
    // Steam pressure release release "shhhh..." using noise simulation
    try {
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.35);
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      
      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noiseNode.start();
      noiseNode.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Fallback if Buffer fails: play simple sinking triangle whistle
      const { osc } = createSynthChain(0.4, "triangle");
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.38);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  }
};

// 5. LULU (Cotton Rabbit) - Delicate magic, soft springy bunny bounces
const playLuluSound = (action: string) => {
  if (isMuted) return;
  
  if (action === "happy_dance" || action === "click") {
    // Fluffy "boing-boing" bounce sound
    const playBounce = (delay: number, baseFreq: number) => {
      const { ctx, osc } = createSynthChain(0.18, "triangle");
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + delay + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + delay + 0.16);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.18);
    };
    playBounce(0, 260);
    playBounce(0.1, 310);
  } else if (action === "curious_look") {
    // Soft magical fairy chime sweep
    const duration = 0.35;
    const { ctx, osc } = createSynthChain(duration, "sine");
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } else if (action === "sad_sigh") {
    // Deep soft bunny sigh
    const duration = 0.5;
    const { ctx, osc } = createSynthChain(duration, "sine");
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.48);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
};

// 6. COOKIE (Neon Shiba) - Playful sci-fi cyber barks and bips
const playCookieSound = (action: string) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  
  if (action === "happy_dance" || action === "click") {
    // Quick puppy "woof!"
    const playBark = (delay: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sawtooth";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(320, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + delay + 0.06);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.14, ctx.currentTime + delay + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.07);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.08);
    };
    
    // Double playful bark
    playBark(0);
    playBark(0.09);
  } else if (action === "curious_look") {
    // Cute Shiba "whine / yawn" pitch sweep
    const duration = 0.28;
    const { osc } = createSynthChain(duration, "sine");
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.12);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.26);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } else if (action === "sad_sigh") {
    // Low whimpering whistle
    const duration = 0.55;
    const { osc } = createSynthChain(duration, "sine");
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
};

// Orchestrator to play specific pet sound
export function playPetSound(petType: string, action: string) {
  try {
    switch (petType) {
      case "Hermes":
        playHermesSound(action);
        break;
      case "Mochi":
        playMochiSound(action);
        break;
      case "Kuro":
        playKuroSound(action);
        break;
      case "Pippin":
        playPippinSound(action);
        break;
      case "Lulu":
        playLuluSound(action);
        break;
      case "Cookie":
        playCookieSound(action);
        break;
      default:
        // Generic fallback sound
        const { ctx, osc } = createSynthChain(0.15, "sine");
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }
  } catch (error) {
    console.warn("Audio Context playback error:", error);
  }
}

// Global Event sound: LEVEL UP (Triumphant ascending scale)
export function playLevelUpSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major ascending arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const startTime = ctx.currentTime + (idx * 0.08);
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);
      
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    console.warn("Audio Context playback error for Level Up:", e);
  }
}

// Global Event sound: EATING/FEEDING (Rhythmic bubble bites)
export function playFeedSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    
    const playNibble = (delay: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const startTime = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(350, startTime);
      osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.04);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.16, startTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);
      
      osc.start(startTime);
      osc.stop(startTime + 0.06);
    };
    
    // crunch crunch crunch
    playNibble(0);
    playNibble(0.12);
    playNibble(0.24);
  } catch (e) {
    console.warn("Audio Context playback error for feeding:", e);
  }
}

// Global Event sound: HUNGER/LOW ENERGY WARNING (Gentle cyber alarm beep-bips)
export function playAlertWarningSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    
    const playBeep = (delay: number, pitch: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const startTime = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(pitch, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);
      
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    };
    
    // soft neon double beep
    playBeep(0, 680);
    playBeep(0.15, 680);
  } catch (e) {
    console.warn("Audio Context playback error for alert:", e);
  }
}
