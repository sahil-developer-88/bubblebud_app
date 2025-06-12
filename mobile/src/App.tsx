import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Canvas } from "@react-three/fiber/native";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import GameScene from "./components/game/GameScene";
import GameScreen from "./screens/GameScreen";
import HomeScreen from "./screens/HomeScreen";
import SummaryScreen from "./screens/SummaryScreen";

const Stack = createNativeStackNavigator();

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

function CanvasBackground() {
  const [showGameScene, setShowGameScene] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGameScene(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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

  return (
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
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <CanvasBackground />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Summary" component={SummaryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
  },
});
