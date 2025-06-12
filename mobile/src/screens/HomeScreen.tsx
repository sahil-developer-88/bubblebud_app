import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBreathingGame } from "../lib/stores/useBreathingGame";
import { useAudio } from "../lib/stores/useAudio";
import { NavigationProp } from "../types/navigation";
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Volume2,
} from "lucide-react-native";
import { AudioTest } from "../components/AudioTest";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showTips, setShowTips] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [activeTipPanel, setActiveTipPanel] = useState("calibration");
  const { startGame } = useBreathingGame();
  const { startBackgroundMusic } = useAudio();

  const handleStartSession = async (duration: number) => {
    try {
      startBackgroundMusic();
      startGame(duration);
      navigation.navigate("Game", { duration });
    } catch (error) {
      console.error("Error requesting device motion permission:", error);
    }
  };

  const renderTipsContent = () => {
    switch (activeTipPanel) {
      case "calibration":
        return (
          <View style={styles.tipPanel}>
            <Text style={styles.tipText}>
              Make sure your phone is already positioned on your belly{" "}
              <Text style={styles.bold}>before</Text> you tap a session button.
            </Text>
            <Text style={styles.tipText}>
              When you tap a session button, the app takes a snapshot of the
              current position of your phone in space and calibrates for your
              belly and phone before the game starts.
            </Text>
            <Text style={styles.tipText}>
              Let out a soft, natural breath before tapping - this sets your
              baseline position.
            </Text>
            <TouchableOpacity
              style={styles.tipButton}
              onPress={() => setActiveTipPanel("position")}
            >
              <Text style={styles.tipButtonText}>Next</Text>
              <ChevronRight size={16} color="#be185d" />
            </TouchableOpacity>
          </View>
        );
      case "position":
        return (
          <View style={styles.tipPanel}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>Comfortable Position</Text>
              <Text style={styles.tipSubtitle}>
                Make sure you are nice and comfy and that your neck is supported
                with pillows or a chair
              </Text>
            </View>
            <View style={styles.tipImageContainer}>
              <Image
                source={require("../assets/images/IMG_8329.jpeg")}
                style={styles.tipImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.tipButtonRow}>
              <TouchableOpacity
                style={styles.tipButton}
                onPress={() => setActiveTipPanel("calibration")}
              >
                <ChevronLeft size={16} color="#be185d" />
                <Text style={styles.tipButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tipButton}
                onPress={() => setActiveTipPanel("breathing")}
              >
                <Text style={styles.tipButtonText}>Next</Text>
                <ChevronRight size={16} color="#be185d" />
              </TouchableOpacity>
            </View>
          </View>
        );
      case "breathing":
        return (
          <View style={styles.tipPanel}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>Breathing Speed Benefits</Text>
            </View>
            <Text style={styles.tipText}>
              If you collect all the coins, you'll be breathing at{" "}
              <Text style={styles.bold}>six breaths per minute</Text>, which is
              proven to have many health benefits, including:
            </Text>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>
                • Reduced stress and anxiety
              </Text>
              <Text style={styles.benefitItem}>
                • Improved focus and concentration
              </Text>
              <Text style={styles.benefitItem}>• Lower blood pressure</Text>
              <Text style={styles.benefitItem}>• Better sleep quality</Text>
              <Text style={styles.benefitItem}>
                • Enhanced emotional regulation
              </Text>
            </View>
            <Text style={styles.tipText}>
              If you want to know more, visit{" "}
              <Text style={styles.link}>AriaBreath.com</Text> for more breathing
              exercises and techniques.
            </Text>
            <TouchableOpacity
              style={styles.tipButton}
              onPress={() => setActiveTipPanel("position")}
            >
              <ChevronLeft size={16} color="#be185d" />
              <Text style={styles.tipButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {showAudioTest ? (
        <View style={styles.audioTestContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowAudioTest(false)}
          >
            <ChevronLeft size={24} color="#ffffff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <AudioTest />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.bubbleLogo}>
                <View style={styles.faceContainer}>
                  <View style={[styles.eye, styles.eyeLeft]} />
                  <View style={[styles.eye, styles.eyeRight]} />
                  <View style={styles.smile} />
                </View>
              </View>
              <View style={styles.bubble1} />
              <View style={styles.bubble2} />
            </View>

            <Text style={styles.title}>
              BubbleBuddy<Text style={styles.trademark}>TM</Text>
            </Text>
            <Text style={styles.subtitle}>Belly Breathing Trainer</Text>

            <View style={styles.instructionsContainer}>
              <View style={styles.instructionsHeader}>
                <Text style={styles.instructionsTitle}>How to use:</Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    style={styles.audioTestButton}
                    onPress={() => setShowAudioTest(true)}
                  >
                    <Volume2 size={20} color="#fbbf24" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tipsButton}
                    onPress={() => setShowTips(true)}
                  >
                    <Lightbulb size={20} color="#fbbf24" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>
                  1. <Text style={styles.bold}>Get comfy</Text>, supported on a
                  bed or sofa
                </Text>
                <Text style={styles.instructionItem}>
                  2. Rest the{" "}
                  <Text style={styles.bold}>phone on your belly</Text>
                </Text>
                <Text style={styles.instructionItem}>
                  3. Let out a soft, natural{" "}
                  <Text style={styles.bold}>breath</Text>
                </Text>
                <Text style={styles.instructionItem}>
                  4. <Text style={styles.bold}>Tap</Text> your session length
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.sessionButton, styles.button5Min]}
                onPress={() => handleStartSession(5)}
              >
                <Text style={styles.buttonText}>5 Minutes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sessionButton, styles.button10Min]}
                onPress={() => handleStartSession(10)}
              >
                <Text style={styles.buttonText}>10 Minutes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sessionButton, styles.button15Min]}
                onPress={() => handleStartSession(15)}
              >
                <Text style={styles.buttonText}>15 Minutes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showTips && (
            <View style={styles.tipsModal}>
              <View style={styles.tipsContent}>
                <TouchableOpacity
                  style={{ alignSelf: "flex-end" }}
                  onPress={() => setShowTips(false)}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#be185d",
                    }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
                {renderTipsContent()}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#60a5fa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  bubbleLogo: {
    width: 128,
    height: 128,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderRadius: 64,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  faceContainer: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  face: {
    width: 112,
    height: 112,
    backgroundColor: "#38bdf8",
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  eye: {
    width: 20,
    height: 20,
    backgroundColor: "#000",
    borderRadius: 10,
    position: "absolute",
    top: 32,
  },
  eyeLeft: {
    left: 24,
  },
  eyeRight: {
    right: 24,
  },
  smile: {
    position: "absolute",
    top: 64,
    left: 32,
    width: 48,
    height: 24,
    borderBottomWidth: 4,
    borderBottomColor: "#000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bubble1: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 20,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
  },
  bubble2: {
    position: "absolute",
    top: 24,
    left: 16,
    width: 16,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  trademark: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 20,
    color: "white",
    marginBottom: 30,
  },
  instructionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    width: "100%",
  },
  instructionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  audioTestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsList: {
    gap: 10,
  },
  instructionItem: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  sessionButton: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  button5Min: {
    backgroundColor: "#d946ef",
  },
  button10Min: {
    backgroundColor: "#3b82f6",
  },
  button15Min: {
    backgroundColor: "#8b5cf6",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  tipsModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsContent: {
    backgroundColor: "#fce7f3",
    borderRadius: 24,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  tipPanel: {
    gap: 16,
  },
  tipHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#be185d",
  },
  tipSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  tipText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  tipImageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  tipImage: {
    width: 300,
    height: 200,
    borderRadius: 24,
    marginBottom: 8,
  },
  benefitsList: {
    marginVertical: 16,
  },
  benefitItem: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  link: {
    color: "#be185d",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  tipButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  tipButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#be185d",
  },
  tipButtonText: {
    color: "#be185d",
    fontWeight: "600",
    marginHorizontal: 4,
  },
  audioTestContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
  },
});
