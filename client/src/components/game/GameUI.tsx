import { useState, useEffect } from "react";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { useAudio } from "@/lib/stores/useAudio";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2 } from "lucide-react";

// Custom breathing instruction component that appears below the score
const BreathingInstruction = ({ instruction }: { instruction: string }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Reset visibility when instruction changes
    setVisible(true);
    
    // Fade out after duration
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [instruction]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 top-20 animate-fade-in-out">
      <div className="text-white text-3xl font-bold">{instruction}</div>
    </div>
  );
};

const GameUI = () => {
  const { gameState, score, restartGame, averageBreathRate } = useBreathingGame();
  const { isMuted, toggleMute } = useAudio();
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const [breathInstruction, setBreathInstruction] = useState<string | null>(null);
  
  // Convert game time to formatted minutes:seconds
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Completely redone breathing instructions with a timed sequence
  useEffect(() => {
    if (gameState === "playing") {
      console.log("Starting breath cycle with timed instructions");
      
      // Initial state - clear any existing instruction
      setBreathInstruction(null);
      
      // One second delay before starting
      const initialDelay = setTimeout(() => {
        // First 5 seconds: "Breathe In"
        setBreathInstruction("Breathe In");
        console.log("Instruction changed to: Breathe In");
        
        // After 5 seconds: "Breathe Out" (at 6s mark)
        const breathOutTimer1 = setTimeout(() => {
          setBreathInstruction("Breathe Out");
          console.log("Instruction changed to: Breathe Out");
          
          // After 5 more seconds: "Breathe In" again (at 11s mark)
          const breathInTimer2 = setTimeout(() => {
            setBreathInstruction("Breathe In");
            console.log("Instruction changed to: Breathe In");
            
            // After 5 more seconds: "Breathe Out" again (at 16s mark)
            const breathOutTimer2 = setTimeout(() => {
              setBreathInstruction("Breathe Out");
              console.log("Instruction changed to: Breathe Out");
              
              // After 5 more seconds: "That's It!" (at 21s mark)
              const thatsItTimer = setTimeout(() => {
                setBreathInstruction("That's It!");
                console.log("Instruction changed to: That's It!");
                
                // After 5 more seconds: Clear instruction (at 26s mark)
                const clearTimer = setTimeout(() => {
                  setBreathInstruction(null);
                  console.log("Cleared breathing instructions");
                }, 5000);
                
                return () => clearTimeout(clearTimer);
              }, 5000);
              
              return () => clearTimeout(thatsItTimer);
            }, 5000);
            
            return () => clearTimeout(breathOutTimer2);
          }, 5000);
          
          return () => clearTimeout(breathInTimer2);
        }, 5000);
        
        return () => clearTimeout(breathOutTimer1);
      }, 1000);
      
      // Clean up all timers when component unmounts or game state changes
      return () => {
        clearTimeout(initialDelay);
      };
    }
  }, [gameState]);
  
  // Removed orientation warning as requested
  
  // Show restart prompt after 3 minutes of gameplay
  useEffect(() => {
    if (gameState === "playing" && averageBreathRate > 0) {
      const checkGameDuration = setInterval(() => {
        setShowRestartPrompt(true);
        
        toast("How are you feeling? Continue or start a new session?", {
          duration: 10000,
          action: {
            label: "Continue",
            onClick: () => setShowRestartPrompt(false)
          }
        });
        
      }, 180000); // 3 minutes
      
      return () => clearInterval(checkGameDuration);
    }
  }, [gameState, averageBreathRate, setShowRestartPrompt]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top bar with score and controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        {/* Score display - rounded corners and reduced opacity */}
        <div className="bg-amber-700/70 text-white/90 px-6 py-3 rounded-2xl shadow-md pointer-events-auto flex items-center">
          <div className="mr-2">
            <span className="text-amber-200 text-2xl font-bold">{score}</span>
          </div>
          <div>
            <span className="font-bold text-sm uppercase tracking-wide">Coins</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Sound toggle button */}
          <Button 
            className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-70 p-0 pointer-events-auto"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Breathing instruction - centered below score */}
      {breathInstruction && <BreathingInstruction instruction={breathInstruction} />}
      
      {/* Breathing rate display (if we have data) */}
      {averageBreathRate > 0 && (
        <div className="absolute bottom-4 left-4 bg-amber-700/70 text-white/90 px-4 py-2 rounded-2xl shadow-md">
          <span>Breath rate: {averageBreathRate.toFixed(1)} breaths/min</span>
        </div>
      )}
      
      {/* Restart game button */}
      {showRestartPrompt && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
            onClick={restartGame}
          >
            New Session
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
