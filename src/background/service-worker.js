// Background service worker for handling extension-wide tasks
importScripts('../shared/constants.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'UPLOAD_RECORDING':
      handleUploadRecording(request.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'SAVE_PARTIAL_RECORDING':
      savePartialRecording(request.data);
      sendResponse({ success: true });
      break;
      
    case 'GET_RECORDING':
      getRecording(request.replayId)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

async function handleUploadRecording(recordingData) {
  try {
    const replayId = generateReplayId();
    
    await chrome.storage.local.set({
      [`recording_${replayId}`]: recordingData
    });
    
    // Trigger Firebase upload from content script
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'UPLOAD_TO_FIREBASE',
          replayId: replayId,
          data: recordingData
        });
      }
    } catch (tabError) {
      // Silently fail if can't reach content script
    }
    
    return { success: true, replayId };
  } catch (error) {
    throw error;
  }
}

async function getRecording(replayId) {
  try {
    const result = await chrome.storage.local.get(`recording_${replayId}`);
    const recording = result[`recording_${replayId}`];
    
    if (!recording) {
      throw new Error('Recording not found');
    }
    
    return recording;
  } catch (error) {
    throw error;
  }
}

function savePartialRecording(recordingData) {
  // Save incomplete recording for potential recovery
  chrome.storage.local.set({
    [CONSTANTS.STORAGE_KEYS.CURRENT_RECORDING]: recordingData,
    partial_recording_timestamp: Date.now()
  });
}

function generateReplayId() {
  // Generate a simple unique ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${random}`;
}

// Clean up old partial recordings
chrome.storage.local.get(null, (items) => {
  const now = Date.now();
  const keysToRemove = [];
  
  Object.keys(items).forEach(key => {
    if (key.startsWith('partial_') && items[key].timestamp < now - 86400000) { // 24 hours
      keysToRemove.push(key);
    }
  });
  
  if (keysToRemove.length > 0) {
    chrome.storage.local.remove(keysToRemove);
  }
});