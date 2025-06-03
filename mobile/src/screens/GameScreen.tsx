import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBreathingGame } from "../lib/stores/useBreathingGame";
import { useAudio } from "../lib/stores/useAudio";
import { NavigationProp } from "../types/navigation";
import GameUI from "@/components/game/GameUI";
import GameScene from "@/components/game/GameScene";
import { Canvas } from "@react-three/fiber/native";

export default function GameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { endGame } = useBreathingGame();
  const [isEnding, setIsEnding] = useState(false);
  const [showPreparingModal, setShowPreparingModal] = useState(false);

  const [showGameScene, setShowGameScene] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowGameScene(true);
    }
  }, [countdown]);

  return (
    <View style={styles.gameContainer}>
      <Canvas
        style={styles.canvas}
        gl={{
          powerPreference: "high-performance",
          alpha: true,
          antialias: true,
          stencil: false,
          depth: true,
        }}
        camera={{
          position: [0, 0, 15],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 10, 5]} intensity={1} />
        {showGameScene && <GameScene />}
      </Canvas>
      <GameUI />

      <View style={styles.gameControls}>
        {/* <TouchableOpacity style={styles.controlButton} onPress={toggleMusic}>
          <Waves size={24} color={isMusicMuted ? "#888" : "#fff"} />
        </TouchableOpacity> */}

        {/* <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          {isMuted ? (
            <VolumeX size={24} color="#fff" />
          ) : (
            <Volume2 size={24} color="#fff" />
          )}
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.endButton,
            isEnding && { opacity: 0.6 },
          ]}
          disabled={isEnding}
          onPress={() => {
            setIsEnding(true);
            setShowPreparingModal(true); // Show the popup
            endGame();
            setTimeout(() => {
              navigation.navigate("Summary");
              setIsEnding(false);
              setShowPreparingModal(false); // Hide the popup
            }, 4000);
          }}
        >
          <Text style={[styles.endButtonText, { textAlign: "center" }]}>
            {isEnding ? "Ending..." : "End Session"}
          </Text>
        </TouchableOpacity>
      </View>

      {countdown > 0 && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      <Modal
        transparent
        animationType="fade"
        visible={showPreparingModal}
        onRequestClose={() => setShowPreparingModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#fbbf24" />
            <Text style={styles.modalText}>
              Please wait, your result is preparing…
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  canvas: {
    flex: 1,
  },
  gameControls: {
    position: "absolute",
    top: 40,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  controlButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(55, 65, 81, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch", // or use width: '90%' for centered layout
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 15,
  },
  endButtonText: {
    color: "white",
    fontWeight: "600",
  },
  timerContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(55, 65, 81, 0.5)",
    padding: 8,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    color: "white",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  modalText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#fbbf24",
  },
});
