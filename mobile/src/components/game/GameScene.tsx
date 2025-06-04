import { useMotion } from "@/hooks/useMotion";
import { COIN_DISTANCE, GAME_SPEED, MOTION_SENSITIVITY } from "@/lib/constants";
import { useAudio } from "@/lib/stores/useAudio";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { useFrame, useThree } from "@react-three/fiber/native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
import * as THREE from "three";
import Background from "./Background";
import Character from "./Character";
import Coin from "./Coin";
import ParticleSystem from "./ParticleSystem";

// Constants for positions - moved to module level for better memory usage
const HIGH_POSITION = 3;
const MID_POSITION = 0;
const LOW_POSITION = -3;
const COLLISION_THRESHOLD = 1.2;
const LERP_FACTOR = 0.08;
const COIN_OFFSET = 2;
const CHARACTER_X_POSITION = -2;
const PASSING_COIN_MIN = -1.9;
const PASSING_COIN_MAX = -2.1;
const MISSED_COIN_MIN = -2.5;
const MISSED_COIN_MAX = -2.75;

// Position cycle configuration - more efficient than switch statement
const POSITION_CYCLE = [
  { position: HIGH_POSITION, name: "high (breathe out)", type: 1 },
  { position: MID_POSITION, name: "middle (transition)", type: 2 },
  { position: LOW_POSITION, name: "low (breathe in)", type: 3 },
  { position: MID_POSITION, name: "middle (transition)", type: 0 },
];

// Reusable vectors to avoid garbage collection
const tempCharacterPos = new THREE.Vector3();
const tempCoinPos = new THREE.Vector3();

// Optimized collision detection - inline for better performance
const checkCollision = (charPos, coinPos) => {
  const dx = Math.abs(charPos.x - coinPos.x);
  const dy = Math.abs(charPos.y - coinPos.y);
  return dx < COLLISION_THRESHOLD && dy < COLLISION_THRESHOLD;
};

