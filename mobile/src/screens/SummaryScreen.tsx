import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBreathingGame } from "../lib/stores/useBreathingGame";
import { NavigationProp } from "../types/navigation";

export default function SummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { sessionStats, restartGame } = useBreathingGame();

  return (
    <View style={styles.container}>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>Session Complete!</Text>

        {sessionStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.scoreText}>{sessionStats.score}%</Text>
            <Text style={styles.statsText}>
              {sessionStats.score === 100
                ? `Perfect! You collected all ${sessionStats.collectedCoins} coins`
                : `You collected ${sessionStats.collectedCoins} out of ${sessionStats.totalCoins} coins`}
            </Text>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Session Details:</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Session Length:</Text>
                <Text style={styles.detailValue}>
                  {sessionStats.duration} minutes
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Actual Duration:</Text>
                <Text style={styles.detailValue}>
                  {Math.floor(sessionStats.actualDuration / 60)}:
                  {(sessionStats.actualDuration % 60)
                    .toString()
                    .padStart(2, "0")}
                </Text>
              </View>
            </View>

            {sessionStats.score >= 80 ? (
              <Text style={styles.encouragementText}>Great job! 🎉</Text>
            ) : sessionStats.score >= 50 ? (
              <Text style={styles.encouragementText}>
                Good effort! Keep practicing!
              </Text>
            ) : (
              <Text style={styles.encouragementText}>
                Practice makes perfect! Try again.
              </Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.newSessionButton}
            onPress={() => {
              restartGame();
              navigation.reset({ index: 0, routes: [{ name: "Home" }] });
            }}
          >
            <Text style={styles.buttonText}>New Session</Text>
          </TouchableOpacity>

          <View style={styles.ariaBreathContainer}>
            <Text style={styles.ariaBreathText}>
              If you're enjoying BubbleBuddy{"\n"}
              you'll love Aria Breath!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => {
                // Handle opening AriaBreath.com
              }}
            >
              <Text style={styles.exploreButtonText}>Explore More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#60a5fa",
  },
  summaryContent: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
  },
  statsContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 18,
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  detailsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: "white",
  },
  detailValue: {
    fontSize: 16,
    color: "white",
  },
  encouragementText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fbbf24",
    marginTop: 10,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  newSessionButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  ariaBreathContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  ariaBreathText: {
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  exploreButton: {
    backgroundColor: "#d946ef",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
