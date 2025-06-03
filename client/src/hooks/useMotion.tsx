import { useState, useEffect, useRef } from "react";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";

interface MotionData {
  alpha: number | undefined; // Z-axis rotation (0-360)
  beta: number | undefined;  // X-axis rotation (-180 to 180)
  gamma: number | undefined; // Y-axis rotation (-90 to 90)
  acceleration: {
    x: number | undefined;
    y: number | undefined;
    z: number | undefined;
  };
}

interface CalibrationData {
  beta: number | undefined;
  gamma: number | undefined;
}

export const useMotion = () => {
  const { gameState } = useBreathingGame();
  const [motion, setMotion] = useState<MotionData>({
    alpha: undefined,
    beta: undefined,
    gamma: undefined,
    acceleration: {
      x: undefined,
      y: undefined,
      z: undefined
    }
  });
  
  // Store the baseline/calibration values
  const [calibration, setCalibration] = useState<CalibrationData>({
    beta: undefined,
    gamma: undefined
  });
  
  // Flag to track if we've calibrated yet
  const hasCalibrated = useRef(false);
  const calibrationTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Motion smoothing using exponential moving average
  const smoothingFactor = 0.2; // Lower = more smoothing
  
  // When the game starts, use the initial position for calibration immediately
  useEffect(() => {
    if (gameState === "playing" && !hasCalibrated.current) {
      console.log("Game started - calibrating your current position");
      
      // Calibrate immediately - the user should already be in the end-of-exhale position
      if (motion.beta !== undefined && motion.gamma !== undefined) {
        console.log(`Calibrating with initial position: beta=${motion.beta}, gamma=${motion.gamma}`);
        setCalibration({
          beta: motion.beta,
          gamma: motion.gamma
        });
        hasCalibrated.current = true;
        console.log("✓ Calibration complete! This position is now the lowest point (end of exhale)");
      }
    }
    
    return () => {
      if (calibrationTimer.current) {
        clearTimeout(calibrationTimer.current);
      }
    };
  }, [gameState, motion.beta, motion.gamma]);
  
  // Handle device orientation event
  useEffect(() => {
    // Throttling configuration - use a lower frequency to save battery
    const updateFrequency = 30; // Hz - Using 30Hz instead of 60Hz saves battery while still being responsive
    const throttleInterval = 1000 / updateFrequency; // ms between updates
    
    // Track the last time we updated
    let lastOrientationUpdate = 0;
    let lastMotionUpdate = 0;
    
    // Event queues for batching
    let pendingOrientationEvent: DeviceOrientationEvent | null = null;
    let pendingMotionEvent: DeviceMotionEvent | null = null;
    
    // Process any queued device orientation events
    const processOrientation = (timestamp: number) => {
      if (!pendingOrientationEvent) return;
      
      const event = pendingOrientationEvent;
      pendingOrientationEvent = null;
      
      setMotion(prev => {
        // Apply smoothing to raw values
        const smoothedBeta = event.beta !== null
          ? prev.beta !== undefined
            ? prev.beta * (1 - smoothingFactor) + event.beta * smoothingFactor
            : event.beta
          : prev.beta;
          
        const smoothedGamma = event.gamma !== null
          ? prev.gamma !== undefined
            ? prev.gamma * (1 - smoothingFactor) + event.gamma * smoothingFactor
            : event.gamma
          : prev.gamma;
        
        // Calculate calibrated values
        const calibratedBeta = smoothedBeta;
        const calibratedGamma = smoothedGamma;
          
        return {
          alpha: event.alpha !== null
            ? prev.alpha !== undefined
              ? prev.alpha * (1 - smoothingFactor) + event.alpha * smoothingFactor
              : event.alpha
            : prev.alpha,
          beta: calibratedBeta,
          gamma: calibratedGamma,
          acceleration: prev.acceleration
        };
      });
    };
    
    // Process any queued device motion events
    const processMotion = (timestamp: number) => {
      if (!pendingMotionEvent) return;
      
      const event = pendingMotionEvent;
      pendingMotionEvent = null;
      
      const acceleration = event.accelerationIncludingGravity;
      
      if (acceleration) {
        setMotion(prev => ({
          ...prev,
          acceleration: {
            x: acceleration.x !== null
              ? prev.acceleration.x !== undefined
                ? prev.acceleration.x * (1 - smoothingFactor) + acceleration.x * smoothingFactor
                : acceleration.x
              : prev.acceleration.x,
            y: acceleration.y !== null
              ? prev.acceleration.y !== undefined
                ? prev.acceleration.y * (1 - smoothingFactor) + acceleration.y * smoothingFactor
                : acceleration.y
              : prev.acceleration.y,
            z: acceleration.z !== null
              ? prev.acceleration.z !== undefined
                ? prev.acceleration.z * (1 - smoothingFactor) + acceleration.z * smoothingFactor
                : acceleration.z
              : prev.acceleration.z
          }
        }));
      }
    };
    
    // Throttled event handlers - these just queue the latest event
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const now = performance.now();
      
      // Store the latest event
      pendingOrientationEvent = event;
      
      // Only process at the throttle interval
      if (now - lastOrientationUpdate >= throttleInterval) {
        lastOrientationUpdate = now;
        processOrientation(now);
      }
    };
    
    const handleMotion = (event: DeviceMotionEvent) => {
      const now = performance.now();
      
      // Store the latest event
      pendingMotionEvent = event;
      
      // Only process at the throttle interval
      if (now - lastMotionUpdate >= throttleInterval) {
        lastMotionUpdate = now;
        processMotion(now);
      }
    };
    
    // Process any pending events on each animation frame
    // This ensures we don't miss important motion data even with throttling
    const rafCallback = (timestamp: number) => {
      const now = performance.now();
      
      if (now - lastOrientationUpdate >= throttleInterval && pendingOrientationEvent) {
        lastOrientationUpdate = now;
        processOrientation(now);
      }
      
      if (now - lastMotionUpdate >= throttleInterval && pendingMotionEvent) {
        lastMotionUpdate = now;
        processMotion(now);
      }
      
      rafId = requestAnimationFrame(rafCallback);
    };
    
    // Start the animation frame loop
    let rafId = requestAnimationFrame(rafCallback);
    
    // Check if the events are supported
    const isOrientationSupported = 'DeviceOrientationEvent' in window;
    const isMotionSupported = 'DeviceMotionEvent' in window;
    
    if (isOrientationSupported) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      console.warn('Device orientation not supported on this device');
    }
    
    if (isMotionSupported) {
      window.addEventListener('devicemotion', handleMotion);
    } else {
      console.warn('Device motion not supported on this device');
    }
    
    // Debug logging - reduced frequency to improve performance
    const debugInterval = setInterval(() => {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Motion data:', motion);
        if (calibration.beta !== undefined) {
          console.log('Calibration values:', calibration);
        }
      }
    }, 5000); // Reduced to every 5 seconds instead of every 1 second
    
    return () => {
      if (isOrientationSupported) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      
      if (isMotionSupported) {
        window.removeEventListener('devicemotion', handleMotion);
      }
      
      // Cancel the animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Clear the debug interval
      clearInterval(debugInterval);
    };
  }, []);
  
  // Return both raw motion data and calibration information
  return {
    ...motion,
    isCalibrated: hasCalibrated.current,
    calibration
  };
};
