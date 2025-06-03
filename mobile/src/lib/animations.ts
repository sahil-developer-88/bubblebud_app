import { Animated } from "react-native";

// Glow animations
export const createGlowAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.7,
      duration: 1500,
      useNativeDriver: true,
    }),
  ]);
};

// Float animation
export const createFloatAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: -10,
      duration: 2000,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
    }),
  ]);
};

// Tilt animation
export const createTiltAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: -3,
      duration: 3000,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 3,
      duration: 3000,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: 3000,
      useNativeDriver: true,
    }),
  ]);
};

// Wink animation
export const createWinkAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1,
      duration: 4250,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.25,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
  ]);
};

// Gold pulse animation
export const createGoldPulseAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.7,
      duration: 1000,
      useNativeDriver: true,
    }),
  ]);
};
