// Main content script entry point
let recorder = null;
let puzzleDetector = null;

// Initialize when page is ready
function initialize() {
  // Support both mini and other crossword types
  if (!window.location.href.includes('/crosswords/game/')) {
    return;
  }
  
  puzzleDetector = new PuzzleDetector();
  recorder = new Recorder(puzzleDetector);
  waitForPuzzle();
}

function waitForPuzzle() {
  const observer = new MutationObserver((mutations) => {
    if (detectTimerStart() || detectPlayButtonClick()) {
      observer.disconnect();
      startRecordingSession();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // Check if puzzle is already started
  setTimeout(() => {
    if (detectTimerStart() || detectPlayButtonClick() || isPuzzleActive()) {
      observer.disconnect();
      startRecordingSession();
    }
  }, CONSTANTS.TIMING.RECORDING_CHECK_INTERVAL);
}

function detectTimerStart() {
  const timerSelectors = [
    '.xwd__timer',
    '.Timer-mod',
    '[data-testid="timer"]',
    '.pz-moment__timer'
  ];
  
  for (const selector of timerSelectors) {
    const timer = document.querySelector(selector);
    if (timer && timer.textContent && timer.textContent !== '0:00') {
      return true;
    }
  }
  return false;
}

function detectPlayButtonClick() {
  // Check if the play modal has disappeared or game has started
  const playModalSelectors = [
    '.xwd__modal--subtle',
    '.pz-moment__button',
    '[data-testid="play-button"]'
  ];
  
  // If we can find cells but no play modal, game has started
  const cells = puzzleDetector.findGridCells();
  if (cells && cells.length > 0) {
    for (const selector of playModalSelectors) {
      if (document.querySelector(selector)) {
        return false; // Play button still visible
      }
    }
    return true; // Cells exist but no play button
  }
  return false;
}

function isPuzzleActive() {
  // Check if we can interact with puzzle cells
  const cells = puzzleDetector.findGridCells();
  if (!cells || cells.length === 0) return false;
  
  // Check if any cells have content
  for (const cell of cells) {
    const cellText = puzzleDetector.getCellText ? puzzleDetector.getCellText(cell) : '';
    if (cellText && cellText.length > 0) {
      return true;
    }
  }
  
  // Check if there's a visible timer showing non-zero time
  const timer = document.querySelector('.xwd__timer:not([style*="display: none"])');
  if (timer && timer.textContent && timer.textContent !== '0:00' && timer.textContent !== '') {
    return true;
  }
  
  return false;
}

function startRecordingSession() {
  if (isPuzzleCompleted()) {
    return;
  }
  
  if (recorder.startRecording()) {
    monitorPuzzleCompletion();
  }
}

function isPuzzleCompleted() {
  // Method 1: Look for the exact congratulations modal from NYT Mini
  const congratsModal = document.querySelector('.xwd__congrats-modal, .mini__congrats-modal');
  if (congratsModal && congratsModal.offsetParent !== null) {
    return true;
  }
  
  // Method 2: Check for "Congratulations!" text specifically
  const congratsText = document.querySelector('h1.pz-moment__title, h1');
  if (congratsText && congratsText.textContent && congratsText.textContent.includes('Congratulations!')) {
    return true;
  }
  
  // Method 3: Check for "You solved The Mini" text
  const bodyText = document.body.textContent || document.body.innerText;
  if (bodyText.includes('You solved The Mini') || bodyText.includes('Congratulations!')) {
    return true;
  }
  
  // Method 4: Check if modal with congratulations content exists
  const modalElements = document.querySelectorAll('[data-testid="modal"], .xwd__modal--body, .modal-system-container');
  for (const modal of modalElements) {
    if (modal && modal.offsetParent !== null) {
      const modalText = modal.textContent || modal.innerText;
      if (modalText && (modalText.includes('Congratulations') || modalText.includes('You solved'))) {
        return true;
      }
    }
  }
  
  // Method 5: Check if all cells are filled and no errors
  const cells = puzzleDetector.findGridCells();
  if (cells && cells.length > 0) {
    const expectedCellCount = puzzleDetector.gridSize * puzzleDetector.gridSize;
    if (cells.length !== expectedCellCount) {
      return false;
    }
    
    let filledCount = 0;
    cells.forEach(cell => {
      const text = cell.textContent || cell.innerText;
      if (text && text.trim().length > 0 && !cell.classList.contains('xwd__cell--error')) {
        filledCount++;
      }
    });
    
    // If all cells are filled without errors, likely completed
    if (filledCount === expectedCellCount) {
      return true;
    }
  }
  
  return false;
}

function monitorPuzzleCompletion() {
  const observer = new MutationObserver((mutations) => {
    try {
      if (isPuzzleCompleted()) {
        setTimeout(() => {
          handlePuzzleComplete();
        }, CONSTANTS.TIMING.COMPLETION_CHECK_DELAY);
        observer.disconnect();
      }
    } catch (error) {
      // Silently handle errors
    }
  });
  
  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    // Also check every few seconds as backup
    const backupCheck = setInterval(() => {
      if (isPuzzleCompleted()) {
        clearInterval(backupCheck);
        handlePuzzleComplete();
        observer.disconnect();
      }
    }, CONSTANTS.TIMING.BACKUP_CHECK_INTERVAL);
    
    // Stop backup check after configured timeout
    setTimeout(() => clearInterval(backupCheck), CONSTANTS.TIMING.BACKUP_CHECK_TIMEOUT);
  } catch (error) {
    console.error('Error setting up completion monitoring:', error);
  }
}

async function handlePuzzleComplete() {
  if (recorder && recorder.isRecording) {
    recorder.recording.addAction(ActionTypes.COMPLETE, {
      message: 'Puzzle completed!'
    });
  }
  
  const recordingData = recorder.stopRecording();
  if (!recordingData) return;
  
  try {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      const response = await chrome.runtime.sendMessage({
        action: 'UPLOAD_RECORDING',
        data: recordingData
      });
      
      if (response.success) {
        showShareLink(response.replayId);
      }
    }
  } catch (error) {
    console.warn('[NYT Replay] Could not upload recording:', error);
  }
}

function showShareLink(replayId) {
  try {
    const extensionId = chrome && chrome.runtime ? chrome.runtime.id : 'unknown';
    const extensionUrl = `chrome-extension://${extensionId}/replay.html?id=${replayId}`;
    const publicUrl = `https://bowlofbap.github.io/nyt-mini-replay/public-replay.html?id=${replayId}`;
    
    // Copy just the public URL to clipboard (cleaner for sharing)
    navigator.clipboard.writeText(publicUrl).then(() => {
      if (window.NYTReplayToast) {
        window.NYTReplayToast.showShareLink(publicUrl);
      }
    });
  } catch (error) {
    console.warn('[NYT Replay] Could not show share link:', error);
  }
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (recorder && recorder.isRecording) {
    const recordingData = recorder.stopRecording();
    // Try to save partial recording
    try {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'SAVE_PARTIAL_RECORDING',
          data: recordingData
        });
      }
    } catch (error) {
      console.warn('[NYT Replay] Could not save partial recording:', error);
    }
  }
});

// Only set up message listener if chrome runtime is available
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === 'STOP_RECORDING') {
        if (recorder && recorder.isRecording) {
          handlePuzzleComplete();
        }
        sendResponse({ success: true });
      } else if (request.action === 'UPLOAD_TO_FIREBASE') {
        handleFirebaseUpload(request.replayId, request.data)
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      } else {
        sendResponse({ success: true });
      }
    } catch (error) {
      console.warn('[NYT Replay] Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  });
}

async function handleFirebaseUpload(replayId, recordingData) {
  try {
    const result = await firebaseRESTManager.uploadRecording(recordingData, replayId);
    
    if (window.NYTReplayToast) {
      window.NYTReplayToast.show('Uploaded to cloud!', 'success', 2000);
    }
  } catch (error) {
    if (window.NYTReplayToast) {
      window.NYTReplayToast.show('Cloud upload failed, saved locally', 'warning', 3000);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // Add a small delay to ensure NYT's scripts have loaded
  setTimeout(initialize, 1000);
}