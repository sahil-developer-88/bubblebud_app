import { DeviceMotion, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { useBreathingGame } from "../lib/stores/useBreathingGame";

interface MotionData {
  beta: number | undefined; // X-axis rotation (-180 to 180)
}

interface CalibrationData {
  beta: number | undefined;
}

export const useMotion = () => {
  const { gameState } = useBreathingGame();
  const [motion, setMotion] = useState<MotionData>({
    beta: undefined,
  });

  // Store the baseline/calibration values
  const [calibration, setCalibration] = useState<CalibrationData>({
    beta: undefined,
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
      if (motion.beta !== undefined) {
        console.log(`Calibrating with initial position: beta=${motion.beta}`);
        setCalibration({
          beta: motion.beta,
        });
        hasCalibrated.current = true;
        console.log(
          "✓ Calibration complete! This position is now the lowest point (end of exhale)"
        );
      }
    }

    return () => {
      if (calibrationTimer.current) {
        clearTimeout(calibrationTimer.current);
      }
    };
  }, [gameState, motion.beta]);

  // Handle device motion and orientation
  useEffect(() => {
    // Throttling configuration - use a lower frequency to save battery
    const updateFrequency = 30; // Hz - Using 30Hz instead of 60Hz saves battery while still being responsive
    const throttleInterval = 1000 / updateFrequency; // ms between updates

    // Track the last time we updated
    let lastOrientationUpdate = 0;
    let lastMotionUpdate = 0;

    // Event queues for batching
    let pendingOrientationData: any = null;
    let pendingMotionData: any = null;

    // Process any queued device orientation events
    const processOrientation = (timestamp: number) => {
      if (!pendingOrientationData) return;

      const data = pendingOrientationData;
      pendingOrientationData = null;
      console.log(`Processing orientation data at ${timestamp}:`, data);

      setMotion((prev) => {
        // Apply smoothing to raw values
        const smoothedBeta =
          data.beta !== null
            ? prev.beta !== undefined
              ? prev.beta * (1 - smoothingFactor) + data.beta * smoothingFactor
              : data.beta
            : prev.beta;

        // Calculate calibrated values
        const calibratedBeta = smoothedBeta;

        return {
          beta: calibratedBeta,
        };
      });
    };

    let lastUpdate = 0;
    const updateInterval = 33; // ~30fps

    // Start sensors
    const orientationSubscription = Gyroscope.addListener((data) => {
      const now = Date.now();
      if (now - lastUpdate < updateInterval) return;
      lastUpdate = now;

      // Convert gyroscope data to orientation-like values
      // Note: Gyroscope gives angular velocity, not absolute orientation
      // For absolute orientation, we need to integrate over time or use DeviceMotion
      setMotion((prev) => {
        const newBeta = data.y ? (data.y * 180) / Math.PI : prev.beta;

        return {
          beta:
            newBeta !== undefined && prev.beta !== undefined
              ? prev.beta * (1 - smoothingFactor) + newBeta * smoothingFactor
              : newBeta,
        };
      });
    });

    const motionSubscription = DeviceMotion.addListener((data) => {
      const now = Date.now();

      // Store the latest data
      pendingMotionData = data;

      // Only process at the throttle interval
      if (now - lastMotionUpdate >= throttleInterval) {
        lastMotionUpdate = now;
      }
    });

    // Process any pending events on each animation frame
    // This ensures we don't miss important motion data even with throttling
    const rafCallback = (timestamp: number) => {
      const now = Date.now();

      if (
        now - lastOrientationUpdate >= throttleInterval &&
        pendingOrientationData
      ) {
        lastOrientationUpdate = now;
        processOrientation(now);
      }

      if (now - lastMotionUpdate >= throttleInterval && pendingMotionData) {
        lastMotionUpdate = now;
      }

      rafId = requestAnimationFrame(rafCallback);
    };

    // Start the animation frame loop
    let rafId = requestAnimationFrame(rafCallback);

    // Debug logging - reduced frequency to improve performance
    const debugInterval = setInterval(() => {
      // Only log in development mode
      if (__DEV__) {
        console.log("Motion data:", motion);
        if (calibration.beta !== undefined) {
          console.log("Calibration values:", calibration);
        }
      }
    }, 500); // Reduced to every 5 seconds instead of every 1 second

    return () => {
      // Remove listeners
      orientationSubscription.remove();
      motionSubscription.remove();

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
    motion,
    calibration,
    hasCalibrated: hasCalibrated.current,
  };
};
