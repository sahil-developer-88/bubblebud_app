import create from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { COIN_DISTANCE } from "@/lib/constants";

export type GameState = "ready" | "playing" | "paused" | "ended";

interface Position {
  x: number;
  y: number;
}

interface Coin {
  id: string;
  position: Position;
  collected: boolean;
}

interface SessionStats {
  totalCoins: number;
  collectedCoins: number;
  score: number; // Percentage of coins collected
  duration: number; // Session duration in minutes
  actualDuration: number; // Actual played time in seconds
}

export interface BreathingGameState {
  gameState: GameState;
  score: number;
  sessionDuration: number; // in minutes
  startTime: number | null; // timestamp when session started
  coins: Coin[];
  characterPosition: Position;
  gameTime: number;
  breathCycles: number;
  lastBreathDirection: "inhale" | "exhale" | null;
  breathTimestamps: number[];
  averageBreathRate: number;
  sessionStats: SessionStats | null;

  // Actions
  startGame: (duration: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  restartGame: () => void;
  updateCharacterPosition: (position: Position) => void;
  updateCoins: (coins: Coin[]) => void;
  collectCoin: (id: string) => void;
  updateGameTime: (time: number) => void;
  recordBreath: (direction: "inhale" | "exhale") => void;
  checkSessionEnd: () => boolean; // Returns true if session should end
}

export const useBreathingGame = create<BreathingGameState>()(
  subscribeWithSelector((set, get) => ({
    gameState: "ready",
    score: 0,
    sessionDuration: 5, // Default 5 minutes
    startTime: null,
    coins: [],
    characterPosition: { x: -5, y: 0 },
    gameTime: 0,
    breathCycles: 0,
    lastBreathDirection: null,
    breathTimestamps: [],
    averageBreathRate: 0,
    sessionStats: null,

    startGame: (duration: number) => {
      set({
        gameState: "playing",
        sessionDuration: duration,
        startTime: Date.now(),
        score: 0,
        coins: [],
        characterPosition: { x: -5, y: 0 },
        gameTime: 0,
        breathCycles: 0,
        lastBreathDirection: null,
        breathTimestamps: [],
        averageBreathRate: 0,
        sessionStats: null,
      });
      console.log(`Game started with ${duration} minute session`);
    },

    pauseGame: () => {
      set({ gameState: "paused" });
      console.log("Game paused");
    },

    resumeGame: () => {
      const state = get() as BreathingGameState;
      if (state.gameState === "paused") {
        set({ gameState: "playing" });
        console.log("Game resumed");
      }
    },

    endGame: () => {
      const state = get() as BreathingGameState;
      const { coins, score, startTime, sessionDuration, gameTime } = state;

      // Get the latest coin id created
      // Coin IDs are in the format "coin-NUMBER-POSITIONTYPE"
      let latestCoinNumber = 0;
      coins.forEach((coin: Coin) => {
        const parts = coin.id.split("-");
        if (parts.length >= 2) {
          const coinNumber = parseInt(parts[1]);
          if (!isNaN(coinNumber) && coinNumber > latestCoinNumber) {
            latestCoinNumber = coinNumber;
          }
        }
      });

      console.log(`Latest coin number: ${latestCoinNumber}`);

      // Total coins generated during the session minus the last one
      // which is still on screen and uncollectable
      const totalGeneratedCoins = Math.max(0, latestCoinNumber - 1);

      // Count visible uncollected coins (excluding the last one that's too far to collect)
      const visibleCoins = coins.filter((coin: Coin) => !coin.collected);
      const lastVisibleCoin = visibleCoins.length > 0 ? 1 : 0;

      // Total coins available to collect = total generated - the last visible one
      const totalCoins = totalGeneratedCoins;
      const collectedCoins = score;

      // Calculate score percentage
      const scorePercentage =
        totalCoins > 0 ? Math.round((collectedCoins / totalCoins) * 100) : 0;

      const actualDuration = startTime
        ? Math.round((Date.now() - startTime) / 1000)
        : 0;

      // In the display, we'll adjust totalCoins to match the collected coins if score is 100%
      const displayedTotalCoins =
        scorePercentage === 100 ? collectedCoins : totalCoins;

      const sessionStats: SessionStats = {
        totalCoins: displayedTotalCoins,
        collectedCoins,
        score: scorePercentage,
        duration: sessionDuration,
        actualDuration,
      };

      console.log("Session ended - stats:", sessionStats);

      set({
        gameState: "ended",
        sessionStats,
      });
    },

    checkSessionEnd: () => {
      const state = get() as BreathingGameState;
      const { startTime, sessionDuration, gameState } = state;

      if (gameState !== "playing" || !startTime) return false;

      const sessionDurationMs = sessionDuration * 60 * 1000;
      const elapsedTime = Date.now() - startTime;

      return elapsedTime >= sessionDurationMs;
    },

    restartGame: () => {
      set({
        gameState: "ready",
        score: 0,
        sessionDuration: 5,
        startTime: null,
        coins: [],
        characterPosition: { x: -5, y: 0 },
        gameTime: 0,
        breathCycles: 0,
        lastBreathDirection: null,
        breathTimestamps: [],
        averageBreathRate: 0,
        sessionStats: null,
      });
      console.log("Game restarted");
    },

    updateCharacterPosition: (position: Position) => {
      set({ characterPosition: position });

      // Track breathing based on character vertical movement
      const state = get() as BreathingGameState;
      const { lastBreathDirection, characterPosition: prevPos } = state;

      // If moving up significantly, record inhale
      if (position.y > prevPos.y + 0.3 && lastBreathDirection !== "inhale") {
        (get() as BreathingGameState).recordBreath("inhale");
      }
      // If moving down significantly, record exhale
      else if (
        position.y < prevPos.y - 0.3 &&
        lastBreathDirection !== "exhale"
      ) {
        (get() as BreathingGameState).recordBreath("exhale");
      }
    },

    updateCoins: (coins: Coin[]) => {
      set({ coins });
    },

    collectCoin: (id: string) => {
      const state = get() as BreathingGameState;
      const { coins, score } = state;

      const updatedCoins = coins.map((coin: Coin) =>
        coin.id === id ? { ...coin, collected: true } : coin
      );

      set({
        coins: updatedCoins,
        score: score + 1,
      });

      console.log(`Coin collected. New score: ${score + 1}`);
    },

    updateGameTime: (time: number) => {
      set({ gameTime: time });

      // Check if session should end based on duration
      const state = get() as BreathingGameState;
      const shouldEnd = state.checkSessionEnd();
      if (shouldEnd) {
        state.endGame();
      }
    },

    recordBreath: (direction: "inhale" | "exhale") => {
      const state = get() as BreathingGameState;
      const { lastBreathDirection, breathCycles, breathTimestamps, gameTime } =
        state;

      // Record the timestamp of this breath event
      const newTimestamps = [...breathTimestamps, gameTime];

      // If we've completed a breath cycle (inhale followed by exhale)
      let newBreathCycles = breathCycles;
      if (direction === "exhale" && lastBreathDirection === "inhale") {
        newBreathCycles++;
      }

      // Calculate average breathing rate if we have enough data
      let averageBreathRate = 0;
      if (newTimestamps.length > 3) {
        // Only keep the last 10 breath events for the calculation
        const recentTimestamps = newTimestamps.slice(-10);

        if (recentTimestamps.length >= 2) {
          const timeElapsed =
            recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0];
          const minutes = timeElapsed / 60;

          // Each full breath cycle is one inhale + one exhale, so divide by 2
          const breathEvents = recentTimestamps.length - 1;
          averageBreathRate = breathEvents / (2 * minutes);
        }
      }

      set({
        lastBreathDirection: direction,
        breathCycles: newBreathCycles,
        breathTimestamps: newTimestamps,
        averageBreathRate,
      });

      console.log(
        `Breath recorded: ${direction}, Cycles: ${newBreathCycles}, Rate: ${averageBreathRate.toFixed(
          1
        )} breaths/min`
      );
    },
  }))
);
