import { Canvas } from "@react-three/fiber/native";
import { Suspense } from "react";
import { View, StyleSheet } from "react-native";
import GameScene from "./GameScene";
import GameUI from "./GameUI";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { AmbientLight } from "three";

const Game = () => {
  const { gameState } = useBreathingGame();

  return (
    <View style={styles.container}>
      <Canvas
        gl={{
          powerPreference: "high-performance",
          alpha: true,
          antialias: true,
          stencil: true,
          depth: true,
          precision: "highp",
        }}
        camera={{
          position: [0, 0, 30],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1} />
          <GameScene />
        </Suspense>
      </Canvas>
      <GameUI />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default Game;
