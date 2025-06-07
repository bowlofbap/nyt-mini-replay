// Type definitions for better code organization
// (In a TypeScript project, these would be actual types)

const ActionTypes = {
  SELECT: 'select',
  LETTER: 'letter',
  DELETE: 'delete',
  CLEAR: 'clear',
  COMPLETE: 'complete'
};

const RecordingStates = {
  IDLE: 'idle',
  RECORDING: 'recording',
  UPLOADING: 'uploading',
  COMPLETE: 'complete',
  ERROR: 'error'
};

// Recording data structure
class Recording {
  constructor() {
    this.gridSize = null; // Will be set dynamically
    this.blackSquares = [];
    this.actions = [];
    this.startTime = null;
    this.totalTime = 0;
    this.puzzleDate = new Date().toISOString();
    this.puzzleTitle = '';
  }
  
  addAction(type, data) {
    const timestamp = performance.now() - this.startTime;
    this.actions.push({
      ms: timestamp,
      type: type,
      ...data
    });
  }
}