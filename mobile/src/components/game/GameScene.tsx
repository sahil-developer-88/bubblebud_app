import React, { useRef, useEffect, useState, useCallback } from "react";
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

// Constants moved outside component to prevent recreation
const POSITIONS = {
  HIGH: 3, // High coin position (for inhale)
  MID: 0, // Middle position for transitions
  LOW: -3, // Low coin position (for exhale)
};

const COLLISION_THRESHOLD = 1.2;
const CHARACTER_LERP_SPEED = 0.08;
const SCENE_INITIALIZATION_DELAY = 150; // Delay before scene starts processing

// Helper function to check collision
const checkCollision = (
  characterPos: THREE.Vector3,
  coinPos: THREE.Vector3,
  threshold = COLLISION_THRESHOLD
) => {
  return (
    Math.abs(characterPos.x - coinPos.x) < threshold &&
    Math.abs(characterPos.y - coinPos.y) < threshold
  );
};

// Global counter for coin creation to ensure proper alternation
let globalCoinCounter = 0;
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

  // Component readiness state
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [componentsInitialized, setComponentsInitialized] = useState(false);

  // Refs
  const characterRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<any>(null);
  const lastCoinTime = useRef(0);
  const initializationTimer = useRef<NodeJS.Timeout | null>(null);
  const frameCount = useRef(0);

  // Initialize scene after components are ready
  useEffect(() => {
    // Wait for components to be properly mounted and rendered
    initializationTimer.current = setTimeout(() => {
      setComponentsInitialized(true);

      // Additional delay to ensure all Three.js objects are created
      setTimeout(() => {
        setIsSceneReady(true);
        console.log("GameScene fully initialized and ready");
      }, 50);
    }, SCENE_INITIALIZATION_DELAY);

    return () => {
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current);
      }
    };
  }, []);

  // Memoized coin position calculation
  const getCoinPosition = useCallback((counter: number) => {
    const cycle = counter % 4;
    switch (cycle) {
      case 1:
        return {
          position: POSITIONS.HIGH,
          name: "high (breathe out)",
          type: 1,
        };
      case 2:
        return {
          position: POSITIONS.MID,
          name: "middle (transition)",
          type: 2,
        };
      case 3:
        return { position: POSITIONS.LOW, name: "low (breathe in)", type: 3 };
      case 0:
        return {
          position: POSITIONS.MID,
          name: "middle (transition)",
          type: 0,
        };
      default:
        return {
          position: POSITIONS.MID,
          name: "middle (transition)",
          type: 2,
        };
    }
  }, []);

  // Reset coin counter when game starts or ends
  useEffect(() => {
    if (gameState === "playing") {
      console.log(
        "Starting new game - resetting coin counter for proper sequence"
      );
      globalCoinCounter = 0;
      isFirstCoinGenerated = false;
      lastCoinTime.current = 0;
    } else if (gameState === "ended" || gameState === "ready") {
      isFirstCoinGenerated = false;
    }
  }, [gameState]);

  // Game time update - only when scene is ready
  useFrame((_, delta) => {
    if (!isSceneReady || gameState !== "playing") return;

    frameCount.current++;
    updateGameTime(gameTime + delta);
  });

  // Motion controls - only when scene is ready
  useFrame(() => {
    if (
      !isSceneReady ||
      gameState !== "playing" ||
      motion.motion.beta === undefined
    )
      return;

    let adjustedBeta = motion.motion.beta;
    let targetY;

    if (motion.hasCalibrated && motion.calibration.beta !== undefined) {
      adjustedBeta = motion.motion.beta - motion.calibration.beta;
      targetY = THREE.MathUtils.clamp(
        POSITIONS.LOW + -adjustedBeta * MOTION_SENSITIVITY * 3,
        POSITIONS.LOW,
        POSITIONS.HIGH
      );
    } else {
      const betaOffset = 5;
      adjustedBeta = motion.motion.beta + betaOffset;
      targetY = THREE.MathUtils.clamp(
        -adjustedBeta * MOTION_SENSITIVITY,
        POSITIONS.LOW,
        POSITIONS.HIGH
      );
    }

    const newY = THREE.MathUtils.lerp(
      characterPosition.y,
      targetY,
      CHARACTER_LERP_SPEED
    );
    updateCharacterPosition({ ...characterPosition, y: newY });
  });

  // Coin movement and collision detection - only when scene is ready
  useFrame((_, delta) => {
    if (!isSceneReady || gameState !== "playing") return;

    // Move existing coins
    const updatedCoins = coins.map((coin) => ({
      ...coin,
      position: {
        ...coin.position,
        x: coin.position.x - GAME_SPEED * delta,
      },
    }));

    // Check for missed coins
    const missedCoins = updatedCoins.filter(
      (coin) =>
        coin.position.x <= -2.5 && coin.position.x > -2.75 && !coin.collected
    );

    if (missedCoins.length > 0 && characterRef.current) {
      DeviceEventEmitter.emit("coinMissed");
      console.log("Coin missed!");
    }

    // Keep only visible coins
    const visibleCoins = updatedCoins.filter(
      (coin) => coin.position.x > -viewport.width / 2 - 2 && !coin.collected
    );

    // Generate new coins
    if (gameTime - lastCoinTime.current >= COIN_DISTANCE) {
      lastCoinTime.current = gameTime;
      globalCoinCounter++;

      const coinData = getCoinPosition(globalCoinCounter);

      console.log(`Creating new coin #${globalCoinCounter}: ${coinData.name}`);

      visibleCoins.push({
        id: `coin-${globalCoinCounter}-${coinData.type}`,
        position: {
          x: viewport.width / 2 + 2,
          y: coinData.position,
        },
        collected: false,
      });
    }

    updateCoins(visibleCoins);

    // Collision detection
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

            const parts = coin.id.split("-");
            const positionType = parts.length >= 3 ? parseInt(parts[2]) : 2;

            if (!isMuted) {
              audio.playSoundForPosition(positionType);
            }

            if (particlesRef.current?.emitAt) {
              particlesRef.current.emitAt(coinPosition.x, coinPosition.y);
            }
          }
        }
      });
    }
  });

  // Don't render anything until scene is ready
  if (!isSceneReady) {
    return null;
  }

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

      {/* Character */}
      <Character ref={characterRef} position={[-2, characterPosition.y, 0]} />

      {/* Coins */}
      {coins.map((coin) => (
        <Coin
          key={coin.id}
          position={[coin.position.x, coin.position.y, 0]}
          collected={coin.collected}
        />
      ))}

      {/* Particle system */}
      <ParticleSystem ref={particlesRef} />
    </>
  );
};

export default GameScene;
