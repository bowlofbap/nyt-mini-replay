// Main content script entry point

let recorder = null;
let puzzleDetector = null;

// Initialize when page is ready
function initialize() {
  if (!window.location.href.includes('/crosswords/game/mini')) {
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
    if (detectTimerStart() || detectPlayButtonClick()) {
      observer.disconnect();
      startRecordingSession();
    }
  }, 1000);
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
  if (cells && cells.length === 25) {
    for (const selector of playModalSelectors) {
      if (document.querySelector(selector)) {
        return false; // Play button still visible
      }
    }
    return true; // Cells exist but no play button
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
    console.log('Found NYT Mini congratulations modal');
    return true;
  }
  
  // Method 2: Check for "Congratulations!" text specifically
  const congratsText = document.querySelector('h1.pz-moment__title, h1');
  if (congratsText && congratsText.textContent && congratsText.textContent.includes('Congratulations!')) {
    console.log('Found "Congratulations!" heading');
    return true;
  }
  
  // Method 3: Check for "You solved The Mini" text
  const bodyText = document.body.textContent || document.body.innerText;
  if (bodyText.includes('You solved The Mini') || bodyText.includes('Congratulations!')) {
    console.log('Found completion text in body');
    return true;
  }
  
  // Method 4: Check if modal with congratulations content exists
  const modalElements = document.querySelectorAll('[data-testid="modal"], .xwd__modal--body, .modal-system-container');
  for (const modal of modalElements) {
    if (modal && modal.offsetParent !== null) {
      const modalText = modal.textContent || modal.innerText;
      if (modalText && (modalText.includes('Congratulations') || modalText.includes('You solved'))) {
        console.log('Found congratulations in modal');
        return true;
      }
    }
  }
  
  // Method 5: Check if all cells are filled and no errors
  const cells = puzzleDetector.findGridCells();
  if (cells && cells.length === 25) {
    let filledCount = 0;
    cells.forEach(cell => {
      const text = cell.textContent || cell.innerText;
      if (text && text.trim().length > 0 && !cell.classList.contains('xwd__cell--error')) {
        filledCount++;
      }
    });
    
    // If all 25 cells are filled without errors, likely completed
    if (filledCount === 25) {
      console.log('All cells filled correctly - puzzle likely complete');
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
        }, 200);
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
        console.log('Puzzle completed! (backup check)');
        clearInterval(backupCheck);
        handlePuzzleComplete();
        observer.disconnect();
      }
    }, 2000);
    
    // Stop backup check after 10 minutes
    setTimeout(() => clearInterval(backupCheck), 600000);
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
    const response = await chrome.runtime.sendMessage({
      action: 'UPLOAD_RECORDING',
      data: recordingData
    });
    
    if (response.success) {
      showShareLink(response.replayId);
    }
  } catch (error) {
    // Silently handle upload errors
  }
}

function showShareLink(replayId) {
  const extensionId = chrome.runtime.id;
  const extensionUrl = `chrome-extension://${extensionId}/replay.html?id=${replayId}`;
  const publicUrl = `https://bowlofbap.github.io/nyt-mini-replay/public-replay.html?id=${replayId}`;
  
  // Copy just the public URL to clipboard (cleaner for sharing)
  navigator.clipboard.writeText(publicUrl).then(() => {
    if (window.NYTReplayToast) {
      window.NYTReplayToast.showShareLink(publicUrl);
    }
  });
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (recorder && recorder.isRecording) {
    const recordingData = recorder.stopRecording();
    // Try to save partial recording
    chrome.runtime.sendMessage({
      action: 'SAVE_PARTIAL_RECORDING',
      data: recordingData
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
});

async function handleFirebaseUpload(replayId, recordingData) {
  try {
    const result = await firebaseRESTManager.uploadRecording(recordingData);
    
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
  initialize();
}