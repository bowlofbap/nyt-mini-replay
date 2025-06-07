// Detects and parses NYT Mini crossword structure
class PuzzleDetector {
  constructor() {
    this.gridSize = null; // Will be detected dynamically
  }
  
  detectPuzzleStructure() {
    // Find all cells first to determine grid size
    const cells = this.findGridCells();
    if (!cells || cells.length === 0) {
      console.error('Could not find crossword grid cells');
      return null;
    }
    
    // Determine grid size from cell count
    this.gridSize = Math.sqrt(cells.length);
    console.log(`Detected grid size: ${this.gridSize}x${this.gridSize} (${cells.length} total cells)`);
    
    const puzzleInfo = {
      gridSize: this.gridSize,
      blackSquares: [],
      clueNumbers: {},
      title: this.getPuzzleTitle(),
      date: this.getPuzzleDate(),
      clues: this.getClues()
    };
    
    // Get cell numbers
    puzzleInfo.cellNumbers = this.getCellNumbers(cells);
    
    return puzzleInfo;
  }
  
  findGridCells() {
    // NYT uses specific class names for cells
    // These selectors may need adjustment based on NYT's current HTML
    const selectors = [
      '.xwd__cell',  // Common NYT crossword cell class
      '[data-testid="cell"]',
      '.Cell-block',
      'g[data-group="cells"] rect',  // SVG-based grid
      '.cell',  // Generic cell class
      '.pz-cell',  // Another possible NYT pattern
      '.mini-cell',  // Mini-specific
      '.cell-block',  // Dash variant
      'rect[data-row]',  // SVG with data attributes
      'input[type="text"]',  // Input-based cells
      '[role="gridcell"]',  // Accessibility-based
      '.crossword-cell'  // Generic crossword
    ];
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const selector of selectors) {
      const cells = document.querySelectorAll(selector);
      
      if (cells.length > 0) {
        const cellCount = cells.length;
        const possibleGridSize = Math.sqrt(cellCount);
        
        // Check if it's a perfect square (valid grid)
        if (Number.isInteger(possibleGridSize)) {
          // Validate grid size is within reasonable bounds
          if (possibleGridSize >= CONSTANTS.GRID.MIN_SIZE && possibleGridSize <= CONSTANTS.GRID.MAX_SIZE) {
            console.log(`Found ${cellCount} cells (${possibleGridSize}x${possibleGridSize} grid) with selector: ${selector}`);
            
            // Score based on how well it matches expected patterns
            let score = cellCount;
            
            // Prefer common sizes (Mini = 5x5, Daily = 15x15)
            if (possibleGridSize === 5 || possibleGridSize === 15) {
              score += 1000;
            }
            
            // Prefer NYT-specific selectors
            if (selector.includes('xwd') || selector.includes('testid')) {
              score += 500;
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                cells: Array.from(cells),
                gridSize: possibleGridSize,
                selector: selector
              };
            }
          }
        } else {
          console.log(`[NYT Replay] Found ${cellCount} cells with selector: ${selector} (not a perfect square grid)`);
        }
      }
    }
    
    if (bestMatch) {
      console.log(`[NYT Replay] Selected best match: ${bestMatch.gridSize}x${bestMatch.gridSize} grid with selector: ${bestMatch.selector}`);
      this.gridSize = bestMatch.gridSize;
      return bestMatch.cells;
    }
    
    // Try to find any element that might be a crossword container for debugging
    const containerSelectors = ['.crossword', '.puzzle', '.mini', '.xwd', '.pz-moment', '.game-board'];
    containerSelectors.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`[NYT Replay] Found potential container: ${selector}`);
        const cells = container.querySelectorAll('*');
        console.log(`[NYT Replay] Container has ${cells.length} child elements`);
      }
    });
    
    return null;
  }
  
  isBlackSquare(cell) {
    // NYT Mini black squares have the specific class .xwd__cell--block
    if (cell.classList && cell.classList.contains('xwd__cell--block')) {
      return true;
    }
    
    // Also check for the fill attribute being #000 (as you found)
    if (cell.tagName === 'rect' || cell.tagName === 'RECT') {
      const fill = cell.getAttribute('fill');
      if (fill === '#000' || fill === '#000000' || fill === 'black') {
        return true;
      }
    }
    
    return false;
  }
  
  getClueNumber(cell) {
    // Look for clue number within cell
    const numberElement = cell.querySelector('.xwd__clue-label, .Cell-label, text');
    if (numberElement) {
      return parseInt(numberElement.textContent);
    }
    return null;
  }
  
  getPuzzleTitle() {
    // Try to find puzzle title
    const titleSelectors = [
      '.xwd__details--title',
      '.PuzzleDetails-title',
      'h1.puzzle-title'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return 'NYT Mini Crossword';
  }
  
  getPuzzleDate() {
    // Try to extract date from page
    const dateSelectors = [
      '.xwd__details--date',
      '.PuzzleDetails-date',
      'time[datetime]'
    ];
    
    for (const selector of dateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.getAttribute('datetime') || element.textContent.trim();
      }
    }
    
    return new Date().toISOString();
  }
  
  getCellPosition(cellElement) {
    // Convert cell element to row/col coordinates
    const cells = this.findGridCells();
    const index = cells.indexOf(cellElement);
    
    if (index === -1) return null;
    
    return {
      row: Math.floor(index / this.gridSize),
      col: index % this.gridSize
    };
  }
  
  getClues() {
    const clues = {
      across: [],
      down: []
    };
    
    // Find all clue list wrappers
    const clueWrappers = document.querySelectorAll('.xwd__clue-list--wrapper');
    
    clueWrappers.forEach(wrapper => {
      // Find the title to determine if it's Across or Down
      const titleElement = wrapper.querySelector('.xwd__clue-list--title');
      if (!titleElement) return;
      
      const direction = titleElement.textContent.toLowerCase().trim();
      if (direction !== 'across' && direction !== 'down') return;
      
      // Find all clues in this section
      const clueElements = wrapper.querySelectorAll('.xwd__clue--li');
      
      clueElements.forEach(clueEl => {
        const labelEl = clueEl.querySelector('.xwd__clue--label');
        const textEl = clueEl.querySelector('.xwd__clue--text');
        
        if (labelEl && textEl) {
          const number = parseInt(labelEl.textContent.trim());
          const text = textEl.textContent.trim();
          
          clues[direction].push({
            number: number,
            text: text
          });
        }
      });
    });
    
    // Sort clues by number
    clues.across.sort((a, b) => a.number - b.number);
    clues.down.sort((a, b) => a.number - b.number);
    
    return clues;
  }
  
  getCellNumbers(cells) {
    const cellNumbers = [];
    
    cells.forEach((cell, index) => {
      const row = Math.floor(index / this.gridSize);
      const col = index % this.gridSize;
      
      // Look for number text within the cell
      let number = null;
      
      // For SVG cells, look for text element with cell number
      const textEl = cell.querySelector('text[data-testid="cell-text"]');
      if (textEl && textEl.textContent) {
        const text = textEl.textContent.trim();
        // Only capture if it's a number (not a letter)
        if (text && /^\d+$/.test(text)) {
          number = parseInt(text);
        }
      }
      
      // Alternative: check for clue number in other formats
      if (!number) {
        const labelEl = cell.querySelector('.xwd__clue-label, .Cell-label');
        if (labelEl && labelEl.textContent) {
          const text = labelEl.textContent.trim();
          if (text && /^\d+$/.test(text)) {
            number = parseInt(text);
          }
        }
      }
      
      if (number) {
        cellNumbers.push({
          row: row,
          col: col,
          number: number
        });
      }
    });
    
    return cellNumbers;
  }
}