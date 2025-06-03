import create from "zustand";
import { Audio } from "expo-av";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { getStorage, setStorage } from "../utils";
import React, { useRef, useEffect, useCallback } from "react";
import { View } from "react-native";

// HTML content for Web Audio API engine
const audioEngineHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #1a1a1a;
      color: white;
      font-family: system-ui;
    }
    button {
      background: #4CAF50;
      border: none;
      color: white;
      padding: 10px 20px;
      margin: 5px;
      border-radius: 5px;
      cursor: pointer;
    }
    #log {
      background: #2a2a2a;
      padding: 10px;
      margin-top: 10px;
      border-radius: 5px;
      height: 200px;
      overflow-y: auto;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div>
    <button onclick="playBeep()">Play Beep</button>
  </div>
  <div id="log"></div>

  <script>
    // Basic logging
    function log(msg) {
      const logDiv = document.getElementById('log');
      const entry = document.createElement('div');
      entry.textContent = msg;
      logDiv.appendChild(entry);
      logDiv.scrollTop = logDiv.scrollHeight;
      window.ReactNativeWebView.postMessage("Log: " + msg);
    }

    log("Script starting...");

    // Simple beep function
    function playBeep() {
      log("Attempting to play beep...");
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        log("AudioContext created, state: " + audioContext.state);

        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        // Configure oscillator
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 note

        // Configure gain
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

        // Connect nodes
        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        // Start and stop
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);

        log("Beep should be playing now");
      } catch (error) {
        log("Error playing beep: " + error.message);
      }
    }

    // Test audio context on load
    window.onload = function() {
      log("Window loaded");
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        log("Initial AudioContext created, state: " + audioContext.state);
      } catch (error) {
        log("Error creating initial AudioContext: " + error.message);
      }
    };

    // Handle messages from React Native
    window.addEventListener('message', function(event) {
      log("Received message: " + event.data);
    });

    // Notify React Native that we're ready
    log("Sending ready message");
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ready'
    }));
  </script>
