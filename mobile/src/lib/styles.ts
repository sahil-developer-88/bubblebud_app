import { StyleSheet } from "react-native";
import { colors, spacing, borderRadius } from "./theme";

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreen: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
  glowContainer: {
    shadowColor: colors.fuchsia.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 5,
  },
  goldGlow: {
    shadowColor: colors.gold.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 5,
  },
  bubbleGlow: {
    shadowColor: colors.bubble.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.sm,
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: colors.fuchsia[500],
  },
  buttonSecondary: {
    backgroundColor: colors.blue[500],
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.blue[500],
  },
  card: {
    backgroundColor: "white",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardContent: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  text: {
    color: colors.foreground,
  },
  textCenter: {
    textAlign: "center",
  },
  textBold: {
    fontWeight: "600",
  },
});
