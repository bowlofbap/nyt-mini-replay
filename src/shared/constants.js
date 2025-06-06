const CONSTANTS = {
  MINI_GRID_SIZE: 5,
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyBaNz89KgPikNMFnFLaLDQmIYHwBlb1yDI",
    authDomain: "nyt-crossword-replay-cd33a.firebaseapp.com",
    projectId: "nyt-crossword-replay-cd33a",
    storageBucket: "nyt-crossword-replay-cd33a.firebasestorage.app",
    messagingSenderId: "818145249358",
    appId: "1:818145249358:web:df1dbeb6b40a4ddd465b1f"
  },
  STORAGE_KEYS: {
    CURRENT_RECORDING: 'nyt_mini_current_recording',
    RECORDING_STATE: 'nyt_mini_recording_state'
  },
  EVENTS: {
    START_RECORDING: 'START_RECORDING',
    STOP_RECORDING: 'STOP_RECORDING',
    RECORDING_COMPLETE: 'RECORDING_COMPLETE',
    CELL_SELECTED: 'CELL_SELECTED',
    LETTER_TYPED: 'LETTER_TYPED',
    CELL_CLEARED: 'CELL_CLEARED'
  }
};