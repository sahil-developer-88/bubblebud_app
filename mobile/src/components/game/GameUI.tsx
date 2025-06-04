import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

const BREATH_CYCLE_TIMINGS = {
  INITIAL_DELAY: 1000,
  BREATH_DURATION: 5000,
  INSTRUCTION_DISPLAY_TIME: 3500,
  RESTART_PROMPT_DELAY: 180000, // 3 minutes
} as const;

const BREATH_INSTRUCTIONS = {
  BREATHE_IN: "Breathe In",
  BREATHE_OUT: "Breathe Out",
  THATS_IT: "That's It!",
} as const;

// Memoized breathing instruction component
const BreathingInstruction = ({ instruction }: { instruction: string }) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset visibility when instruction changes
    setVisible(true);

    // Fade out after duration
    timerRef.current = setTimeout(
      () => setVisible(false),
      BREATH_CYCLE_TIMINGS.INSTRUCTION_DISPLAY_TIME
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
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
  const [timeLeft, setTimeLeft] = useState(() => sessionDuration * 60); // Lazy initial state

  // Refs to store timer IDs for cleanup
  const timerRefs = useRef<{
    gameTimer?: NodeJS.Timeout;
    restartPromptTimer?: NodeJS.Timeout;
    breathingTimers: NodeJS.Timeout[];
  }>({
    breathingTimers: [],
  });

  // Memoized time formatter to prevent recreation
  const formatTime = useCallback((timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Memoized formatted time to prevent unnecessary recalculations
  const formattedTime = useMemo(
    () => formatTime(timeLeft),
    [formatTime, timeLeft]
  );

  // Optimized timer effect with useCallback
  const startGameTimer = useCallback(() => {
    if (timerRefs.current.gameTimer) {
      clearInterval(timerRefs.current.gameTimer);
    }

    timerRefs.current.gameTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRefs.current.gameTimer) {
            clearInterval(timerRefs.current.gameTimer);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      startGameTimer();
    }

    return () => {
      if (timerRefs.current.gameTimer) {
        clearInterval(timerRefs.current.gameTimer);
      }
    };
  }, [gameState, startGameTimer]);

  // Optimized breathing instructions with cleanup
  const setupBreathingInstructions = useCallback(() => {
    console.log("Starting breath cycle with timed instructions");

    // Clear any existing timers
    timerRefs.current.breathingTimers.forEach((timer) => clearTimeout(timer));
    timerRefs.current.breathingTimers = [];

    // Initial state - clear any existing instruction
    setBreathInstruction(null);

    // Create instruction sequence with proper cleanup tracking
    const createTimer = (
      callback: () => void,
      delay: number
    ): NodeJS.Timeout => {
      const timer = setTimeout(callback, delay);
      timerRefs.current.breathingTimers.push(timer);
      return timer;
    };

    // Instruction sequence
    createTimer(() => {
      setBreathInstruction(BREATH_INSTRUCTIONS.BREATHE_IN);
      console.log("Instruction changed to: Breathe In");
    }, BREATH_CYCLE_TIMINGS.INITIAL_DELAY);

    createTimer(() => {
      setBreathInstruction(BREATH_INSTRUCTIONS.BREATHE_OUT);
      console.log("Instruction changed to: Breathe Out");
    }, BREATH_CYCLE_TIMINGS.INITIAL_DELAY + BREATH_CYCLE_TIMINGS.BREATH_DURATION);

    createTimer(() => {
      setBreathInstruction(BREATH_INSTRUCTIONS.BREATHE_IN);
      console.log("Instruction changed to: Breathe In");
    }, BREATH_CYCLE_TIMINGS.INITIAL_DELAY + BREATH_CYCLE_TIMINGS.BREATH_DURATION * 2);

    createTimer(() => {
      setBreathInstruction(BREATH_INSTRUCTIONS.BREATHE_OUT);
      console.log("Instruction changed to: Breathe Out");
    }, BREATH_CYCLE_TIMINGS.INITIAL_DELAY + BREATH_CYCLE_TIMINGS.BREATH_DURATION * 3);

    createTimer(() => {
      setBreathInstruction(BREATH_INSTRUCTIONS.THATS_IT);
      console.log("Instruction changed to: That's It!");
    }, BREATH_CYCLE_TIMINGS.INITIAL_DELAY + BREATH_CYCLE_TIMINGS.BREATH_DURATION * 4);

    createTimer(() => {
      setBreathInstruction(null);
      console.log("Cleared breathing instructions");
    }, BREATH_CYCLE_TIMINGS.INITIAL_DELAY + BREATH_CYCLE_TIMINGS.BREATH_DURATION * 5);
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      setupBreathingInstructions();
    }

    return () => {
      // Clean up all breathing timers
      timerRefs.current.breathingTimers.forEach((timer) => clearTimeout(timer));
      timerRefs.current.breathingTimers = [];
    };
  }, [gameState, setupBreathingInstructions]);

  // Optimized restart prompt effect
  const setupRestartPrompt = useCallback(() => {
    const showToast = () => {
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
    };

    timerRefs.current.restartPromptTimer = setTimeout(
      showToast,
      BREATH_CYCLE_TIMINGS.RESTART_PROMPT_DELAY
    );
  }, []);

  useEffect(() => {
    if (gameState === "playing" && averageBreathRate > 0) {
      setupRestartPrompt();
    }

    return () => {
      if (timerRefs.current.restartPromptTimer) {
        clearTimeout(timerRefs.current.restartPromptTimer);
      }
    };
  }, [gameState, averageBreathRate, setupRestartPrompt]);

  // Memoized formatted breath rate to prevent unnecessary calculations
  const formattedBreathRate = useMemo(
    () => (averageBreathRate > 0 ? averageBreathRate.toFixed(1) : null),
    [averageBreathRate]
  );

  // Memoized components to prevent unnecessary re-renders
  const ScoreSection = useMemo(
    () => (
      <View style={styles.scoreContainer}>
        <View style={styles.leftSection}>
          <Coins size={20} color="#fde68a" style={styles.iconMargin} />
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>
    ),
    [score]
  );

  const TimerSection = useMemo(
    () => (
      <View style={styles.timerContainer}>
        <View style={styles.rightSection}>
          <Clock size={16} color="#fff" style={styles.smallIconMargin} />
          <Text style={styles.timerText}>{formattedTime}</Text>
        </View>
      </View>
    ),
    [formattedTime]
  );

  const SoundButton = useMemo(
    () => (
      <TouchableOpacity style={styles.soundButton} onPress={toggleMute}>
        {isMuted ? (
          <VolumeX size={20} color="white" />
        ) : (
          <Volume2 size={20} color="white" />
        )}
      </TouchableOpacity>
    ),
    [isMuted, toggleMute]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top bar with score and controls */}
      <View style={styles.topBar}>
        {ScoreSection}
        {TimerSection}
        <View style={styles.controlsContainer}>{SoundButton}</View>
      </View>

      {/* Breathing instruction */}
      {breathInstruction && (
        <BreathingInstruction instruction={breathInstruction} />
      )}

      {/* Breathing rate display */}
      {formattedBreathRate && (
        <View style={styles.breathRateContainer}>
          <Text style={styles.breathRateText}>
            Breath rate: {formattedBreathRate} breaths/min
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
    backgroundColor: "rgba(234, 179, 8, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
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
    alignSelf: "stretch",
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
  iconMargin: {
    marginRight: 6,
  },
  smallIconMargin: {
    marginRight: 4,
  },
});

export default GameUI;
