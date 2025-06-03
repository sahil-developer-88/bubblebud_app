import { create } from "zustand";

// Shared audio context
let audioContext: AudioContext | null = null;
let oceanNoiseNode: AudioBufferSourceNode | null = null;
let oceanGainNode: GainNode | null = null;

// Flag to track if audio context was suspended due to no user interaction
let wasAudioSuspended = false;

// Initialize or resume audio context - called at user interaction points
const ensureAudioContext = (): AudioContext => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("Audio context created");
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
      throw error;
    }
  }
  
  // Handle suspended state (common on mobile browsers)
  if (audioContext.state === 'suspended') {
    console.log("Resuming suspended audio context");
    wasAudioSuspended = true;
    audioContext.resume().catch(err => {
      console.error("Error resuming AudioContext:", err);
    });
  }
  
  return audioContext;
};

// Function to create relaxing ocean sounds
const createOceanAmbience = () => {
  try {
    // Initialize/resume audio context
    const ctx = ensureAudioContext();
    
    // Buffer size for about 3 seconds of audio (longer buffer = more variation)
    const bufferSize = 3 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    
    // Fill buffer with filtered noise for two channels (stereo)
    for (let channel = 0; channel < 2; channel++) {
      const channelData = noiseBuffer.getChannelData(channel);
      
      // Generate pink noise (more natural than white noise)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink noise algorithm (Paul Kellet's method, simplified)
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        
        // Add more complex variation for waves effect
        const wave1 = Math.sin(i * 0.0001) * 0.05; // Basic slow wave
        const wave2 = Math.sin(i * 0.00023) * 0.03; // Slightly faster wave
        const wave3 = Math.sin(i * 0.00047) * 0.02; // Even faster small wave
        const pinkNoise = (b0 + b1 + b2 + b3 + b4 + b5) * 0.07; // Increased noise level
        
        // Combine for a more dynamic ocean-like sound
        channelData[i] = pinkNoise + wave1 + wave2 + wave3;
      }
    }
    
    // Create audio source from buffer
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    
    // Filtering to make it more ocean-like but more audible
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800; // Higher cutoff for more presence
    
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80; // Lower cutoff to allow more bass
    
    // Very slight reverb effect using delay
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.2;
    
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.2;
    
    // Master volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.25; // Increased volume for better audibility
    
    // Connect the nodes in our audio graph
    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gainNode);
    
    // Add delay path for light reverb
    highpass.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(gainNode);
    
    // Connect to output
    gainNode.connect(ctx.destination);
    
    // Save references for later control
    oceanNoiseNode = source;
    oceanGainNode = gainNode;
    
    console.log("Created ocean ambience sound");
    
    return source;
  } catch (error) {
    console.error("Error creating ocean ambience:", error);
    return null;
  }
};

// Pre-generated bell buffers for better performance
const bellBuffers: Map<string, AudioBuffer> = new Map();

// Pregenerate all bell sounds we'll need
const pregenerateBellSounds = () => {
  try {
    const ctx = ensureAudioContext();
    const bellFrequencies = [
      // Low bell
      { id: 'low', freq1: 220, freq2: 293.66 },
      // Mid bell
      { id: 'mid', freq1: 329.63, freq2: 493.88 },
      // High bell
      { id: 'high', freq1: 392, freq2: 587.33 },
      // Reward
      { id: 'reward', freq1: 523.25, freq2: 783.99 }
    ];
    
    // Generate each bell
    bellFrequencies.forEach(bell => {
      generateBellBuffer(ctx, bell.id, bell.freq1, bell.freq2);
    });
    
    console.log("Pre-generated all bell sounds for better performance");
  } catch (error) {
    console.error("Error pre-generating bell sounds:", error);
  }
};

