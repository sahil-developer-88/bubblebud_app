import { COLORS } from './constants';

// CSS variables for the theme
export const THEME_VARIABLES = {
  // Light mode colors
  light: {
    '--background': COLORS.background.sky.bottom,
    '--foreground': COLORS.ui.text.dark,
    '--primary': COLORS.ui.primary,
    '--primary-foreground': COLORS.ui.text.light,
    '--secondary': COLORS.ui.secondary,
    '--secondary-foreground': COLORS.ui.text.light,
    '--accent': COLORS.character.highlight,
    '--accent-foreground': COLORS.ui.text.light,
  },
  
  // Dark mode colors
  dark: {
    '--background': '#121212',
    '--foreground': COLORS.ui.text.light,
    '--primary': COLORS.ui.primary,
    '--primary-foreground': COLORS.ui.text.light,
    '--secondary': COLORS.ui.secondary,
    '--secondary-foreground': COLORS.ui.text.light,
    '--accent': COLORS.character.highlight,
    '--accent-foreground': COLORS.ui.text.light,
  }
};

// Apply theme variables to document root
export const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  const variables = THEME_VARIABLES[theme];
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};
