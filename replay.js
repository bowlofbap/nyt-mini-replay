// NYT Mini Crossword Replay viewer

// Get replay ID from URL
const urlParams = new URLSearchParams(window.location.search);
const replayId = urlParams.get('id');

let replayData = null;
let currentActionIndex = 0;
let isPlaying = false;
let timerInterval = null;
let recordingPosition = 0; // Current position in ms in the original recording
let playbackSpeed = 1;

// Elements
const loadingEl = document.getElementById('loading');
const replayContainer = document.getElementById('replay-container');
const errorEl = document.getElementById('error');
const gridEl = document.getElementById('crossword-grid');
const timerEl = document.getElementById('timer');
const playPauseBtn = document.getElementById('play-pause');

// Initialize
if (!replayId) {
  showError();
} else {
  loadReplay();
}

async function loadReplay() {
  try {
    let recording = null;
    
    // Try Firebase first
    try {
      recording = await firebaseRESTManager.downloadRecording(replayId);
    } catch (firebaseError) {
      // Fallback to local storage
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'GET_RECORDING',
          replayId: replayId
        });
        
        if (response.success && response.data) {
          recording = response.data;
        }
      } catch (localError) {
        // Both failed
      }
    }
    
    if (recording) {
      startReplay(recording);
    } else {
      showError();
    }
  } catch (error) {
    showError();
  }
}

function showError() {
  loadingEl.style.display = 'none';
  errorEl.style.display = 'block';
}

function startReplay(data) {
  replayData = data;
  loadingEl.style.display = 'none';
  replayContainer.style.display = 'block';
  
  // Build grid
  buildGrid(data.gridSize, data.blackSquares);
  
  // Set up controls
  playPauseBtn.addEventListener('click', togglePlayback);
  setupSpeedControls();
}

function buildGrid(size, blackSquares) {
  // If no black squares detected during recording, infer them from the final state
  if (!blackSquares || blackSquares.length === 0) {
    blackSquares = inferBlackSquares();
  }
  
  // Use the size from recording data, default to 5 if not specified
  const gridSize = size || CONSTANTS.GRID.DEFAULT_SIZE;
  
  // Calculate responsive cell size and grid dimensions
  const dimensions = GridUtils.calculateGridDimensions(gridSize);
  
  gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  gridEl.style.width = `${dimensions.totalWidth}px`;
  gridEl.style.height = `${dimensions.totalHeight}px`;
  gridEl.style.gap = `${CONSTANTS.LAYOUT.GRID_GAP}px`;
  
  // Clear existing grid
  gridEl.innerHTML = '';
  
  // Create all cells
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.id = `cell-${row}-${col}`;
      
      // Check if black square
      const isBlack = blackSquares && blackSquares.some(([r, c]) => r === row && c === col);
      if (isBlack) {
        cell.classList.add('black');
      }
      
      // Add cell number if exists
      if (replayData && replayData.cellNumbers) {
        const cellNumber = replayData.cellNumbers.find(cn => cn.row === row && cn.col === col);
        if (cellNumber) {
          const numberSpan = document.createElement('span');
          numberSpan.className = 'cell-number';
          numberSpan.textContent = cellNumber.number;
          cell.appendChild(numberSpan);
        }
      }
      
      gridEl.appendChild(cell);
    }
  }
}

function inferBlackSquares() {
  if (!replayData || !replayData.actions) return [];
  
  const gridSize = replayData.gridSize || CONSTANTS.GRID.DEFAULT_SIZE;
  
  // Track which cells ever received letters
  const cellsWithLetters = new Set();
  
  // Go through all actions and note which cells had letters placed
  replayData.actions.forEach(action => {
    if (action.type === 'letter' && action.row !== undefined && action.col !== undefined) {
      cellsWithLetters.add(`${action.row},${action.col}`);
    }
  });
  
  // Any cell that never received a letter is likely a black square
  const blackSquares = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = `${row},${col}`;
      if (!cellsWithLetters.has(key)) {
        blackSquares.push([row, col]);
      }
    }
  }
  
  return blackSquares;
}

