import { useState, useEffect, useRef, useCallback } from "react";
import { useBreathingGame } from "../lib/stores/useBreathingGame";
import { DeviceMotion, Gyroscope } from "expo-sensors";

// Constants moved outside hook to prevent recreation
const SENSOR_CONFIG = {
  UPDATE_FREQUENCY: 30, // Hz
  SMOOTHING_FACTOR: 0.2,
  DEBUG_INTERVAL: 5000, // ms
} as const;

const THROTTLE_INTERVAL = 1000 / SENSOR_CONFIG.UPDATE_FREQUENCY;

interface MotionData {
  alpha: number | undefined;
  beta: number | undefined;
  gamma: number | undefined;
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

interface SensorState {
  lastOrientationUpdate: number;
  lastMotionUpdate: number;
  pendingOrientationData: any;
  pendingMotionData: any;
}

// Initial state factories to prevent object recreation
const createInitialMotionData = (): MotionData => ({
  alpha: undefined,
  beta: undefined,
  gamma: undefined,
  acceleration: {
    x: undefined,
    y: undefined,
    z: undefined,
  },
});

const createInitialCalibrationData = (): CalibrationData => ({
  beta: undefined,
  gamma: undefined,
});

const createInitialSensorState = (): SensorState => ({
  lastOrientationUpdate: 0,
  lastMotionUpdate: 0,
  pendingOrientationData: null,
  pendingMotionData: null,
});

// Utility function for smoothing values
const applySmoothingValue = (
  currentValue: number | undefined,
  newValue: number | null,
  factor: number
): number | undefined => {
  if (newValue === null) return currentValue;
  if (currentValue === undefined) return newValue;
  return currentValue * (1 - factor) + newValue * factor;
};

export const useMotion = () => {
  const { gameState } = useBreathingGame();

  // State initialization with factory functions
  const [motion, setMotion] = useState(createInitialMotionData);
  const [calibration, setCalibration] = useState(createInitialCalibrationData);

  // Refs for persistent data
  const hasCalibrated = useRef(false);
  const calibrationTimer = useRef<NodeJS.Timeout | null>(null);
  const sensorState = useRef(createInitialSensorState());
  const rafId = useRef<number | undefined>(undefined);
  const debugInterval = useRef<NodeJS.Timeout | null>(null);

  // Memoized calibration function
  const performCalibration = useCallback((beta: number, gamma: number) => {
    console.log(
      `Calibrating with initial position: beta=${beta}, gamma=${gamma}`
    );
    setCalibration({ beta, gamma });
    hasCalibrated.current = true;
    console.log(
      "✓ Calibration complete! This position is now the lowest point (end of exhale)"
    );
  }, []);

  // Optimized motion processing functions
  const processOrientation = useCallback((timestamp: number) => {
    const state = sensorState.current;
    if (!state.pendingOrientationData) return;

    const data = state.pendingOrientationData;
    state.pendingOrientationData = null;

    setMotion((prev) => {
      const smoothedBeta = applySmoothingValue(
        prev.beta,
        data.beta,
        SENSOR_CONFIG.SMOOTHING_FACTOR
      );
      const smoothedGamma = applySmoothingValue(
        prev.gamma,
        data.gamma,
        SENSOR_CONFIG.SMOOTHING_FACTOR
      );
      const smoothedAlpha = applySmoothingValue(
        prev.alpha,
        data.alpha,
        SENSOR_CONFIG.SMOOTHING_FACTOR
      );

      return {
        alpha: smoothedAlpha,
        beta: smoothedBeta,
        gamma: smoothedGamma,
        acceleration: prev.acceleration,
      };
    });
  }, []);

  const processMotion = useCallback((timestamp: number) => {
    const state = sensorState.current;
    if (!state.pendingMotionData) return;

    const data = state.pendingMotionData;
    state.pendingMotionData = null;

    const acceleration = data.acceleration;
    if (!acceleration) return;

    setMotion((prev) => ({
      ...prev,
      acceleration: {
        x: applySmoothingValue(
          prev.acceleration.x,
          acceleration.x,
          SENSOR_CONFIG.SMOOTHING_FACTOR
        ),
        y: applySmoothingValue(
          prev.acceleration.y,
          acceleration.y,
          SENSOR_CONFIG.SMOOTHING_FACTOR
        ),
        z: applySmoothingValue(
          prev.acceleration.z,
          acceleration.z,
          SENSOR_CONFIG.SMOOTHING_FACTOR
        ),
      },
    }));
  }, []);

  // Animation frame callback
  const rafCallback = useCallback(
    (timestamp: number) => {
      const now = Date.now();
      const state = sensorState.current;

      // Process orientation data if available and enough time has passed
      if (
        now - state.lastOrientationUpdate >= THROTTLE_INTERVAL &&
        state.pendingOrientationData
      ) {
        state.lastOrientationUpdate = now;
        processOrientation(now);
      }

      // Process motion data if available and enough time has passed
      if (
        now - state.lastMotionUpdate >= THROTTLE_INTERVAL &&
        state.pendingMotionData
      ) {
        state.lastMotionUpdate = now;
        processMotion(now);
      }

      rafId.current = requestAnimationFrame(rafCallback);
    },
    [processOrientation, processMotion]
  );

  // Calibration effect
  useEffect(() => {
    if (gameState === "playing" && !hasCalibrated.current) {
      console.log("Game started - calibrating your current position");

      if (motion.beta !== undefined && motion.gamma !== undefined) {
        performCalibration(motion.beta, motion.gamma);
      }
    }

    return () => {
      if (calibrationTimer.current) {
        clearTimeout(calibrationTimer.current);
        calibrationTimer.current = null;
      }
    };
  }, [gameState, motion.beta, motion.gamma, performCalibration]);

  // Sensor setup effect
  useEffect(() => {
    const state = sensorState.current;

    // Orientation sensor listener
    const orientationSubscription = Gyroscope.addListener((data) => {
      const now = Date.now();
      state.pendingOrientationData = data;

      // Process immediately if enough time has passed
      if (now - state.lastOrientationUpdate >= THROTTLE_INTERVAL) {
        state.lastOrientationUpdate = now;
        processOrientation(now);
      }
    });

    // Motion sensor listener
    const motionSubscription = DeviceMotion.addListener((data) => {
      const now = Date.now();
      state.pendingMotionData = data;

      // Process immediately if enough time has passed
      if (now - state.lastMotionUpdate >= THROTTLE_INTERVAL) {
        state.lastMotionUpdate = now;
        processMotion(now);
      }
    });

    // Start the animation frame loop
    rafId.current = requestAnimationFrame(rafCallback);

    // Debug logging in development mode only
    if (process.env.NODE_ENV === "development") {
      debugInterval.current = setInterval(() => {
        console.log("Motion data:", motion);
        if (calibration.beta !== undefined) {
          console.log("Calibration values:", calibration);
        }
      }, SENSOR_CONFIG.DEBUG_INTERVAL);
    }

    // Cleanup function
    return () => {
      // Remove sensor listeners
      orientationSubscription.remove();
      motionSubscription.remove();

      // Cancel animation frame
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = undefined;
      }

      // Clear debug interval
      if (debugInterval.current) {
        clearInterval(debugInterval.current);
        debugInterval.current = undefined;
      }

      // Reset sensor state
      sensorState.current = createInitialSensorState();
    };
  }, [rafCallback, processOrientation, processMotion]);

  // Return memoized result to prevent unnecessary re-renders
  return {
    motion,
    calibration,
    hasCalibrated: hasCalibrated.current,
  };
};
