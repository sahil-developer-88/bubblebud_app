import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Storage utilities
export const getStorage = async (key: string): Promise<any> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error reading from storage:", error);
    return null;
  }
};

export const setStorage = async (key: string, value: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing to storage:", error);
  }
};

// Platform utilities
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

// Style utilities
export const getShadowStyle = (elevation: number, color: string = "#000") => {
  if (isIOS) {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: elevation,
    };
  }
  return {
    elevation,
  };
};

// Animation utilities
export const getAnimationConfig = (duration: number = 300) => ({
  duration,
  useNativeDriver: true,
});
