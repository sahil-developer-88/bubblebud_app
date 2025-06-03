import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber/native";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { useAudio } from "@/lib/stores/useAudio";
import Character from "./Character";
import Coin from "./Coin";
import Background from "./Background";
import ParticleSystem from "./ParticleSystem";
import { useMotion } from "@/hooks/useMotion";
import * as THREE from "three";
import { GAME_SPEED, COIN_DISTANCE, MOTION_SENSITIVITY } from "@/lib/constants";
import { DeviceEventEmitter } from "react-native";

// Note: We've removed the meditation bell function as we now use the audio store with different pitched sounds

// Helper function to check collision
const checkCollision = (
  characterPos: THREE.Vector3,
  coinPos: THREE.Vector3,
  threshold = 1.2
) => {
  return (
    Math.abs(characterPos.x - coinPos.x) < threshold &&
    Math.abs(characterPos.y - coinPos.y) < threshold
  );
};

// Global counter for coin creation to ensure proper alternation
// When a game starts, this will be reset and first coin will be HIGH
let globalCoinCounter = 0;

// Flag to track if this is a fresh game start
let isFirstCoinGenerated = false;

const GameScene = () => {
  const {
    gameState,
    characterPosition,
    updateCharacterPosition,
    coins,
    updateCoins,
    collectCoin,
    gameTime,
    updateGameTime,
  } = useBreathingGame();

  const audio = useAudio();
  const { isMuted } = audio;
  const motion = useMotion();
  const { viewport } = useThree();

  const characterRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<any>(null); // Using any to avoid TypeScript issues
  const lastCoinTime = useRef(0);

  // Update game time
  useFrame((_, delta) => {
    if (gameState === "playing") {
      updateGameTime(gameTime + delta);
    }
  });

  // Define positions for coins and character movement limits
  const HIGH_POSITION = 3; // High coin position (for inhale)
  const MID_POSITION = 0; // Middle position for transitions
  const LOW_POSITION = -3; // Low coin position (for exhale)

  // Handle motion controls
  useFrame(() => {
    if (gameState !== "playing" || motion.motion.beta === undefined) return;

    // Map the beta (tilt forward/backward) to character movement
    // Beta is typically around 0 when flat, positive when tilted forward, negative when tilted back
    // We invert the movement because we want:
    // - Tilt back (negative beta, breathing in) -> move character up
    // - Tilt forward (positive beta, breathing out) -> move character down

    let adjustedBeta = motion.motion.beta;

    // Calculate target Y position based on calibration
    let targetY;

    // If we have calibration data, use it as the baseline
    if (motion.hasCalibrated && motion.calibration.beta !== undefined) {
      // Calculate the difference from the calibrated position (exhaled state)
      // When the user is at calibration position (exhaled), character should be at the bottom (LOW_POSITION)
      adjustedBeta = motion.motion.beta - motion.calibration.beta;

      // Map beta so that calibration position = LOW_POSITION
      // and higher values (inhale) move toward HIGH_POSITION
      targetY = THREE.MathUtils.clamp(
        LOW_POSITION + -adjustedBeta * MOTION_SENSITIVITY * 3, // Amplify the movement range moderately
        LOW_POSITION, // Lower bound - match the low coin position
        HIGH_POSITION // Upper bound - match the high coin position
      );
    } else {
      // Fall back to the old fixed offset if calibration isn't available
      const betaOffset = 5;
      adjustedBeta = motion.motion.beta + betaOffset;

      // Only used if no calibration is available
      targetY = THREE.MathUtils.clamp(
        -adjustedBeta * MOTION_SENSITIVITY, // Using the constant from settings with adjusted beta
        LOW_POSITION, // Lower bound - match the low coin position
        HIGH_POSITION // Upper bound - match the high coin position
      );
    }

    // Smooth character movement - reduced to 80% of original speed (0.1 -> 0.08)
    const newY = THREE.MathUtils.lerp(characterPosition.y, targetY, 0.08);
    updateCharacterPosition({ ...characterPosition, y: newY });
  });

  // Reset coin counter when game starts or ends
  useEffect(() => {
    if (gameState === "playing") {
      // Reset counter to ensure next coin will be a high one (position type 1)
      console.log(
        "Starting new game - resetting coin counter for proper sequence"
      );
      globalCoinCounter = 0;
      isFirstCoinGenerated = false;
      lastCoinTime.current = 0; // Force immediate coin generation
    } else if (gameState === "ended" || gameState === "ready") {
      // Also reset when game ends or returns to ready state
      isFirstCoinGenerated = false;
    }
  }, [gameState]);

  // Move coins and generate new ones
  useFrame((_, delta) => {
    if (gameState !== "playing") return;

    // Move existing coins
    const updatedCoins = coins.map((coin) => ({
      ...coin,
      position: {
        ...coin.position,
        x: coin.position.x - GAME_SPEED * delta,
      },
    }));

    // Check for coins that are passing by the character
    // We detect this near the character's position (x = -2)
    const passingCoins = updatedCoins.filter(
      (coin) => coin.position.x <= -1.9 && coin.position.x > -2.1
    );

    // Check for coins that are passing without being collected (for sad face)
    const missedCoins = updatedCoins.filter(
      (coin) =>
        coin.position.x <= -2.5 && coin.position.x > -2.75 && !coin.collected
    );

    // If any coins were missed, trigger sad face on the character
    if (missedCoins.length > 0 && characterRef.current) {
      // Use DeviceEventEmitter instead of window.dispatchEvent
      DeviceEventEmitter.emit("coinMissed");
      console.log("Coin missed!");
    }

    // Keep only coins that are still visible
    const visibleCoins = updatedCoins.filter(
      (coin) => coin.position.x > -viewport.width / 2 - 2 && !coin.collected
    );

    // Add new coins if needed
    if (gameTime - lastCoinTime.current >= COIN_DISTANCE) {
      lastCoinTime.current = gameTime;

      // Increment the global counter to ensure proper sequence
      globalCoinCounter++;

      // Strict 4-position cycle: HIGH -> MID -> LOW -> MID
      // This ensures coins always follow the same pattern
      let coinPosition: number = MID_POSITION; // Default value
      let positionName: string = "middle"; // Default value
      let coinPositionType: number = 0; // Default value

      // Force the coin position based on the counter modulo 4
      // This ensures the fixed pattern HIGH -> MID -> LOW -> MID
      switch (globalCoinCounter % 4) {
        case 1: // First position - HIGH
          coinPosition = HIGH_POSITION;
          positionName = "high (breathe out)";
          coinPositionType = 1;
          break;
        case 2: // Second position - MID
          coinPosition = MID_POSITION;
          positionName = "middle (transition)";
          coinPositionType = 2;
          break;
        case 3: // Third position - LOW
          coinPosition = LOW_POSITION;
          positionName = "low (breathe in)";
          coinPositionType = 3;
          break;
        case 0: // Fourth position - MID
          coinPosition = MID_POSITION;
          positionName = "middle (transition)";
          coinPositionType = 0;
          break;
      }

      // Debug logging
      console.log(`Creating new coin #${globalCoinCounter}: ${positionName}`);

      visibleCoins.push({
        id: `coin-${globalCoinCounter}-${coinPositionType}`,
        position: {
          x: viewport.width / 2 + 2, // Just off-screen to the right
          y: coinPosition,
        },
        collected: false,
      });
    }

    updateCoins(visibleCoins);

    // Check for collisions
    if (characterRef.current) {
      const characterPosition = new THREE.Vector3();
      characterRef.current.getWorldPosition(characterPosition);

      coins.forEach((coin) => {
        if (!coin.collected) {
          const coinPosition = new THREE.Vector3(
            coin.position.x,
            coin.position.y,
            0
          );

          if (checkCollision(characterPosition, coinPosition)) {
            collectCoin(coin.id);

            // Get the position type from the coin ID (coin-NUMBER-POSITION_TYPE)
            const parts = coin.id.split("-");
            const positionType = parts.length >= 3 ? parseInt(parts[2]) : 2; // Default to mid position

            // Play the appropriate meditation bell for this coin position
            if (!isMuted) {
              // Use the position-specific meditation bells from the audio store
              audio.playSoundForPosition(positionType);
            }

            // Trigger particle effect at coin position
            if (particlesRef.current) {
              // @ts-ignore - accessing custom method on ParticleSystem
              particlesRef.current.emitAt?.(coinPosition.x, coinPosition.y);
            }
          }
        }
      });
    }
  });

  return (
    <>
      {/* Scene lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Background */}
      <Background />

      {/* Character - moved slightly to the right */}
      <Character
        ref={characterRef}
        position={[-2, characterPosition.y, 0]} // Position fixed at -2 on x-axis (right side of screen center)
      />

      {/* Coins */}
      {coins.map((coin) => (
        <Coin
          key={coin.id}
          position={[coin.position.x, coin.position.y, 0]}
          collected={coin.collected}
        />
      ))}

      {/* Particle system for coin collection */}
      <ParticleSystem ref={particlesRef} />
    </>
  );
};

export default GameScene;
