import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAudio, AudioEngine } from "../lib/stores/useAudio";

export const AudioTest: React.FC = () => {
  const {
    isMuted,
    isMusicMuted,
    toggleMute,
    toggleMusic,
    playHit,
    playReward,
    playLowBell,
    playMidBell,
    playHighBell,
  } = useAudio();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Audio Test Panel</Text>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Sound: {isMuted ? "🔇 Muted" : "🔊 Unmuted"}
        </Text>
        <Text style={styles.statusText}>
          Music: {isMusicMuted ? "🔇 Muted" : "🎵 Playing"}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isMuted && styles.buttonMuted]}
          onPress={toggleMute}
        >
          <Text style={styles.buttonText}>
            {isMuted ? "Unmute Sound" : "Mute Sound"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isMusicMuted && styles.buttonMuted]}
          onPress={toggleMusic}
        >
          <Text style={styles.buttonText}>
            {isMusicMuted ? "Start Music" : "Stop Music"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sound Test Buttons */}
      <View style={styles.soundContainer}>
        <Text style={styles.sectionTitle}>Test Sounds</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.soundButton} onPress={playLowBell}>
            <Text style={styles.buttonText}>Low Bell</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.soundButton} onPress={playMidBell}>
            <Text style={styles.buttonText}>Mid Bell</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.soundButton} onPress={playHighBell}>
            <Text style={styles.buttonText}>High Bell</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.soundButton} onPress={playHit}>
            <Text style={styles.buttonText}>Hit Sound</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.soundButton} onPress={playReward}>
            <Text style={styles.buttonText}>Reward Sound</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView Debug Interface */}
      <View style={styles.debugContainer}>
        <Text style={styles.sectionTitle}>Debug Interface</Text>
        <AudioEngine />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#4a4a4a",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonMuted: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  soundContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  soundButton: {
    flex: 1,
    backgroundColor: "#4a4a4a",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  debugContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
});
