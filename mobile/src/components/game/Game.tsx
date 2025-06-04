import { Canvas } from "@react-three/fiber/native";
import { Suspense } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import GameScene from "./GameScene";
import GameUI from "./GameUI";

const Game = () => {
  return (
    <View style={styles.container}>
      <Canvas
        style={styles.canvas}
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
  canvas: {
    flex: 1,
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
});

export default Game;
