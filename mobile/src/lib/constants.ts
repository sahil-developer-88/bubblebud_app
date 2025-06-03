// ---------------------------------------------
// Game Mechanics Constants
// ---------------------------------------------

// Speed at which the game environment scrolls (higher = faster)
export const GAME_SPEED = 3;

// Distance between coins (in game units) to control spacing
export const COIN_DISTANCE = 2.5;

// Sensitivity of player character movement to user input
export const MOTION_SENSITIVITY = 0.5;


// ---------------------------------------------
// Coin Vertical Placement
// ---------------------------------------------

// High position for coins (top area of the screen)
export const HIGH_POSITION = 3;

// Middle position (center of the screen)
export const MID_POSITION = 0;

// Low position (near ground or bottom of the screen)
export const LOW_POSITION = -3;


// ---------------------------------------------
// Game Color Palette
// ---------------------------------------------

export const COLORS = {
  background: {
    sky: {
      // Gradient sky colors from top to bottom
      top: '#9d4edd',      // Deep purple (upper sky)
      middle: '#c77dff',   // Medium purple (mid sky)
      bottom: '#ffcbf2'    // Light pink (horizon)
    },
    mountains: {
      // Layered mountain colors for depth
      near: '#b392ac',     // Closer mountains (darker)
      far: '#d0b3c5'       // Distant mountains (lighter)
    }
  },

  character: {
    // Primary character color and accent highlights
    primary: '#a2d6f9',    // Main body color (light blue)
    highlight: '#5db7de'   // Accent/shadow (darker blue)
  },

  coin: {
    // Visual style for collectible coins
    primary: '#fcd34d',    // Base gold color
    highlight: '#eab308',  // Shading or border
    glow: '#fef3c7'        // Glow effect or shine
  },

  ui: {
    // UI colors for elements like score, buttons, menus
    primary: '#9d4edd',    // Main UI color (matches sky top)
    secondary: '#f59e0b',  // Attention-grabbing accent (amber)

    text: {
      light: '#ffffff',    // Text on dark backgrounds
      dark: '#1f2937'      // Text on light backgrounds
    }
  }
};