function togglePlayback() {
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  isPlaying = true;
  playPauseBtn.textContent = 'Pause';
  
  if (!replayData || !replayData.actions || replayData.actions.length === 0) {
    pausePlayback();
    return;
  }
  
  startContinuousTimer();
}

function startContinuousTimer() {
  // Update every 100ms for smooth display
  timerInterval = setInterval(() => {
    if (isPlaying) {
      // Advance position in recording timeline based on current speed
      recordingPosition += CONSTANTS.TIMING.TIMER_UPDATE_INTERVAL * playbackSpeed;
      
      // Update timer display
      updateTimer(recordingPosition);
      
      // Execute any actions that should happen at this time
      executeActionsAtCurrentTime();
      
      // Check if replay is complete
      if (currentActionIndex >= replayData.actions.length) {
        pausePlayback();
        playPauseBtn.textContent = 'Replay';
      }
    }
  }, CONSTANTS.TIMING.TIMER_UPDATE_INTERVAL);
}

function pausePlayback() {
  isPlaying = false;
  playPauseBtn.textContent = 'Play';
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function executeActionsAtCurrentTime() {
  // Execute all actions that should happen at or before current time
  while (currentActionIndex < replayData.actions.length) {
    const action = replayData.actions[currentActionIndex];
    if (action.ms <= recordingPosition) {
      executeAction(action);
      currentActionIndex++;
    } else {
      break; // No more actions to execute yet
    }
  }
}


function executeAction(action) {
  // Handle completion action (no cell needed)
  if (action.type === 'complete') {
    showCompletionMessage();
    return;
  }
  
  // Handle word highlighting action (affects multiple cells)
  if (action.type === 'word_highlighted') {
    // Clear all current highlights
    gridEl.querySelectorAll('.nyt-highlighted').forEach(el => el.classList.remove('nyt-highlighted'));
    
    if (action.action === 'highlight' && action.cells) {
      // Highlight the specified cells
      action.cells.forEach(cellPos => {
        const cell = document.getElementById(`cell-${cellPos.row}-${cellPos.col}`);
        if (cell && !cell.classList.contains('black')) {
          cell.classList.add('nyt-highlighted');
        }
      });
    }
    return;
  }
  
  const cell = document.getElementById(`cell-${action.row}-${action.col}`);
  
  if (!cell || cell.classList.contains('black')) {
    return;
  }
  
  switch (action.type) {
    case 'select':
      gridEl.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
      cell.classList.add('selected');
      break;
      
    case 'cell_selected':
      if (action.action === 'select') {
        // Clear any previously selected cell
        gridEl.querySelectorAll('.nyt-selected').forEach(el => el.classList.remove('nyt-selected'));
        cell.classList.add('nyt-selected');
      } else if (action.action === 'deselect') {
        cell.classList.remove('nyt-selected');
      }
      break;
      
    case 'letter':
      // Preserve the cell number span if it exists
      const numberSpan = cell.querySelector('.cell-number');
      cell.textContent = action.letter;
      if (numberSpan) {
        cell.appendChild(numberSpan);
      }
      cell.classList.add('filled');
      break;
      
    case 'delete':
    case 'clear':
      // Preserve the cell number span if it exists
      const numberSpanDel = cell.querySelector('.cell-number');
      cell.textContent = '';
      if (numberSpanDel) {
        cell.appendChild(numberSpanDel);
      }
      cell.classList.remove('filled');
      break;
  }
}

function updateTimer(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  
  timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
}

function showCompletionMessage() {
  // Create a simple completion overlay
  const completion = document.createElement('div');
  completion.innerHTML = '🎉 Puzzle Solved!';
  completion.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(completion);
  
  // Remove after configured duration
  setTimeout(() => {
    if (completion.parentNode) {
      completion.parentNode.removeChild(completion);
    }
  }, CONSTANTS.TIMING.COMPLETION_MESSAGE_DURATION);
}

function setupSpeedControls() {
  const speedButtons = document.querySelectorAll('.speed-btn');
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      speedButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      // Set new speed - that's it!
      playbackSpeed = parseFloat(btn.dataset.speed);
    });
  });
}

