import GameScene from "@/components/game/GameScene";
import GameUI from "@/components/game/GameUI";
import { useNavigation } from "@react-navigation/native";
import { Canvas } from "@react-three/fiber/native";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useBreathingGame } from "../lib/stores/useBreathingGame";
import { NavigationProp } from "../types/navigation";

// Constants moved outside component to prevent recreation
const CANVAS_CONFIG = {
  gl: {
    powerPreference: "high-performance" as const,
    alpha: true,
    antialias: true,
    stencil: false,
    depth: true,
  },
  camera: {
    position: [0, 0, 15] as const,
    fov: 60,
    near: 0.1,
    far: 1000,
  },
} as const;

const LIGHTING_CONFIG = {
  ambient: { intensity: 0.5 },
  directional: {
    position: [0, 10, 5] as const,
    intensity: 1,
  },
} as const;

export default function GameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { endGame } = useBreathingGame();
  const [showGameScene, setShowGameScene] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGameScene(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Memoized event handler to prevent recreation on every render
  const handleEndSession = useCallback(() => {
    endGame();
    setTimeout(() => {
      navigation.replace("Summary");
    }, 100);
  }, [endGame, navigation]);

  // Memoized lighting components to prevent recreation
  const lightingComponents = useMemo(
    () => (
      <>
        <ambientLight intensity={LIGHTING_CONFIG.ambient.intensity} />
        <directionalLight
          position={LIGHTING_CONFIG.directional.position}
          intensity={LIGHTING_CONFIG.directional.intensity}
        />
      </>
    ),
    []
  );

  // Memoized loader component
  const loaderComponent = useMemo(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    ),
    []
  );

  // Memoized game controls to prevent recreation
  const gameControls = useMemo(
    () => (
      <View style={styles.gameControls}>
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleEndSession]
  );

  return (
    <View style={styles.gameContainer}>
      <View style={styles.skyGradient}>
        <View style={[styles.gradientLayer, { backgroundColor: "#b15cd0" }]} />
        <View style={[styles.gradientLayer, { backgroundColor: "#e2b1f0" }]} />
        <View style={[styles.gradientLayer, { backgroundColor: "#d0b3c5" }]} />
        <View style={[styles.gradientLayer, { backgroundColor: "#f1f5f9" }]} />
      </View>
      <Canvas
        style={styles.canvas}
        gl={CANVAS_CONFIG.gl}
        camera={CANVAS_CONFIG.camera}
      >
        <Suspense fallback={null}>
          {lightingComponents}
          {showGameScene && <GameScene />}
        </Suspense>
      </Canvas>
      {!showGameScene && loaderComponent}
      <GameUI />
      {gameControls}
    </View>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  canvas: {
    flex: 1,
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
  gameControls: {
    position: "absolute",
    top: 40,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  endButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endButtonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
  },
  skyGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
  },
  gradientLayer: {
    flex: 1,
    width: "100%",
  },
});
