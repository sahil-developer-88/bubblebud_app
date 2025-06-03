// Theme type for TypeScript
export type Theme = "light" | "dark";

// Color types
type ThemeColor = {
  light: string;
  dark: string;
};

type SimpleColor = string;

type ColorValue = ThemeColor | SimpleColor;

interface Colors {
  background: ThemeColor & {
    sky: {
      top: SimpleColor;
      middle: SimpleColor;
      bottom: SimpleColor;
    };
    mountains: {
      near: SimpleColor;
      far: SimpleColor;
    };
  };
  foreground: ThemeColor;
  primary: ThemeColor;
  secondary: ThemeColor;
  accent: ThemeColor;
  character: {
    primary: SimpleColor;
    highlight: SimpleColor;
  };
  fuchsia: {
    500: SimpleColor;
    glow: SimpleColor;
  };
  blue: {
    500: SimpleColor;
    glow: SimpleColor;
  };
  purple: {
    500: SimpleColor;
    glow: SimpleColor;
  };
  gold: {
    main: SimpleColor;
    glow: SimpleColor;
  };
  bubble: {
    glow: SimpleColor;
    glowSecondary: SimpleColor;
  };
  coin: {
    primary: SimpleColor;
    highlight: SimpleColor;
    glow: SimpleColor;
  };
  ui: {
    primary: SimpleColor;
    secondary: SimpleColor;
    text: {
      light: SimpleColor;
      dark: SimpleColor;
    };
  };
}

export const colors: Colors = {
  // Base colors
  background: {
    light: "#F5F5F5",
    dark: "#121212",
    sky: {
      top: "#9d4edd", // Deep purple
      middle: "#c77dff", // Mid purple
      bottom: "#ffcbf2", // Light pink
    },
    mountains: {
      near: "#b392ac", // Muted pink/purple
      far: "#d0b3c5", // Lighter muted pink
    },
  },
  foreground: {
    light: "#000000",
    dark: "#FFFFFF",
  },

  // UI colors
  primary: {
    light: "rgba(59, 130, 246, 1)",
    dark: "rgba(59, 130, 246, 1)",
  },
  secondary: {
    light: "rgba(168, 85, 247, 1)",
    dark: "rgba(168, 85, 247, 1)",
  },
  accent: {
    light: "rgba(238, 0, 255, 1)",
    dark: "rgba(238, 0, 255, 1)",
  },

  // Character colors
  character: {
    primary: "#a2d6f9", // Pale saturated blue
    highlight: "#5db7de", // Medium saturated blue
  },

  // Effect colors
  fuchsia: {
    500: "rgba(238, 0, 255, 1)",
    glow: "rgba(238, 0, 255, 0.5)",
  },
  blue: {
    500: "rgba(59, 130, 246, 1)",
    glow: "rgba(59, 130, 246, 0.5)",
  },
  purple: {
    500: "rgba(168, 85, 247, 1)",
    glow: "rgba(168, 85, 247, 0.5)",
  },
  gold: {
    main: "#FFD700",
    glow: "rgba(255, 215, 0, 0.6)",
  },
  bubble: {
    glow: "rgba(56, 189, 248, 0.6)",
    glowSecondary: "rgba(56, 189, 248, 0.3)",
  },
  coin: {
    primary: "#fcd34d", // Gold
    highlight: "#eab308", // Darker gold
    glow: "#fef3c7", // Light gold
  },
  ui: {
    primary: "#9d4edd", // Purple
    secondary: "#f59e0b", // Amber
    text: {
      light: "#ffffff", // White
      dark: "#1f2937", // Dark gray
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// Helper function to get theme-aware colors
export const getThemeColor = (colorKey: keyof Colors, theme: Theme): string => {
  const color = colors[colorKey];
  if (typeof color === "string") return color;
  if ("light" in color && "dark" in color) {
    return color[theme];
  }
  // For nested objects, return the first color value
  if (typeof color === "object") {
    const firstValue = Object.values(color)[0];
    return typeof firstValue === "string" ? firstValue : firstValue[theme];
  }
  return "#000000"; // Fallback color
};
