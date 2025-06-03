import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  Game: { duration: number };
  Summary: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