// Global state for coin generation - more efficient than module variables
const coinState = {
  counter: 0,
  isFirstGenerated: false,
};

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

  const characterRef = useRef(null);
  const particlesRef = useRef(null);
  const lastCoinTime = useRef(0);

  // Cache frequently accessed values
  const viewportHalfWidth = useMemo(() => viewport.width / 2, [viewport.width]);
  const coinSpawnX = useMemo(
    () => viewportHalfWidth + COIN_OFFSET,
    [viewportHalfWidth]
  );

  // Memoized character position update callback
  const updateCharacterPositionCallback = useCallback(
    (newPosition) => {
      updateCharacterPosition(newPosition);
    },
    [updateCharacterPosition]
  );

  // Game time update frame handler - separated for better performance
  useFrame(
    useCallback(
      (_, delta) => {
        if (gameState === "playing") {
          updateGameTime(gameTime + delta);
        }
      },
      [gameState, gameTime, updateGameTime]
    )
  );

  // Motion control frame handler - optimized calculations
  useFrame(
    useCallback(() => {
      if (gameState !== "playing" || motion.motion.beta === undefined) return;

      let targetY;
      const currentBeta = motion.motion.beta;

      if (motion.hasCalibrated && motion.calibration.beta !== undefined) {
        const adjustedBeta = currentBeta - motion.calibration.beta;
        targetY = THREE.MathUtils.clamp(
          LOW_POSITION + -adjustedBeta * MOTION_SENSITIVITY * 3,
          LOW_POSITION,
          HIGH_POSITION
        );
      } else {
        const adjustedBeta = currentBeta + 5; // betaOffset constant
        targetY = THREE.MathUtils.clamp(
          -adjustedBeta * MOTION_SENSITIVITY,
          LOW_POSITION,
          HIGH_POSITION
        );
      }

      const newY = THREE.MathUtils.lerp(
        characterPosition.y,
        targetY,
        LERP_FACTOR
      );
      updateCharacterPositionCallback({ ...characterPosition, y: newY });
    }, [
      gameState,
      motion.motion.beta,
      motion.hasCalibrated,
      motion.calibration.beta,
      characterPosition,
      updateCharacterPositionCallback,
    ])
  );

  // Reset coin state on game state changes
  useEffect(() => {
    if (gameState === "playing") {
      console.log(
        "Starting new game - resetting coin counter for proper sequence"
      );
      coinState.counter = 0;
      coinState.isFirstGenerated = false;
      lastCoinTime.current = 0;
    } else if (gameState === "ended" || gameState === "ready") {
      coinState.isFirstGenerated = false;
    }
  }, [gameState]);

  // Main game logic frame handler - heavily optimized
  useFrame(
    useCallback(
      (_, delta) => {
        if (gameState !== "playing") return;

        // Move existing coins - optimized with pre-calculated speed
        const speedDelta = GAME_SPEED * delta;
        const updatedCoins = coins.map((coin) => ({
          ...coin,
          position: {
            ...coin.position,
            x: coin.position.x - speedDelta,
          },
        }));

        // Batch process coin states for better performance
        const passingCoins = [];
        const missedCoins = [];
        const visibleCoins = [];

        const minVisibleX = -viewportHalfWidth - COIN_OFFSET;

        for (const coin of updatedCoins) {
          const coinX = coin.position.x;

          // Check passing coins
          if (coinX <= PASSING_COIN_MIN && coinX > PASSING_COIN_MAX) {
            passingCoins.push(coin);
          }

          // Check missed coins
          if (
            coinX <= MISSED_COIN_MIN &&
            coinX > MISSED_COIN_MAX &&
            !coin.collected
          ) {
            missedCoins.push(coin);
          }

          // Keep visible coins
          if (coinX > minVisibleX && !coin.collected) {
            visibleCoins.push(coin);
          }
        }

        // Handle missed coins
        if (missedCoins.length > 0) {
          DeviceEventEmitter.emit("coinMissed");
          console.log("Coin missed!");
        }

        // Generate new coins
        if (gameTime - lastCoinTime.current >= COIN_DISTANCE) {
          lastCoinTime.current = gameTime;
          coinState.counter++;

          const cycleIndex = (coinState.counter - 1) % 4;
          const coinConfig = POSITION_CYCLE[cycleIndex];

          console.log(
            `Creating new coin #${coinState.counter}: ${coinConfig.name}`
          );

          visibleCoins.push({
            id: `coin-${coinState.counter}-${coinConfig.type}`,
            position: {
              x: coinSpawnX,
              y: coinConfig.position,
            },
            collected: false,
          });
        }

        updateCoins(visibleCoins);

        // Collision detection - optimized with reusable vectors
        if (characterRef.current) {
          characterRef.current.getWorldPosition(tempCharacterPos);

          for (const coin of coins) {
            if (!coin.collected) {
              tempCoinPos.set(coin.position.x, coin.position.y, 0);

              if (checkCollision(tempCharacterPos, tempCoinPos)) {
                collectCoin(coin.id);

                // Extract position type from coin ID
                const positionType = parseInt(coin.id.split("-")[2]) || 2;

                if (!isMuted) {
                  audio.playSoundForPosition(positionType);
                }

                // Trigger particle effect
                if (particlesRef.current?.emitAt) {
                  particlesRef.current.emitAt(tempCoinPos.x, tempCoinPos.y);
                }
                break; // Only process one collision per frame for performance
              }
            }
          }
        }
      },
      [
        gameState,
        coins,
        gameTime,
        viewportHalfWidth,
        coinSpawnX,
        updateCoins,
        collectCoin,
        isMuted,
        audio,
      ]
    )
  );

  // Memoized coin components to prevent unnecessary re-renders
  const coinComponents = useMemo(
    () =>
      coins.map((coin) => (
        <Coin
          key={coin.id}
          position={[coin.position.x, coin.position.y, 0]}
          collected={coin.collected}
        />
      )),
    [coins]
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Background />

      <Character
        ref={characterRef}
        position={[CHARACTER_X_POSITION, characterPosition.y, 0]}
      />

      {coinComponents}

      <ParticleSystem ref={particlesRef} />
    </>
  );
};

export default GameScene;