</body>
</html>
`;

// Audio state interface
interface AudioState {
  // State
  isMuted: boolean;
  isMusicMuted: boolean;
  isLoaded: boolean;
  volume: number;

  // Control functions
  toggleMute: () => void;
  toggleMusic: () => void;
  playHit: () => void;
  playReward: () => void;
  playLowBell: () => void;
  playMidBell: () => void;
  playHighBell: () => void;
  playSoundForPosition: (positionType: number) => void;

  // Background music control
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;

  // Lifecycle
  loadSounds: () => Promise<void>;
  unloadSounds: () => Promise<void>;
}

// Create a message channel for audio communication
let audioWebViewRef: WebView | null = null;

// Create the audio store
const useAudio = create<AudioState>((set, get) => ({
  // State
  isMuted: false,
  isMusicMuted: false,
  isLoaded: false,
  volume: 1.0,

  // Control functions
  toggleMute: async () => {
    const { isMuted } = get();
    const newMuted = !isMuted;
    set({ isMuted: newMuted });
    await setStorage("audio_muted", newMuted);
  },

  toggleMusic: async () => {
    const { isMusicMuted } = get();
    const newMusicMuted = !isMusicMuted;
    set({ isMusicMuted: newMusicMuted });
    await setStorage("music_muted", newMusicMuted);

    // Send message to WebView to toggle ocean ambience
    if (audioWebViewRef) {
      audioWebViewRef.postMessage(
        JSON.stringify({
          type: "toggleOcean",
          value: !newMusicMuted,
        })
      );
    }
  },

  playHit: async () => {
    const { isMuted } = get();
    if (isMuted) return;

    // Send message to WebView to play hit sound
    if (audioWebViewRef) {
      audioWebViewRef.postMessage(
        JSON.stringify({
          type: "playHit",
        })
      );
    }
  },

  playReward: async () => {
    const { isMuted } = get();
    if (isMuted) return;

    // Send message to WebView to play reward sound
    if (audioWebViewRef) {
      audioWebViewRef.postMessage(
        JSON.stringify({
          type: "playReward",
        })
      );
    }
  },

  playLowBell: async () => {
    const { isMuted } = get();
    if (isMuted) return;

    // Send message to WebView to play low bell
    if (audioWebViewRef) {
      audioWebViewRef.postMessage(
        JSON.stringify({
          type: "playBell",
          frequency: 440, // A4
        })
      );
    }
  },

  playMidBell: async () => {
    const { isMuted } = get();
    if (isMuted) return;

    // Send message to WebView to play mid bell
    if (audioWebViewRef) {
      audioWebViewRef.postMessage(
        JSON.stringify({
          type: "playBell",
          frequency: 880, // A5
        })
      );
    }
  },

  playHighBell: async () => {
    const { isMuted } = get();
    if (isMuted) return;

    // Send message to WebView to play high bell
    if (audioWebViewRef) {
      audioWebViewRef.postMessage(
        JSON.stringify({
          type: "playBell",
          frequency: 1320, // E6
        })
      );
    }
  },

  playSoundForPosition: (positionType: number) => {
    const { playLowBell, playMidBell, playHighBell } = get();
    switch (positionType) {
      case 0:
        playLowBell();
        break;
      case 1:
        playMidBell();
        break;
      case 2:
        playHighBell();
        break;
    }
  },

  startBackgroundMusic: async () => {
    const { isMusicMuted } = get();
    if (!isMusicMuted) {
      // Ocean ambience is handled by the WebView
    }
  },

  stopBackgroundMusic: async () => {
    // Ocean ambience is handled by the WebView
  },

  loadSounds: async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      set({ isLoaded: true });
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  },

  unloadSounds: async () => {
    try {
      set({ isLoaded: false });
    } catch (error) {
      console.error("Error unloading sounds:", error);
    }
  },
}));

// Audio Engine Component
export const AudioEngine: React.FC = () => {
  const webviewRef = useRef<WebView>(null);

  const sendMessage = useCallback((message: string) => {
    console.log("[React Native] Sending message to WebView:", message);
    if (webviewRef.current) {
      webviewRef.current.postMessage(message);
    } else {
      console.warn("[React Native] WebView ref is not available");
    }
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    console.log(
      "[React Native] Received message from WebView:",
      event.nativeEvent.data
    );
  }, []);

  // Store the WebView reference globally so the audio store can access it
  useEffect(() => {
    audioWebViewRef = webviewRef.current;
    return () => {
      audioWebViewRef = null;
    };
  }, []);

  return (
    <View
      style={{
        height: 300,
        backgroundColor: "#2a2a2a",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <WebView
        ref={webviewRef}
        source={{
          html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                body {
                  background-color: #2a2a2a;
                  color: white;
                  font-family: -apple-system, system-ui;
                  padding: 20px;
                  margin: 0;
                }
                button {
                  background-color: #4a4a4a;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  margin: 5px;
                  cursor: pointer;
                }
                button:hover {
                  background-color: #5a5a5a;
                }
                #log {
                  background-color: #1a1a1a;
                  padding: 10px;
                  border-radius: 5px;
                  margin-top: 10px;
                  height: 150px;
                  overflow-y: auto;
                  font-family: monospace;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div>
                <button onclick="testAudio()">Play Beep</button>
                <button onclick="testBell()">Play Bell</button>
                <button onclick="testOcean()">Play Ocean</button>
              </div>
              <div id="log"></div>

              <script>
                let audioContext = null;
                let oceanNoise = null;
                let bellBuffers = new Map();

                function log(message) {
                  const logDiv = document.getElementById('log');
                  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
                  logDiv.innerHTML += \`[\${timestamp}] \${message}<br>\`;
                  logDiv.scrollTop = logDiv.scrollHeight;
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message }));
                }

                async function initAudioContext() {
                  try {
                    if (!audioContext) {
                      audioContext = new (window.AudioContext || window.webkitAudioContext)();
                      log('AudioContext created');
                      // Pre-generate bell sounds
                      await pregenerateBellSounds();
                    }
                    if (audioContext.state === 'suspended') {
                      await audioContext.resume();
                      log('AudioContext resumed');
                    }
                    return audioContext;
                  } catch (error) {
                    log('Error initializing AudioContext: ' + error.message);
                    throw error;
                  }
                }

                // Pre-generate bell sounds for better performance
                async function pregenerateBellSounds() {
                  try {
                    const ctx = audioContext;
                    const bellFrequencies = [
                      { id: 'low', freq1: 220, freq2: 293.66 },
                      { id: 'mid', freq1: 329.63, freq2: 493.88 },
                      { id: 'high', freq1: 392, freq2: 587.33 },
                      { id: 'reward', freq1: 523.25, freq2: 783.99 }
                    ];
                    
                    for (const bell of bellFrequencies) {
                      await generateBellBuffer(ctx, bell.id, bell.freq1, bell.freq2);
                    }
                    log('Pre-generated all bell sounds');
                  } catch (error) {
                    log('Error pre-generating bell sounds: ' + error.message);
                  }
                }

                // Generate a bell sound buffer
                async function generateBellBuffer(ctx, id, freq1, freq2) {
                  try {
                    const duration = 2.5;
                    const sampleRate = ctx.sampleRate;
                    const bufferSize = duration * sampleRate;
                    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
                    
                    for (let channel = 0; channel < 2; channel++) {
                      const channelData = buffer.getChannelData(channel);
                      
                      for (let i = 0; i < bufferSize; i++) {
                        const t = i / sampleRate;
                        
                        const fundamental = Math.sin(2 * Math.PI * freq1 * t);
                        const harmonic = Math.sin(2 * Math.PI * freq2 * t);
                        
                        let envelope;
                        if (t < 0.01) {
                          envelope = t / 0.01;
                        } else {
                          envelope = Math.exp(-3 * (t - 0.01));
                        }
                        
                        const signal = (fundamental * 0.7 + harmonic * 0.3) * envelope * 0.5;
                        
                        if (channel === 0) {
                          channelData[i] = signal * 0.95;
                        } else {
                          channelData[i] = signal;
                        }
                      }
                    }
                    
                    bellBuffers.set(id, buffer);
                    log(\`Generated bell buffer for \${id}\`);
                  } catch (error) {
                    log(\`Error generating bell buffer for \${id}: \${error.message}\`);
                  }
                }

                async function playBell(frequency = 880) {
                  try {
                    const ctx = await initAudioContext();
                    
                    // Try to use pre-generated buffer first
                    let bellId;
                    if (frequency === 220) bellId = 'low';
                    else if (frequency === 329.63) bellId = 'mid';
                    else if (frequency === 392) bellId = 'high';
                    else if (frequency === 523.25) bellId = 'reward';
                    
                    if (bellId && bellBuffers.has(bellId)) {
                      const source = ctx.createBufferSource();
                      source.buffer = bellBuffers.get(bellId);
                      
                      const gainNode = ctx.createGain();
                      gainNode.gain.value = 0.6;
                      
                      const compressor = ctx.createDynamicsCompressor();
                      compressor.threshold.value = -24;
                      compressor.knee.value = 30;
                      compressor.ratio.value = 12;
                      compressor.attack.value = 0.003;
                      compressor.release.value = 0.25;
                      
                      source.connect(gainNode);
                      gainNode.connect(compressor);
                      compressor.connect(ctx.destination);
                      
                      source.start();
                      log(\`Playing \${bellId} bell from buffer\`);
                      return;
                    }
                    
                    // Fallback to live generation
                    const oscillator1 = ctx.createOscillator();
                    const oscillator2 = ctx.createOscillator();
                    const gainNode1 = ctx.createGain();
                    const gainNode2 = ctx.createGain();
                    const compressor = ctx.createDynamicsCompressor();
                    
                    oscillator1.type = 'sine';
                    oscillator2.type = 'sine';
                    oscillator1.frequency.value = frequency;
                    oscillator2.frequency.value = frequency * 1.5;
                    
                    gainNode1.gain.value = 0.3;
                    gainNode2.gain.value = 0.15;
                    
                    const now = ctx.currentTime;
                    
                    oscillator1.connect(gainNode1);
                    oscillator2.connect(gainNode2);
                    gainNode1.connect(compressor);
                    gainNode2.connect(compressor);
                    compressor.connect(ctx.destination);
                    
                    oscillator1.start(now);
                    oscillator2.start(now);
                    
                    gainNode1.gain.setValueAtTime(0, now);
                    gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.1);
                    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
                    
                    gainNode2.gain.setValueAtTime(0, now);
                    gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.1);
                    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
                    
                    oscillator1.stop(now + 2.5);
                    oscillator2.stop(now + 2.5);
                    
                    log(\`Playing live bell at \${frequency}Hz\`);
                  } catch (error) {
                    log('Error playing bell: ' + error.message);
                  }
                }

                async function playHit() {
                  try {
                    const ctx = await initAudioContext();
                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    oscillator.start();
                    oscillator.stop(ctx.currentTime + 0.2);
                    
                    log('Playing hit sound');
                  } catch (error) {
                    log('Error playing hit sound: ' + error.message);
                  }
                }

                async function playReward() {
                  try {
                    await playBell(523.25); // Use the reward bell sound
                  } catch (error) {
                    log('Error playing reward sound: ' + error.message);
                  }
                }

                async function toggleOcean(value) {
                  try {
                    const ctx = await initAudioContext();
                    if (!value && oceanNoise) {
                      oceanNoise.stop();
                      oceanNoise = null;
                      log('Stopped ocean ambience');
                      return;
                    }
                    
                    if (oceanNoise) {
                      oceanNoise.stop();
                      oceanNoise = null;
                    }
                    
                    const bufferSize = 3 * ctx.sampleRate;
                    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
                    
                    for (let channel = 0; channel < 2; channel++) {
                      const channelData = noiseBuffer.getChannelData(channel);
                      
                      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
                      for (let i = 0; i < bufferSize; i++) {
                        const white = Math.random() * 2 - 1;
                        b0 = 0.99886 * b0 + white * 0.0555179;
                        b1 = 0.99332 * b1 + white * 0.0750759;
                        b2 = 0.96900 * b2 + white * 0.1538520;
                        b3 = 0.86650 * b3 + white * 0.3104856;
                        b4 = 0.55000 * b4 + white * 0.5329522;
                        b5 = -0.7616 * b5 - white * 0.0168980;
                        
                        const wave1 = Math.sin(i * 0.0001) * 0.05;
                        const wave2 = Math.sin(i * 0.00023) * 0.03;
                        const wave3 = Math.sin(i * 0.00047) * 0.02;
                        const pinkNoise = (b0 + b1 + b2 + b3 + b4 + b5) * 0.07;
                        
                        channelData[i] = pinkNoise + wave1 + wave2 + wave3;
                      }
                    }
                    
                    const noise = ctx.createBufferSource();
                    noise.buffer = noiseBuffer;
                    noise.loop = true;
                    
                    const lowpass = ctx.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.value = 800;
                    
                    const highpass = ctx.createBiquadFilter();
                    highpass.type = 'highpass';
                    highpass.frequency.value = 80;
                    
                    const delay = ctx.createDelay();
                    delay.delayTime.value = 0.2;
                    
                    const delayGain = ctx.createGain();
                    delayGain.gain.value = 0.2;
                    
                    const gainNode = ctx.createGain();
                    gainNode.gain.value = 0.25;
                    
                    noise.connect(lowpass);
                    lowpass.connect(highpass);
                    highpass.connect(gainNode);
                    
                    highpass.connect(delay);
                    delay.connect(delayGain);
                    delayGain.connect(gainNode);
                    
                    gainNode.connect(ctx.destination);
                    
                    noise.start();
                    oceanNoise = noise;
                    
                    log('Started ocean ambience');
                  } catch (error) {
                    log('Error toggling ocean: ' + error.message);
                  }
                }

                // Test functions
                async function testAudio() {
                  await playHit();
                }

                async function testBell() {
                  await playBell();
                }

                async function testOcean() {
                  await toggleOcean(true);
                }

                // Initialize and send ready message
                (async () => {
                  try {
                    await initAudioContext();
                    log('Audio engine initialized');
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
                  } catch (error) {
                    log('Error initializing audio engine: ' + error.message);
                  }
                })();

                // Handle messages from React Native
                window.addEventListener('message', async (event) => {
                  try {
                    const message = JSON.parse(event.data);
                    log('Received message: ' + JSON.stringify(message));
                    
                    switch (message.type) {
                      case 'init':
                        await initAudioContext();
                        break;
                      case 'playBell':
                        await playBell(message.frequency);
                        break;
                      case 'playHit':
                        await playHit();
                        break;
                      case 'playReward':
                        await playReward();
                        break;
                      case 'toggleOcean':
                        await toggleOcean(message.value);
                        break;
                      default:
                        log('Unknown message type: ' + message.type);
                    }
                  } catch (error) {
                    log('Error handling message: ' + error.message);
                  }
                });
              </script>
            </body>
          </html>
        `,
        }}
        onMessage={handleMessage}
        style={{ flex: 1 }}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        onLoad={() => {
          console.log("[React Native] WebView loaded");
          setTimeout(() => {
            sendMessage(JSON.stringify({ type: "init" }));
          }, 1000);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("[React Native] WebView error: ", nativeEvent);
        }}
        injectedJavaScript={`
          (function() {
            const originalConsole = {
              log: console.log,
              warn: console.warn,
              error: console.error
            };
            
            console.log = function() {
              originalConsole.log.apply(console, arguments);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'console',
                level: 'log',
                message: Array.from(arguments).join(' ')
              }));
            };
            
            console.warn = function() {
              originalConsole.warn.apply(console, arguments);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'console',
                level: 'warn',
                message: Array.from(arguments).join(' ')
              }));
            };
            
            console.error = function() {
              originalConsole.error.apply(console, arguments);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'console',
                level: 'error',
                message: Array.from(arguments).join(' ')
              }));
            };
            
            true;
          })();
        `}
      />
    </View>
  );
};

// Export the store and components
export { useAudio };
export const audioStore = useAudio;

// Set up audio mode
const setupAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Load sounds when the store is created
    await useAudio.getState().loadSounds();
  } catch (error) {
    console.error("Error setting up audio:", error);
  }
};

// Call setup when the store is created
setupAudio();
