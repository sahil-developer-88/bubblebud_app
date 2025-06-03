import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader } from "@react-three/drei";
import { queryClient } from "./lib/queryClient";
import GameScene from "./components/game/GameScene";
import GameUI from "./components/game/GameUI";
import { useBreathingGame } from "./lib/stores/useBreathingGame";
import { useAudio } from "./lib/stores/useAudio";
import { Button } from "./components/ui/button";
import "@fontsource/inter";
import { Toaster } from "sonner";
import Confetti from "react-confetti";
import { Volume2, VolumeX, Waves, Clock, ChevronLeft, ChevronRight, Lightbulb as LightbulbIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

function App() {
  const [showPermissionRequest, setShowPermissionRequest] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { gameState, startGame, endGame, restartGame, sessionStats, sessionDuration } = useBreathingGame();
  const { 
    isMuted, 
    toggleMute, 
    isMusicMuted, 
    toggleMusic, 
    startBackgroundMusic, 
    stopBackgroundMusic, 
    playReward 
  } = useAudio();

  // Initialize audio files
  useEffect(() => {
    // Initialize hit sound
    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.preload = 'auto';
    
    // Initialize reward sound for end of session
    const rewardSound = new Audio('/sounds/success.mp3');
    rewardSound.preload = 'auto';
    
    // Store the sounds in the audio store
    useAudio.setState({ hitSound, rewardSound });
    
    // Clean up on unmount
    return () => {
      // Clean up handled in the audio store
    };
  }, []);
  
  // Handle background music start after user interaction
  const handleUserInteraction = () => {
    // This must be called from a user interaction event handler
    startBackgroundMusic();
  };
  
  // Play reward sound and stop background music when session ends
  useEffect(() => {
    if (gameState === "ended" && sessionStats) {
      // Play the success sound
      playReward();
      
      // Stop the ocean ambient sound
      stopBackgroundMusic();
    }
  }, [gameState, sessionStats, playReward, stopBackgroundMusic]);
  
  // Timer for session countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState === "playing" && sessionDuration > 0) {
      // Set initial time left (sessionDuration in minutes)
      setTimeLeft(sessionDuration * 60);
      
      // Update every second
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, sessionDuration]);

  // We're now using the Web Audio API for the meditation bell sounds
  // These are generated in real-time with proper harmonics for a more pleasing
  // meditative sound at different pitches (low, mid, high)

  const handleStartSession = async (duration: number) => {
    try {
      // This is a user interaction, so we can start the background music
      // This also ensures the audio context is resumed on mobile browsers
      startBackgroundMusic();
      
      // Pre-trigger a coin sound to initialize the audio context
      // and ensure sounds will play properly during gameplay
      if (!isMuted) {
        // This forces the Web Audio API context to activate
        useAudio.getState().playMidBell();
      }

      // Request device motion and orientation permissions
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        
        if (permissionState === 'granted') {
          console.log(`Device motion permission granted - starting ${duration} minute session`);
          setShowPermissionRequest(false);
          startGame(duration); // This will start the game and trigger calibration
        } else {
          console.warn('Device motion permission denied');
        }
      } else {
        // For browsers that don't require permission
        console.log(`Device motion permission not required - starting ${duration} minute session`);
        setShowPermissionRequest(false);
        startGame(duration); // This will start the game and trigger calibration
      }
    } catch (error) {
      console.error('Error requesting device motion permission:', error);
    }
  };

  // Show confetti for great scores (≥ 80%)
  const showConfetti = gameState === "ended" && sessionStats && sessionStats.score >= 80;

  return (
    <QueryClientProvider client={queryClient}>
      {showPermissionRequest ? (
        // Initial screen - session duration selection
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-400 to-purple-500">
          <div className="max-w-md text-center text-white">
            <div className="flex justify-center mb-0 mt-6">
              <div className="relative w-32 h-32 bg-sky-300/20 rounded-full shadow-lg glow-bubble overflow-hidden animate-float">
                <div className="absolute inset-1 flex items-center justify-center animate-subtle-tilt">
                  <div className="w-28 h-28 bg-sky-400 rounded-full flex items-center justify-center overflow-hidden">
                    <div className="w-5 h-5 bg-black rounded-full absolute top-8 left-8"></div>
                    <div className="w-5 h-5 bg-black rounded-full absolute top-8 right-8"></div>
                    <div className="w-12 h-6 bg-black rounded-b-full absolute top-16 left-8 smile"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 w-5 h-5 bg-white/30 rounded-full"></div>
                <div className="absolute top-6 left-4 w-4 h-4 bg-white/30 rounded-full"></div>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-2 -mt-6">BubbleBuddy<sup className="text-base">TM</sup></h1>
            <h2 className="text-2xl mb-6">Belly Breathing Trainer</h2>
            
            <div className="bg-white/20 rounded-2xl p-4 mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">How to use:</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-yellow-400 hover:bg-yellow-500">
                      <LightbulbIcon className="h-5 w-5" />
                      <span className="sr-only">Tips</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-3xl" style={{ backgroundColor: "#fce7f3" }}>
                    <DialogHeader>
                      <DialogTitle>Tips for Best Results</DialogTitle>
                    </DialogHeader>
                    <div className="w-full">
                      {/* We'll replace the tabs with a simple two-panel system */}
                      <div className="w-full">
                        <div className="flex justify-between mb-4 border-b pb-2">
                          <button 
                            className="px-4 py-2 text-pink-600 font-medium border-b-2 border-pink-600" 
                            id="btn-calibration"
                            onClick={() => {
                              document.getElementById('panel-calibration')?.classList.remove('hidden');
                              document.getElementById('panel-position')?.classList.add('hidden');
                              document.getElementById('panel-breathing')?.classList.add('hidden');
                              document.getElementById('btn-calibration')?.classList.add('border-b-2', 'border-pink-600');
                              document.getElementById('btn-position')?.classList.remove('border-b-2', 'border-pink-600');
                              document.getElementById('btn-breathing')?.classList.remove('border-b-2', 'border-pink-600');
                            }}
                          >
                            Calibration
                          </button>
                          <button 
                            className="px-4 py-2 text-pink-600 font-medium" 
                            id="btn-position"
                            onClick={() => {
                              document.getElementById('panel-calibration')?.classList.add('hidden');
                              document.getElementById('panel-position')?.classList.remove('hidden');
                              document.getElementById('panel-breathing')?.classList.add('hidden');
                              document.getElementById('btn-calibration')?.classList.remove('border-b-2', 'border-pink-600');
                              document.getElementById('btn-position')?.classList.add('border-b-2', 'border-pink-600');
                              document.getElementById('btn-breathing')?.classList.remove('border-b-2', 'border-pink-600');
                            }}
                          >
                            Position
                          </button>
                          <button 
                            className="px-4 py-2 text-pink-600 font-medium" 
                            id="btn-breathing"
                            onClick={() => {
                              document.getElementById('panel-calibration')?.classList.add('hidden');
                              document.getElementById('panel-position')?.classList.add('hidden');
                              document.getElementById('panel-breathing')?.classList.remove('hidden');
                              document.getElementById('btn-calibration')?.classList.remove('border-b-2', 'border-pink-600');
                              document.getElementById('btn-position')?.classList.remove('border-b-2', 'border-pink-600');
                              document.getElementById('btn-breathing')?.classList.add('border-b-2', 'border-pink-600');
                            }}
                          >
                            Breathing
                          </button>
                        </div>
                        
                        {/* Calibration Panel */}
                        <div id="panel-calibration" className="space-y-4 py-4 text-left">
                          <p>Make sure your phone is already positioned on your belly <strong>before</strong> you tap a session button.</p>
                          <p>When you tap a session button, the app takes a snapshot of the current position of your phone in space and calibrates for your belly and phone before the game starts.</p>
                          <p>Let out a soft, natural breath before tapping - this sets your baseline position.</p>
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 rounded-xl text-pink-600 border-pink-300 hover:bg-pink-50"
                              onClick={() => {
                                document.getElementById('panel-calibration')?.classList.add('hidden');
                                document.getElementById('panel-position')?.classList.remove('hidden');
                                document.getElementById('btn-calibration')?.classList.remove('border-b-2', 'border-pink-600');
                                document.getElementById('btn-position')?.classList.add('border-b-2', 'border-pink-600');
                              }}
                            >
                              Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Position Panel */}
                        <div id="panel-position" className="space-y-4 py-4 hidden">
                          <div className="text-center mb-3">
                            <h3 className="text-lg font-medium">Comfortable Position</h3>
                            <p className="text-sm text-gray-500">Make sure you are nice and comfy and that your neck is supported with pillows or a chair</p>
                          </div>
                          <div className="flex justify-center">
                            <img 
                              src="/images/IMG_8329.jpeg" 
                              alt="Person lying comfortably with neck supported" 
                              className="max-w-full h-auto"
                              style={{ 
                                maxHeight: "300px",
                                borderRadius: "24px",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                              }}
                              loading="eager"
                            />
                          </div>
                          <div className="flex justify-between">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 rounded-xl text-pink-600 border-pink-300 hover:bg-pink-50"
                              onClick={() => {
                                document.getElementById('panel-calibration')?.classList.remove('hidden');
                                document.getElementById('panel-position')?.classList.add('hidden');
                                document.getElementById('btn-calibration')?.classList.add('border-b-2', 'border-pink-600');
                                document.getElementById('btn-position')?.classList.remove('border-b-2', 'border-pink-600');
                              }}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 rounded-xl text-pink-600 border-pink-300 hover:bg-pink-50"
                              onClick={() => {
                                document.getElementById('panel-position')?.classList.add('hidden');
                                document.getElementById('panel-breathing')?.classList.remove('hidden');
                                document.getElementById('btn-position')?.classList.remove('border-b-2', 'border-pink-600');
                                document.getElementById('btn-breathing')?.classList.add('border-b-2', 'border-pink-600');
                              }}
                            >
                              Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Breathing Panel */}
                        <div id="panel-breathing" className="space-y-4 py-4 hidden">
                          <div className="text-center mb-3">
                            <h3 className="text-lg font-medium">Breathing Speed Benefits</h3>
                          </div>
                          <div className="space-y-4">
                            <p>If you collect all the coins, you'll be breathing at <span className="font-bold">six breaths per minute</span>, which is proven to have many health benefits, including:</p>
                            <ul className="list-disc pl-5 space-y-2">
                              <li>Reduced stress and anxiety</li>
                              <li>Improved focus and concentration</li>
                              <li>Lower blood pressure</li>
                              <li>Better sleep quality</li>
                              <li>Enhanced emotional regulation</li>
                            </ul>
                            <p className="mt-4">If you want to know more, visit <a 
                              href="https://www.AriaBreath.com" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-pink-600 font-bold hover:text-pink-700 underline"
                            >AriaBreath.com</a> for more breathing exercises and techniques.</p>
                          </div>
                          <div className="flex justify-start">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 rounded-xl text-pink-600 border-pink-300 hover:bg-pink-50"
                              onClick={() => {
                                document.getElementById('panel-position')?.classList.remove('hidden');
                                document.getElementById('panel-breathing')?.classList.add('hidden');
                                document.getElementById('btn-position')?.classList.add('border-b-2', 'border-pink-600');
                                document.getElementById('btn-breathing')?.classList.remove('border-b-2', 'border-pink-600');
                              }}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <ol className="text-left space-y-2 text-lg">
                <li className="flex items-start">
                  <span className="mr-2 font-bold">1.</span>
                  <span><span className="font-bold">Get comfy</span>, supported on a bed or sofa</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">2.</span>
                  <span>Rest the <span className="font-bold">phone on your belly</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">3.</span>
                  <span>Let out a soft, natural <span className="font-bold">breath</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">4.</span>
                  <span><span className="font-bold">Tap</span> your session length</span>
                </li>
              </ol>
            </div>
            
            <div className="flex flex-col space-y-4 mb-4 mt-8">
              <Button 
                className="px-8 py-6 text-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-2xl shadow-lg glow"
                onClick={() => handleStartSession(5)}
              >
                5 Minutes
              </Button>
              <Button 
                className="px-8 py-6 text-xl bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-lg glow"
                onClick={() => handleStartSession(10)}
              >
                10 Minutes
              </Button>
              <Button 
                className="px-8 py-6 text-xl bg-purple-500 hover:bg-purple-600 text-white rounded-2xl shadow-lg glow"
                onClick={() => handleStartSession(15)}
              >
                15 Minutes
              </Button>
            </div>
          </div>
        </div>
      ) : gameState === "ended" ? (
        // Session summary screen
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-400 to-purple-500">
          {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
          
          <div className="max-w-md text-center bg-white/20 rounded-2xl p-8 text-white">
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 bg-sky-300/20 rounded-full shadow-lg glow-bubble overflow-hidden animate-float">
                <div className="absolute inset-1 flex items-center justify-center animate-subtle-tilt">
                  <div className="w-20 h-20 bg-sky-400 rounded-full flex items-center justify-center overflow-hidden">
                    <div className="w-4 h-4 bg-black rounded-full absolute top-6 left-6"></div>
                    <div className="w-4 h-4 bg-black rounded-full absolute top-6 right-6"></div>
                    <div className="w-10 h-5 bg-black rounded-b-full absolute top-12 left-5 smile"></div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 w-4 h-4 bg-white/30 rounded-full"></div>
                <div className="absolute top-4 left-3 w-3 h-3 bg-white/30 rounded-full"></div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-6">Session Complete!</h1>
            
            {sessionStats && (
              <div className="mt-6 mb-8">
                <div className="text-5xl font-bold mb-4 bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 text-black inline-block px-6 py-2 rounded-xl gold-glow">{sessionStats.score}%</div>
                <p className="text-xl mb-6">
                  {sessionStats.score === 100 
                    ? `Perfect! You collected all ${sessionStats.collectedCoins} coins` 
                    : `You collected ${sessionStats.collectedCoins} out of ${sessionStats.totalCoins} coins`
                  }
                </p>
                
                <div className="bg-white/20 rounded-2xl p-4 mb-6">
                  <h3 className="text-xl font-semibold mb-2">Session Details:</h3>
                  <ul className="text-left">
                    <li className="flex justify-between">
                      <span>Session Length:</span>
                      <span>{sessionStats.duration} minutes</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Actual Duration:</span>
                      <span>{Math.floor(sessionStats.actualDuration / 60)}:{(sessionStats.actualDuration % 60).toString().padStart(2, '0')}</span>
                    </li>
                  </ul>
                </div>
                
                {sessionStats.score >= 80 ? (
                  <p className="text-xl font-bold text-yellow-300">Great job! 🎉</p>
                ) : sessionStats.score >= 50 ? (
                  <p className="text-xl">Good effort! Keep practicing!</p>
                ) : (
                  <p className="text-xl">Practice makes perfect! Try again.</p>
                )}
              </div>
            )}
            
            <div className="flex flex-col items-center justify-center space-y-6">
              <Button 
                className="px-6 py-4 text-lg bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-lg glow"
                onClick={() => {
                  restartGame();
                  setShowPermissionRequest(true);
                }}
              >
                New Session
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-white mb-2">
                  If you're enjoying BubbleBuddy<br/>
                  you'll love Aria Breath!
                </p>
                <Button 
                  className="px-4 py-2 text-sm bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-2xl shadow-lg glow"
                  onClick={() => window.open('https://www.AriaBreath.com', '_blank')}
                >
                  Explore More
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Game screen
        <>
          <Canvas
            shadows
            camera={{
              position: [0, 0, 15],
              fov: 60,
              near: 0.1,
              far: 1000
            }}
          >
            <Suspense fallback={null}>
              <GameScene />
            </Suspense>
          </Canvas>
          
          <GameUI />
          <Loader />
          <Toaster position="top-center" />
          
          {/* Game control buttons */}
          <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
            <div className="flex items-center space-x-4 mb-2">
              {/* Ocean sound toggle button */}
              <Button 
                className="p-2 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-2xl"
                onClick={toggleMusic}
                title={isMusicMuted ? "Unmute ocean sounds" : "Mute ocean sounds"}
              >
                {isMusicMuted ? <Waves size={24} stroke="#888" /> : <Waves size={24} />}
              </Button>
              
              {/* Bell sound toggle button */}
              <Button 
                className="p-2 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-2xl"
                onClick={toggleMute}
                title={isMuted ? "Unmute bell sounds" : "Mute bell sounds"}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </Button>
              
              {/* End session button */}
              <Button 
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg"
                onClick={endGame}
              >
                End Session
              </Button>
            </div>
            
            {/* Timer display */}
            <div className="flex items-center bg-gray-700/50 text-white rounded-2xl px-3 py-1 text-sm">
              <Clock size={16} className="mr-2" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
          
          {/* Aria Breath branding */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center z-10">
            <p className="text-white text-base mb-1">A breathing game from</p>
            <img 
              src="/images/aria-breath-logo.png" 
              alt="Aria Breath" 
              className="h-16 w-auto"
            />
          </div>
        </>
      )}
    </QueryClientProvider>
  );
}

export default App;