// Generate a bell sound buffer
const generateBellBuffer = (ctx: AudioContext, id: string, freq1: number, freq2: number) => {
  try {
    // Duration of bell sound in seconds
    const duration = 2.5;
    const sampleRate = ctx.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    
    // Process each channel
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate; // Time in seconds
        
        // Frequency components
        const fundamental = Math.sin(2 * Math.PI * freq1 * t);
        const harmonic = Math.sin(2 * Math.PI * freq2 * t);
        
        // Bell-like envelope (attack and decay)
        // Quick attack, long decay
        let envelope;
        if (t < 0.01) {
          // Very quick attack (10ms)
          envelope = t / 0.01;
        } else {
          // Long decay with curve
          envelope = Math.exp(-3 * (t - 0.01));
        }
        
        // Mix frequencies with proper weights
        const signal = (fundamental * 0.7 + harmonic * 0.3) * envelope * 0.5;
        
        // Apply slight stereo variation
        if (channel === 0) {
          channelData[i] = signal * 0.95;
        } else {
          channelData[i] = signal;
        }
      }
    }
    
    // Store in our buffer map
    bellBuffers.set(id, buffer);
    
  } catch (error) {
    console.error(`Error generating bell buffer for ${id}:`, error);
  }
};

// Helper function to play one of our pre-generated bell sounds 
const playBellSound = (bellId: string) => {
  try {
    const ctx = ensureAudioContext();
    
    // Check if the bell buffer exists
    const bellBuffer = bellBuffers.get(bellId);
    if (!bellBuffer) {
      console.warn(`Bell buffer for ${bellId} not found`);
      return;
    }
    
    // Create audio source from buffer
    const source = ctx.createBufferSource();
    source.buffer = bellBuffer;
    
    // Apply volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.6;
    
    // Add a compressor for better volume management
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(ctx.destination);
    
    // Play sound
    source.start();
    console.log(`Playing ${bellId} bell from buffer`);
    
    // Return the source so it can be stopped if needed
    return source;
  } catch (error) {
    console.log(`Error playing ${bellId} bell:`, error);
    return null;
  }
};

// Fallback function that creates a bell sound on-demand (used if pregenerated sounds fail)
const playMeditationBell = (frequency1: number, frequency2: number) => {
  try {
    // Get shared audio context
    const ctx = ensureAudioContext();
    
    // Create two oscillators for a more complex bell sound
    const oscillator1 = ctx.createOscillator();
    oscillator1.type = 'sine';
    oscillator1.frequency.value = frequency1; // Primary frequency
    
    const oscillator2 = ctx.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.value = frequency2; // Harmonic frequency
    
    // Create gain nodes for volume control
    const gainNode1 = ctx.createGain();
    gainNode1.gain.value = 0.3; // Primary sound volume
    
    const gainNode2 = ctx.createGain();
    gainNode2.gain.value = 0.15; // Harmonic sound at lower volume
    
    // Add a compressor for better audio
    const compressor = ctx.createDynamicsCompressor();
    
    // Connect everything
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(compressor);
    gainNode2.connect(compressor);
    compressor.connect(ctx.destination);
    
    // Schedule the sound with a nice bell envelope
    const now = ctx.currentTime;
    
    // Start oscillators
    oscillator1.start(now);
    oscillator2.start(now);
    
    // Bell-like attack & decay envelope
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.1); // Quick attack
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Long fade out
    
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    
    // Stop oscillators after fade out
    oscillator1.stop(now + 2.5);
    oscillator2.stop(now + 2.5);
    
    console.log(`Playing live meditation bell: ${frequency1}Hz / ${frequency2}Hz`);
  } catch (error) {
    console.log("Error playing meditation bell:", error);
  }
};

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  rewardSound: HTMLAudioElement | null;
  isMuted: boolean;
  isMusicMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setRewardSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  toggleMusic: () => void;
  playHit: () => void;
  playReward: () => void;
  playLowBell: () => void;    // Lower meditation bell (220Hz - A3)
  playMidBell: () => void;    // Middle meditation bell (329.63Hz - E4)
  playHighBell: () => void;   // Higher meditation bell (392Hz - G4)
  playSoundForPosition: (positionType: number) => void; // 1=high, 2=mid, 3=low, 0=mid
  
  // Background music control
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

// Flag to track if assets have been preloaded
let assetsPreloaded = false;

