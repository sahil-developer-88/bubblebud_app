import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { useAudio } from "@/lib/stores/useAudio";
import { VolumeX, Volume2, Coins, Clock } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Custom breathing instruction component that appears below the score
const BreathingInstruction = ({ instruction }: { instruction: string }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Reset visibility when instruction changes
    setVisible(true);

    // Fade out after duration
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [instruction]);

  if (!visible) return null;

  return (
    <View style={styles.instructionContainer}>
      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>{instruction}</Text>
      </View>
    </View>
  );
};

const GameUI = () => {
  const { gameState, score, restartGame, averageBreathRate, sessionDuration } =
    useBreathingGame();
  const { isMuted, toggleMute } = useAudio();
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const [breathInstruction, setBreathInstruction] = useState<string | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60); // Convert minutes to seconds

  // Convert game time to formatted minutes:seconds
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  // Completely redone breathing instructions with a timed sequence
  useEffect(() => {
    if (gameState === "playing") {
      console.log("Starting breath cycle with timed instructions");

      // Initial state - clear any existing instruction
      setBreathInstruction(null);

      // One second delay before starting
      const initialDelay = setTimeout(() => {
        // First 5 seconds: "Breathe In"
        setBreathInstruction("Breathe In");
        console.log("Instruction changed to: Breathe In");

        // After 5 seconds: "Breathe Out" (at 6s mark)
        const breathOutTimer1 = setTimeout(() => {
          setBreathInstruction("Breathe Out");
          console.log("Instruction changed to: Breathe Out");

          // After 5 more seconds: "Breathe In" again (at 11s mark)
          const breathInTimer2 = setTimeout(() => {
            setBreathInstruction("Breathe In");
            console.log("Instruction changed to: Breathe In");

            // After 5 more seconds: "Breathe Out" again (at 16s mark)
            const breathOutTimer2 = setTimeout(() => {
              setBreathInstruction("Breathe Out");
              console.log("Instruction changed to: Breathe Out");

              // After 5 more seconds: "That's It!" (at 21s mark)
              const thatsItTimer = setTimeout(() => {
                setBreathInstruction("That's It!");
                console.log("Instruction changed to: That's It!");

                // After 5 more seconds: Clear instruction (at 26s mark)
                const clearTimer = setTimeout(() => {
                  setBreathInstruction(null);
                  console.log("Cleared breathing instructions");
                }, 5000);

                return () => clearTimeout(clearTimer);
              }, 5000);

              return () => clearTimeout(thatsItTimer);
            }, 5000);

            return () => clearTimeout(breathOutTimer2);
          }, 5000);

          return () => clearTimeout(breathInTimer2);
        }, 5000);

        return () => clearTimeout(breathOutTimer1);
      }, 1000);

      // Clean up all timers when component unmounts or game state changes
      return () => {
        clearTimeout(initialDelay);
      };
    }
  }, [gameState]);

  // Show restart prompt after 3 minutes of gameplay
  useEffect(() => {
    if (gameState === "playing" && averageBreathRate > 0) {
      const checkGameDuration = setInterval(() => {
        setShowRestartPrompt(true);

        Toast.show({
          type: "info",
          text1: "How are you feeling?",
          text2: "Continue or start a new session?",
          position: "bottom",
          visibilityTime: 10000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
          onPress: () => setShowRestartPrompt(false),
        });
      }, 180000); // 3 minutes

      return () => clearInterval(checkGameDuration);
    }
  }, [gameState, averageBreathRate]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top bar with score and controls */}
      <View style={styles.topBar}>
        {/* Score display */}
        <View style={styles.scoreContainer}>
          <View style={styles.leftSection}>
            <Coins size={20} color="#fde68a" style={{ marginRight: 6 }} />
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.rightSection}>
            <Clock size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          {/* Sound toggle button */}
          <TouchableOpacity style={styles.soundButton} onPress={toggleMute}>
            {isMuted ? (
              <VolumeX size={20} color="white" />
            ) : (
              <Volume2 size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Breathing instruction */}
      {breathInstruction && (
        <BreathingInstruction instruction={breathInstruction} />
      )}

      {/* Breathing rate display */}
      {averageBreathRate > 0 && (
        <View style={styles.breathRateContainer}>
          <Text style={styles.breathRateText}>
            Breath rate: {averageBreathRate.toFixed(1)} breaths/min
          </Text>
        </View>
      )}

      {/* Restart game button */}
      {showRestartPrompt && (
        <View style={styles.restartButtonContainer}>
          <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
            <Text style={styles.restartButtonText}>New Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    paddingTop: Platform.OS === "ios" ? 50 : 27,
  },
  scoreContainer: {
    backgroundColor: "rgba(234, 179, 8, 0.9)", // warm amber
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch", // or use width: '90%' for centered layout
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  timerContainer: {
    backgroundColor: "rgba(55, 65, 81, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch", // or use width: '90%' for centered layout
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  scoreValue: {
    color: "#fff7d6",
    fontSize: 18,
    fontWeight: "bold",
  },

  timerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  scoreTextWrapper: {
    justifyContent: "center",
  },

  scoreLabel: {
    color: "#fff3c4",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  controlsContainer: {
    paddingTop: 8,
  },
  soundButton: {
    width: 43,
    height: 43,
    borderRadius: 24,
    backgroundColor: "rgba(55, 65, 81, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionContainer: {
    position: "absolute",
    left: "50%",
    top: 96,
    transform: [{ translateX: -100 }],
  },
  instructionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
    lineHeight: 44,
  },

  breathRateContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(180, 83, 9, 0.7)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  breathRateText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
  },
  restartButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  restartButton: {
    backgroundColor: "#d97706",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  restartButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GameUI;
