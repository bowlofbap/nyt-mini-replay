// Extension popup script
document.addEventListener('DOMContentLoaded', () => {
  updateStatus();
  loadRecentRecordings();
  setupManualControls();
});

// Add constants since popup can't import modules
const STORAGE_KEYS = {
  RECORDING_STATE: 'nyt_mini_recording_state'
};

async function updateStatus() {
  const statusEl = document.getElementById('status');
  const manualControls = document.getElementById('manual-controls');
  
  try {
    // Check if we're on a Mini crossword page
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab || !activeTab.url) {
      statusEl.className = 'status idle';
      statusEl.textContent = 'Open a NYT Mini crossword';
      manualControls.style.display = 'none';
      return;
    }
    
    const isOnMiniPage = activeTab.url.includes('nytimes.com/crosswords/game/mini');
    
    if (!isOnMiniPage) {
      statusEl.className = 'status idle';
      statusEl.textContent = 'Open a NYT Mini crossword';
      manualControls.style.display = 'none';
      return;
    }
    
    // Check if currently recording
    const state = await chrome.storage.local.get(STORAGE_KEYS.RECORDING_STATE);
    const recordingState = state[STORAGE_KEYS.RECORDING_STATE];
    
    if (recordingState && recordingState.isRecording) {
      statusEl.className = 'status recording';
      statusEl.textContent = 'Recording your solve...';
      manualControls.style.display = 'block';
    } else {
      statusEl.className = 'status idle';
      statusEl.textContent = 'Ready - click Play to start';
      manualControls.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

async function loadRecentRecordings() {
  const listEl = document.getElementById('recordings-list');
  
  try {
    // Get all recordings from storage
    const items = await chrome.storage.local.get(null);
    const recordings = [];
    
    Object.keys(items).forEach(key => {
      if (key.startsWith('recording_')) {
        const id = key.replace('recording_', '');
        console.log('Found recording:', id, items[key]);
        recordings.push({
          id: id,
          data: items[key]
        });
      }
    });
    
    console.log('Total recordings found:', recordings.length);
    console.log('All storage items:', Object.keys(items));
    
    if (recordings.length === 0) {
      return;
    }
    
    // Sort by date (newest first)
    recordings.sort((a, b) => {
      const dateA = new Date(a.data.puzzleDate);
      const dateB = new Date(b.data.puzzleDate);
      return dateB - dateA;
    });
    
    // Display recordings
    listEl.innerHTML = '';
    recordings.slice(0, 5).forEach(recording => {
      const item = createRecordingItem(recording);
      listEl.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading recordings:', error);
  }
}

function createRecordingItem(recording) {
  const div = document.createElement('div');
  div.className = 'recording-item';
  
  const date = new Date(recording.data.puzzleDate || Date.now());
  const timeStr = formatTime(recording.data.totalTime || 0);
  
  div.innerHTML = `
    <div style="font-weight: bold">${date.toLocaleDateString()}</div>
    <div style="font-size: 12px; color: #666">Time: ${timeStr}</div>
  `;
  
  div.addEventListener('click', () => {
    // Open replay
    const extensionId = chrome.runtime.id;
    const replayUrl = `chrome-extension://${extensionId}/replay.html?id=${recording.id}`;
    chrome.tabs.create({ url: replayUrl });
  });
  
  return div;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Refresh when window gets focus
window.addEventListener('focus', () => {
  updateStatus();
  loadRecentRecordings();
});

function setupManualControls() {
  const stopBtn = document.getElementById('stop-recording-btn');
  
  stopBtn.addEventListener('click', async () => {
    try {
      stopBtn.disabled = true;
      
      // Send message to content script to stop recording
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      await chrome.tabs.sendMessage(activeTab.id, { action: 'STOP_RECORDING' });
      
      // Update UI
      await updateStatus();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      stopBtn.disabled = false;
    }
  });
}