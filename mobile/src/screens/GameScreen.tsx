import GameUI from "@/components/game/GameUI";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useBreathingGame } from "../lib/stores/useBreathingGame";
import { NavigationProp } from "../types/navigation";

export default function GameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { endGame } = useBreathingGame();

  const handleEndSession = useCallback(() => {
    endGame();
    setTimeout(() => {
      navigation.replace("Summary");
    }, 100);
  }, [endGame, navigation]);

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
      <GameUI />
      {gameControls}
    </View>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: "#00000000",
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
});
