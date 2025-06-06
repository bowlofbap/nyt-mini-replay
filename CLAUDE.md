# NYT Mini Crossword Replay Chrome Extension

## What This Does
Records how you solve the NYT Mini Crossword and creates a link so friends can watch your solve.

## Minimum Viable Product

### Must Have
- Record every letter typed and deleted
- Record which cells were selected
- Capture the timer
- Generate a shareable link
- Replay shows the grid filling in with proper timing
- Professional, industry standard architecture. this is a MUST

### Won't Have
- Speed controls (always 1x speed)
- User accounts
- Editing replays
- Mobile support
- Fancy UI

## Technical Structure

```
nyt-crossword-replay/
├── manifest.json    # Chrome extension config
├── content.js       # Records your solve
├── firebase.js      # Handles upload/download
├── replay.html      # Viewer page
├── replay.js        # Playback logic
└── style.css        # Basic styling
```

## How It Works

### 1. Recording (content.js)
When you open a NYT crossword:
- Detect puzzle start
- Record every action with timestamp:
  - Cell selections (clicks or arrow keys)
  - Letters typed
  - Backspace/delete
- Get the puzzle info (size, black squares)
- Stop recording when you leave the page or finish

### 2. Storage
When recording ends:
- Upload to Firebase as JSON
- Get back a unique ID
- Create shareable link: `chrome-extension://[extension-id]/replay.html?id=abc123`

### 3. Replay
When someone with the extension opens your link:
- Replay page loads within the extension
- Fetch recording from Firebase
- Draw the empty grid
- Play back each action at the right time
- Show timer counting up
- Play/pause button

## Data Format

```javascript
{
  // Puzzle info (so we can draw the grid)
  gridSize: 5,  // Mini is always 5x5
  blackSquares: [[0,3], [0,4], ...],  // positions
  
  // What happened
  actions: [
    {ms: 0,     type: "select", row: 0, col: 0},
    {ms: 1000,  type: "letter", row: 0, col: 0, letter: "A"},
    {ms: 1500,  type: "select", row: 0, col: 1},
    {ms: 2000,  type: "letter", row: 0, col: 1, letter: "B"},
    {ms: 2500,  type: "delete", row: 0, col: 1},  // backspace
  ],
  
  // Total solve time
  totalTime: 245000  // milliseconds
}
```

## Implementation Steps

### Step 1: Get Recording Working
1. Create Chrome extension that loads on NYT crossword
2. Find how to detect cell selections
3. Capture keyboard input
4. Store actions in array

### Step 2: Upload/Download
1. Set up Firebase project
2. When user leaves page, upload recording
3. Generate shareable link
4. Test fetching data back

### Step 3: Build Replay Viewer
1. Create simple HTML page
2. Draw crossword grid based on puzzle info
3. Play back actions with setTimeout
4. Add play/pause button
5. Show timer

## Tricky Parts

### Getting Puzzle Structure
- Need to find which cells are black squares
- NYT's DOM might be complex
- May need to grab this info at record start

### Accurate Timing
- Use `performance.now()` for precise timestamps
- Handle tab switching (pause recording?)

### Cell Selection Detection
- Clicks are easy
- Arrow key navigation might be harder to detect

## Firebase Setup

```javascript
// Super simple Firebase rules (public read/write)
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Just store recordings at `/recordings/{id}`

## Keep It Simple!

### Do First
1. Just get letter recording working
2. Upload to Firebase
3. Basic replay

### Do Later (Maybe Never)
- Reveal/check button recording
- Pencil mode
- Multiple puzzles
- Pretty UI

## Quick Start for Development

```bash
# No build process needed! Just:
1. Open chrome://extensions
2. Enable Developer mode
3. Load unpacked -> select folder
4. Go to NYT crossword
5. Open console to see if recording works
```

## Testing Checklist
- [ ] Records regular typing
- [ ] Records backspace
- [ ] Records clicking different cells
- [ ] Uploads when leaving page
- [ ] Link works
- [ ] Replay shows correct letters
- [ ] Timer advances properly

That's it. Keep it simple, make it work.