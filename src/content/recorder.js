// Handles recording of user interactions
class Recorder {
  constructor(puzzleDetector) {
    this.puzzleDetector = puzzleDetector;
    this.recording = null;
    this.isRecording = false;
    this.observer = null;
    this.gridCells = null;
    this.cellStates = null;
  }
  
  startRecording() {
    if (this.isRecording) return;
    
    this.recording = new Recording();
    this.recording.startTime = performance.now();
    
    const puzzleInfo = this.puzzleDetector.detectPuzzleStructure();
    if (!puzzleInfo) {
      console.error('[NYT Replay] Could not detect puzzle structure');
      return false;
    }
    
    console.log('[NYT Replay] Recording with grid size:', puzzleInfo.gridSize);
    
    this.recording.gridSize = puzzleInfo.gridSize;
    this.recording.blackSquares = puzzleInfo.blackSquares;
    this.recording.puzzleTitle = puzzleInfo.title;
    this.recording.puzzleDate = puzzleInfo.date;
    this.recording.clues = puzzleInfo.clues;
    this.recording.cellNumbers = puzzleInfo.cellNumbers;
    
    this.attachEventListeners();
    this.isRecording = true;
    this.saveRecordingState();
    
    if (window.NYTReplayToast) {
      window.NYTReplayToast.showRecordingStarted();
    }
    
    return true;
  }
  
  attachEventListeners() {
    // Find all grid cells once
    this.gridCells = this.puzzleDetector.findGridCells();
    if (!this.gridCells || this.gridCells.length === 0) {
      console.error('Cannot find grid cells for recording');
      return;
    }
    
    // Store initial state of all cells
    this.cellStates = new Map();
    this.gridCells.forEach((cell, index) => {
      const gridSize = this.recording.gridSize || 5; // Use recording's grid size or default to 5
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const currentText = this.getCellText(cell);
      this.cellStates.set(`${row},${col}`, currentText);
    });
    
    // Use MutationObserver to watch for changes to cell content
    this.changeCheckTimeout = null;
    this.observer = new MutationObserver((mutations) => {
      
      // Throttle multiple rapid changes
      if (this.changeCheckTimeout) {
        clearTimeout(this.changeCheckTimeout);
      }
      
      this.changeCheckTimeout = setTimeout(() => {
        this.checkForCellChanges();
      }, 100); // Check after 100ms of no changes
    });
    
    // Observe the entire crossword container for changes
    const container = document.querySelector('.pz-moment, .xwd, .crossword') || document.body;
    
    // Make sure we have a valid container before observing
    if (container && container instanceof Node) {
      try {
        this.observer.observe(container, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['aria-label']
        });
      } catch (error) {
        console.error('Failed to start MutationObserver:', error);
        // Fall back to document.body if specific container fails
        if (document.body) {
          this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['aria-label']
          });
        }
      }
    } else {
      console.error('No valid container found for MutationObserver');
    }
  }
  
  getCellText(cell) {
    // For NYT Mini, the letter is typically in the first <text> element
    const textElements = cell.querySelectorAll('text');
    if (textElements.length > 0) {
      // Get the first text element that contains a single letter
      for (const textEl of textElements) {
        const text = textEl.textContent.trim();
        if (text.length === 1 && /[A-Z]/i.test(text)) {
          return text.toUpperCase();
        }
      }
    }
    
    // Check aria-label as backup
    const ariaLabel = cell.getAttribute('aria-label');
    if (ariaLabel) {
      // Extract letter from aria-label like "5A: Ending for 'cine' and 'multi,' in movie theater names, Answer: 4 letters, Letter: A"
      const letterMatch = ariaLabel.match(/Letter:\s*([A-Z])/i);
      if (letterMatch) {
        return letterMatch[1].toUpperCase();
      }
    }
    
    // Check for input elements within the cell
    const input = cell.querySelector('input');
    if (input && input.value && input.value.length === 1) {
      return input.value.toUpperCase();
    }
    
    return '';
  }
  
  checkForCellChanges() {
    if (!this.isRecording || !this.gridCells) {
      return;
    }
    
    this.gridCells.forEach((cell, index) => {
      const gridSize = this.recording.gridSize || 5; // Use recording's grid size or default to 5
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const key = `${row},${col}`;
      const currentText = this.getCellText(cell);
      const previousText = this.cellStates.get(key) || '';
      
      if (currentText !== previousText) {
        
        if (currentText && !previousText) {
          // Letter added
          this.recording.addAction(ActionTypes.LETTER, {
            row: row,
            col: col,
            letter: currentText
          });
        } else if (!currentText && previousText) {
          // Letter removed
          this.recording.addAction(ActionTypes.DELETE, {
            row: row,
            col: col
          });
        } else if (currentText && previousText && currentText !== previousText) {
          // Letter changed
          this.recording.addAction(ActionTypes.LETTER, {
            row: row,
            col: col,
            letter: currentText
          });
        }
        
        // Update stored state
        this.cellStates.set(key, currentText);
      }
    });
  }
  
  stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    this.recording.totalTime = performance.now() - this.recording.startTime;
    
    // Disconnect MutationObserver
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Clear any pending timeout
    if (this.changeCheckTimeout) {
      clearTimeout(this.changeCheckTimeout);
      this.changeCheckTimeout = null;
    }
    
    // Clean up
    this.gridCells = null;
    this.cellStates = null;
    
    // Show toast notification
    if (window.NYTReplayToast) {
      window.NYTReplayToast.showRecordingStopped(this.recording.totalTime);
    }
    
    // Return the recording data
    const recordingData = this.recording;
    this.recording = null;
    
    return recordingData;
  }
  
  saveRecordingState() {
    // Save current state to chrome.storage for recovery
    chrome.storage.local.set({
      [CONSTANTS.STORAGE_KEYS.RECORDING_STATE]: {
        isRecording: this.isRecording,
        startTime: this.recording.startTime,
        puzzleDate: this.recording.puzzleDate
      }
    });
  }
}