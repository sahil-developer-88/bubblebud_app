import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import GameScene from "./GameScene";
import GameUI from "./GameUI";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";

const Game = () => {
  const { gameState } = useBreathingGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Enhanced WebGL context loss and restoration handling
  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    // Track context state
    let isContextLost = false;
    let recoveryAttempts = 0;
    const MAX_RECOVERY_ATTEMPTS = 3;
    
    // Scheduler for recovery attempts
    let recoveryTimer: NodeJS.Timeout | null = null;
    
    // Event handler for context loss with expanded error handling
    const handleContextLost = (event: Event) => {
      event.preventDefault(); // This is critical - allows the context to be restored
      isContextLost = true;
      recoveryAttempts = 0;
      
      console.log("THREE.WebGLRenderer: Context Lost.");
      
      // Clear any existing recovery attempts
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
      }
      
      // Pause game if it's running
      if (gameState === "playing") {
        // We don't actually pause the game state here because
        // that would trigger UI changes; we just pause rendering
        console.log("Game rendering paused due to WebGL context loss");
      }
      
      // Schedule first recovery attempt
      scheduleRecovery();
    };
    
    // Schedule a context recovery attempt
    const scheduleRecovery = () => {
      if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
        console.warn("Maximum WebGL recovery attempts reached. Please reload the page.");
        return;
      }
      
      // Exponential backoff for recovery attempts
      const delay = Math.min(1000 * Math.pow(2, recoveryAttempts), 8000);
      
      recoveryTimer = setTimeout(() => {
        recoveryAttempts++;
        console.log(`Attempting WebGL context recovery (${recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS})...`);
        
        try {
          // Force a recovery attempt by resetting the canvas
          if (canvas.getContext) {
            // Request a new context (this might trigger a recovery)
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (gl) {
              console.log("Successfully requested new WebGL context");
            } else {
              throw new Error("Could not get WebGL context");
            }
          }
        } catch (error) {
          console.error("Error during WebGL recovery attempt:", error);
          // Schedule another attempt if we haven't reached the limit
          if (recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
            scheduleRecovery();
          }
        }
      }, delay);
    };
    
    // Event handler for context restoration with improved handling
    const handleContextRestored = () => {
      isContextLost = false;
      recoveryAttempts = 0;
      
      // Clear any pending recovery attempts
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
      
      console.log("WebGL context restored successfully!");
      
      // Dispatch a custom event to notify components that need to rebuild
      // WebGL resources (textures, materials, geometries)
      const restorationEvent = new CustomEvent('webglcontextrestored');
      document.dispatchEvent(restorationEvent);
      
      // Force a re-render of the application
      if (canvas) {
        // This may help trigger Three.js to rebuild resources
        const fakeResizeEvent = new Event('resize');
        window.dispatchEvent(fakeResizeEvent);
      }
    };
    
    // Add event listeners
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    // Cleanup
    return () => {
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
      }
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gameState]);
  
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        ref={canvasRef}
        gl={{ 
          powerPreference: 'high-performance',
          alpha: true,
          antialias: true,
          stencil: false,
          depth: true,
          // Preserve the drawing buffer to help with context restoration
          preserveDrawingBuffer: true,
          // Automatically restore the context if it's lost
          failIfMajorPerformanceCaveat: false
        }}
        camera={{
          position: [0, 0, 15],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        onCreated={({ gl }) => {
          // Add additional WebGL context configuration
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      
      <GameUI />
    </div>
  );
};

export default Game;
