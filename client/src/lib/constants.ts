// Game speed (units per second)
export const GAME_SPEED = 3;

// Time between coins (in seconds)
// Now 2.5 seconds between coins for smoother motion
// (with 4 positions: high, mid, low, mid for a 10 second breath cycle)
export const COIN_DISTANCE = 2.5;

// Character sensitivity to motion
// Increased to make character require less tilt to reach extremes
export const MOTION_SENSITIVITY = 0.5;

// Colors
export const COLORS = {
  background: {
    sky: {
      top: '#9d4edd',    // Deep purple
      middle: '#c77dff', // Mid purple
      bottom: '#ffcbf2'  // Light pink
    },
    
    mountains: {
      near: '#b392ac',   // Muted pink/purple
      far: '#d0b3c5'     // Lighter muted pink
    },
  },
  
  character: {
    primary: '#a2d6f9',  // Pale saturated blue
    highlight: '#5db7de' // Medium saturated blue
  },
  
  coin: {
    primary: '#fcd34d',  // Gold
    highlight: '#eab308', // Darker gold
    glow: '#fef3c7'      // Light gold
  },
  
  ui: {
    primary: '#9d4edd',     // Purple
    secondary: '#f59e0b',   // Amber
    text: {
      light: '#ffffff',     // White
      dark: '#1f2937'       // Dark gray
    }
  }
};
