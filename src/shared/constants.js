const CONSTANTS = {
  // Grid Configuration
  GRID: {
    DEFAULT_SIZE: 5,
    MIN_SIZE: 3,
    MAX_SIZE: 21,
    CELL_SIZE_BREAKPOINTS: {
      SMALL: { maxCells: 25, cellSize: 50 },    // 5x5 and smaller
      MEDIUM: { maxCells: 121, cellSize: 35 },  // 11x11 and smaller  
      LARGE: { maxCells: 441, cellSize: 25 }    // 21x21 and smaller
    }
  },
  
  // Layout and Spacing
  LAYOUT: {
    CONTAINER_PADDING: 20,
    CONTAINER_MAX_WIDTH: 600,
    GRID_GAP: 2,
    GRID_BORDER_WIDTH: 2,
    CELL_BORDER_WIDTH: 1,
    BORDER_RADIUS: {
      SMALL: 4,
      MEDIUM: 8,
      LARGE: 12
    },
    SPACING: {
      XS: 5,
      SM: 10,
      MD: 15,
      LG: 20,
      XL: 30
    }
  },
  
  // Typography
  TYPOGRAPHY: {
    FONT_SIZES: {
      XS: 10,
      SM: 12,
      MD: 14,
      LG: 16,
      XL: 18,
      XXL: 24,
      XXXL: 28
    },
    CELL_NUMBER_SIZE: 10,
    TIMER_SIZE: 24
  },
  
  // Timing
  TIMING: {
    TOAST_DURATION: 3000,
    TOAST_LONG_DURATION: 5000,
    TIMER_UPDATE_INTERVAL: 100,
    COMPLETION_MESSAGE_DURATION: 3000,
    DEBOUNCE_TIMEOUT: 100,
    RECORDING_CHECK_INTERVAL: 1000,
    COMPLETION_CHECK_DELAY: 200,
    BACKUP_CHECK_INTERVAL: 2000,
    BACKUP_CHECK_TIMEOUT: 600000
  },
  
  // Z-Index Layers
  Z_INDEX: {
    TOAST: 10000,
    COMPLETION_MESSAGE: 1000
  },
  
  // Firebase Configuration
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyBaNz89KgPikNMFnFLaLDQmIYHwBlb1yDI",
    authDomain: "nyt-crossword-replay-cd33a.firebaseapp.com",
    projectId: "nyt-crossword-replay-cd33a",
    storageBucket: "nyt-crossword-replay-cd33a.firebasestorage.app",
    messagingSenderId: "818145249358",
    appId: "1:818145249358:web:df1dbeb6b40a4ddd465b1f"
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    CURRENT_RECORDING: 'nyt_mini_current_recording',
    RECORDING_STATE: 'nyt_mini_recording_state'
  },
  
  // Events
  EVENTS: {
    START_RECORDING: 'START_RECORDING',
    STOP_RECORDING: 'STOP_RECORDING',
    RECORDING_COMPLETE: 'RECORDING_COMPLETE',
    CELL_SELECTED: 'CELL_SELECTED',
    LETTER_TYPED: 'LETTER_TYPED',
    CELL_CLEARED: 'CELL_CLEARED'
  }
};

// Utility functions for responsive grid sizing
const GridUtils = {
  /**
   * Calculate optimal cell size based on grid dimensions and available space
   */
  calculateCellSize(gridSize, maxContainerWidth = CONSTANTS.LAYOUT.CONTAINER_MAX_WIDTH) {
    const totalCells = gridSize * gridSize;
    
    // Find appropriate breakpoint
    let cellSize = CONSTANTS.GRID.CELL_SIZE_BREAKPOINTS.LARGE.cellSize; // default to smallest
    
    for (const [_, breakpoint] of Object.entries(CONSTANTS.GRID.CELL_SIZE_BREAKPOINTS)) {
      if (totalCells <= breakpoint.maxCells) {
        cellSize = breakpoint.cellSize;
        break;
      }
    }
    
    // Ensure grid fits in container with padding and borders
    const padding = CONSTANTS.LAYOUT.CONTAINER_PADDING * 2;
    const borders = CONSTANTS.LAYOUT.GRID_BORDER_WIDTH * 2;
    const gaps = CONSTANTS.LAYOUT.GRID_GAP * (gridSize - 1);
    const availableWidth = maxContainerWidth - padding - borders - gaps;
    
    const maxCellSize = Math.floor(availableWidth / gridSize);
    
    return Math.min(cellSize, maxCellSize);
  },
  
  /**
   * Calculate total grid size including gaps and borders
   */
  calculateGridDimensions(gridSize, cellSize = null) {
    if (!cellSize) {
      cellSize = this.calculateCellSize(gridSize);
    }
    
    const totalCellsWidth = cellSize * gridSize;
    const totalGaps = CONSTANTS.LAYOUT.GRID_GAP * (gridSize - 1);
    const totalBorders = CONSTANTS.LAYOUT.GRID_BORDER_WIDTH * 2;
    
    return {
      cellSize,
      totalWidth: totalCellsWidth + totalGaps + totalBorders,
      totalHeight: totalCellsWidth + totalGaps + totalBorders
    };
  }
};