// Enhanced preloading system for all audio assets
const preloadAllAudioAssets = () => {
  if (assetsPreloaded) return; // Only preload once
  
  try {
    // 1. Initialize audio context and generate bell sounds
    ensureAudioContext();
    pregenerateBellSounds();
    
    // 2. Pre-create ocean ambience buffer
    // (but don't start playing it yet)
    createOceanAmbience();

    // 3. Mark assets as preloaded
    assetsPreloaded = true;
    console.log("Audio assets preloaded successfully");
  } catch (error) {
    console.error("Error preloading audio assets:", error);
    
    // Schedule a retry with exponential backoff if it failed
    setTimeout(() => {
      if (!assetsPreloaded) {
        console.log("Retrying audio asset preload...");
        preloadAllAudioAssets();
      }
    }, 2000); // 2 second delay before retry
  }
};

export const useAudio = create<AudioState>((set, get) => {
  // Preload all audio assets when the store is created
  // Use a short timeout to allow the app to render first
  setTimeout(() => {
    preloadAllAudioAssets();
  }, 500);
  
  return {
    backgroundMusic: null,
    hitSound: null,
    rewardSound: null,
    isMuted: false, // Start unmuted to ensure users hear the audio effects
    isMusicMuted: false, // Start with music enabled
    
    // Setter functions
    setBackgroundMusic: (music) => set({ backgroundMusic: music }),
    setRewardSound: (sound) => set({ rewardSound: sound }),
    
    // Toggle functions
    toggleMute: () => {
      const { isMuted } = get();
      const newMutedState = !isMuted;
      
      // Ensure audio context is running when unmuting
      if (!newMutedState) {
        try {
          ensureAudioContext();
          // Regenerate bell sounds if needed
          if (bellBuffers.size === 0) {
            pregenerateBellSounds();
          }
        } catch (error) {
          console.error("Error initializing audio on unmute:", error);
        }
      }
      
      // Update the muted state
      set({ isMuted: newMutedState });
      
      // Log the change
      console.log(`Sound effects ${newMutedState ? 'muted' : 'unmuted'}`);
    },
    
    toggleMusic: () => {
      const { isMusicMuted } = get();
      const newMusicMutedState = !isMusicMuted;
      
      // Update the music muted state
      set({ isMusicMuted: newMusicMutedState });
      
      try {
        // Ensure audio context is running when unmuting
        if (!newMusicMutedState) {
          ensureAudioContext();
        }
        
        // Handle the ocean ambience
        if (newMusicMutedState) {
          // Mute by stopping the ocean sound
          if (oceanNoiseNode) {
            oceanNoiseNode.stop();
            oceanNoiseNode = null;
          }
        } else {
          // Unmute by starting the ocean sound
          get().startBackgroundMusic();
        }
      } catch (error) {
        console.error("Error toggling ocean ambient:", error);
      }
      
      // Log the change
      console.log(`Ocean ambient sound ${newMusicMutedState ? 'muted' : 'unmuted'}`);
    },
    
    // Sound playback functions
    playHit: () => {
      const { hitSound, isMuted } = get();
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      try {
        // Ensure audio context is active
        ensureAudioContext();
        
        if (hitSound) {
          // Clone the sound to allow overlapping playback
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = 0.4;
          soundClone.play().catch(error => {
            console.log("Hit sound play prevented:", error);
          });
        }
      } catch (error) {
        console.error("Error playing hit sound:", error);
      }
    },
    
    playReward: () => {
      const { rewardSound, isMuted } = get();
      if (isMuted) {
        console.log("Reward sound skipped (muted)");
        return;
      }
      
      try {
        // Ensure audio context is active
        ensureAudioContext();
        
        // First try the pregenerated buffer for best performance
        const rewardBuffer = playBellSound('reward');
        
        // If that fails, try the HTML audio element
        if (!rewardBuffer && rewardSound) {
          rewardSound.currentTime = 0;
          rewardSound.volume = 0.8;
          rewardSound.play().catch(error => {
            console.log("Reward sound play prevented:", error);
            // Last resort fallback
            playMeditationBell(523.25, 783.99); // C5 and G5 - a perfect fifth
          });
          console.log("Playing reward sound from HTML Audio");
        } else if (!rewardBuffer) {
          // Fallback to a special meditation bell if everything else fails
          playMeditationBell(523.25, 783.99); // C5 and G5 - a perfect fifth
          console.log("Playing reward meditation bell fallback");
        }
      } catch (error) {
        console.error("Error playing reward sound:", error);
        
        // Final fallback if all else fails
        try {
          playMeditationBell(523.25, 783.99);
        } catch (e) {
          console.error("All audio playback methods failed:", e);
        }
      }
    },
    
    // Background music control
    startBackgroundMusic: () => {
      const { isMusicMuted } = get();
      
      if (isMusicMuted) {
        console.log("Background music not started (muted)");
        return;
      }
      
      try {
        // First stop any existing ocean sound
        if (oceanNoiseNode) {
          oceanNoiseNode.stop();
          oceanNoiseNode = null;
        }
        
        // Ensure audio context is active
        ensureAudioContext();
        
        // Create and start new ocean sound
        const oceanSource = createOceanAmbience();
        if (oceanSource) {
          oceanSource.start();
          console.log("Started ocean ambient background");
        }
      } catch (error) {
        console.error("Error starting ocean ambient:", error);
      }
    },
    
    stopBackgroundMusic: () => {
      try {
        if (oceanNoiseNode) {
          oceanNoiseNode.stop();
          oceanNoiseNode = null;
          console.log("Stopped ocean ambient background");
        }
      } catch (error) {
        console.error("Error stopping ocean ambient:", error);
      }
    },
    
    // Enhanced bell sounds with buffer-based approach for better reliability
    playLowBell: () => {
      const { isMuted } = get();
      if (isMuted) {
        console.log("Low bell sound skipped (muted)");
        return;
      }
      
      try {
        // Ensure audio context is active
        ensureAudioContext();
        
        // First try the pregenerated buffer for best performance
        const source = playBellSound('low');
        
        // If buffer isn't available, fall back to legacy method
        if (!source) {
          playMeditationBell(220, 293.66);
          console.log("Playing low meditation bell (fallback method)");
        }
      } catch (error) {
        console.error("Error playing low bell:", error);
        
        // Last resort fallback
        try {
          playMeditationBell(220, 293.66);
        } catch (e) {
          // Nothing more we can do
          console.error("All audio playback methods failed:", e);
        }
      }
    },
    
    playMidBell: () => {
      const { isMuted } = get();
      if (isMuted) {
        console.log("Mid bell sound skipped (muted)");
        return;
      }
      
      try {
        // Ensure audio context is active
        ensureAudioContext();
        
        // First try the pregenerated buffer for best performance
        const source = playBellSound('mid');
        
        // If buffer isn't available, fall back to legacy method
        if (!source) {
          playMeditationBell(329.63, 493.88);
          console.log("Playing mid meditation bell (fallback method)");
        }
      } catch (error) {
        console.error("Error playing mid bell:", error);
        
        // Last resort fallback
        try {
          playMeditationBell(329.63, 493.88);
        } catch (e) {
          // Nothing more we can do
          console.error("All audio playback methods failed:", e);
        }
      }
    },
    
    playHighBell: () => {
      const { isMuted } = get();
      if (isMuted) {
        console.log("High bell sound skipped (muted)");
        return;
      }
      
      try {
        // Ensure audio context is active
        ensureAudioContext();
        
        // First try the pregenerated buffer for best performance
        const source = playBellSound('high');
        
        // If buffer isn't available, fall back to legacy method
        if (!source) {
          playMeditationBell(392, 587.33);
          console.log("Playing high meditation bell (fallback method)");
        }
      } catch (error) {
        console.error("Error playing high bell:", error);
        
        // Last resort fallback
        try {
          playMeditationBell(392, 587.33);
        } catch (e) {
          // Nothing more we can do
          console.error("All audio playback methods failed:", e);
        }
      }
    },
    
    playSoundForPosition: (positionType: number) => {
      // Make sure we're using shared audio context
      try {
        ensureAudioContext();
      } catch (error) {
        console.error("Error ensuring audio context:", error);
      }
      
      // Play the appropriate sound for the coin position
      // 1=high, 2=mid, 3=low, 0=mid (wrap around)
      switch (positionType) {
        case 1: // High
          get().playHighBell();
          break;
        case 3: // Low
          get().playLowBell();
          break;
        case 2: // Mid
        case 0: // Mid (wrap around)
        default:
          get().playMidBell();
          break;
      }
    }
  };
});
