# NYT Crossword Replay

A Chrome extension that records your New York Times crossword solving sessions and creates shareable replays for friends to watch your solving strategy.

## Overview

NYT Crossword Replay automatically captures every keystroke, cell selection, and solving pattern as you complete crosswords on nytimes.com. When you finish, it generates a shareable link that lets others watch your solve in real-time with accurate timing and visual feedback.

## Features

### Recording Capabilities
- **Universal Crossword Support**: Works with Mini crosswords (5x5), daily puzzles (15x15), and any grid size
- **Complete Input Tracking**: Records letters typed, deletions, and corrections
- **Visual State Capture**: Tracks cell selections (yellow highlights) and word highlighting (blue highlights)
- **Precise Timing**: Captures exact timestamps for accurate replay speed
- **Automatic Detection**: Starts recording when you begin solving, stops when completed

### Replay Viewing
- **Real-time Playback**: Watch solves unfold with original timing
- **Speed Controls**: View at 1x, 2x, or 4x speed
- **Visual Accuracy**: Shows cell selections and word highlights as they occurred
- **Responsive Design**: Adapts to different crossword sizes automatically
- **Share Anywhere**: Replay links work for anyone, no extension required

### Technical Features
- **Firebase Integration**: Secure cloud storage for replay data
- **Professional Architecture**: Modular design with separation of concerns
- **Error Handling**: Robust error recovery and user feedback
- **Performance Optimized**: Minimal impact on solving experience

## Installation

### From Source
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your Chrome toolbar

### Usage
1. Navigate to any NYT crossword at `nytimes.com/crosswords/game/`
2. Start solving normally - recording begins automatically
3. Complete the puzzle as usual
4. When finished, a toast notification will show your replay link
5. Copy and share the link with friends

## How It Works

### Recording Process
The extension monitors the crossword page for:
- Timer activation indicating puzzle start
- Cell clicks and arrow key navigation
- Letter input and deletions
- Selection state changes (yellow/blue highlighting)
- Puzzle completion events

### Data Storage
Recordings are stored securely in Firebase with:
- Grid size and structure information
- Complete action history with timestamps
- Cell numbering and clue data
- Shareable unique identifiers

### Replay Generation
Public replay links display:
- Responsive crossword grid
- Action-by-action playback
- Original timing preservation
- Speed control options
- Professional interface

## Supported Crosswords

- **NYT Mini**: 5x5 weekday puzzles
- **NYT Daily**: 15x15 standard crosswords
- **Custom Sizes**: Any square grid from 3x3 to 21x21
- **All Variants**: Weekend puzzles, themed puzzles, special editions

## Technical Details

### Architecture
- **Manifest V3** Chrome Extension
- **Content Scripts** for DOM interaction and recording
- **Background Service Worker** for data handling
- **Firebase Firestore** for cloud storage
- **GitHub Pages** for public replay viewer

### File Structure
```
nyt-crossword-replay/
├── manifest.json           # Chrome extension configuration
├── src/
│   ├── background/
│   │   └── service-worker.js    # Background tasks
│   ├── content/
│   │   ├── index.js            # Main content script
│   │   ├── recorder.js         # Recording logic
│   │   ├── puzzle-detector.js  # NYT DOM detection
│   │   ├── recording.js        # Data structures
│   │   └── toast.js           # Notifications
│   ├── popup/
│   │   ├── popup.html         # Extension popup
│   │   └── popup.js           # Popup logic
│   └── shared/
│       ├── constants.js       # Shared constants
│       └── firebase-v9.js     # Firebase integration
├── replay.html             # Extension replay viewer
├── replay.js              # Replay logic
├── public-replay.html     # Public GitHub Pages viewer
└── style.css             # Styling
```

## 🛠 Development

### Prerequisites
- Chrome browser
- Firebase project (for cloud storage)
- GitHub account (for public sharing)

### Setup Firebase
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Update Firebase config in `src/shared/constants.js`
4. Update config in `public-replay.html`

### Setup GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Set source to "GitHub Actions"
4. The deployment workflow will automatically deploy on push to main

### Testing
1. Load the extension in Chrome developer mode
2. Go to NYT Mini Crossword
3. Solve a puzzle and verify recording works
4. Test replay links work correctly

### Configuration
All timing, sizing, and behavior constants are centralized in `src/shared/constants.js` for easy customization and maintenance.

### Building
No build process required - the extension runs directly from source files.

## Privacy and Security

- **No Personal Data**: Only puzzle-solving actions are recorded
- **Secure Storage**: All data encrypted in transit and at rest
- **Anonymous Sharing**: Replay links contain no personal information
- **Local Processing**: Sensitive operations happen in your browser

## Technical Requirements

- **Browser**: Chrome 88+ (Manifest V3 compatible)
- **Website**: nytimes.com crossword pages
- **Internet**: Required for saving and sharing replays
- **Permissions**: Limited to nytimes.com and Firebase storage

## Troubleshooting

### Recording Issues
- Ensure you're on a supported NYT crossword page
- Check that the extension is enabled in Chrome
- Reload the page if recording doesn't start automatically

### Replay Problems
- Verify the replay link is complete and accurate
- Check your internet connection
- Try opening the link in a new browser tab

### Performance Concerns
- The extension uses minimal resources during solving
- Recording data is compressed for efficient storage
- No impact on crossword solving speed or accuracy

## Development

### Setup Firebase
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Update Firebase config in `src/shared/constants.js`
4. Update config in `public-replay.html`

### Setup GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Set source to "GitHub Actions"
4. The deployment workflow will automatically deploy on push to main

### Testing
1. Load the extension in Chrome developer mode
2. Go to NYT crossword page
3. Solve a puzzle and verify recording works
4. Test replay links work correctly

## Version History

**v1.0.3** - Current Release
- Universal crossword size support
- Responsive cell sizing
- Enhanced selection tracking
- Improved error handling
- Centralized configuration system

## Support

For issues, feature requests, or technical questions, please visit the project repository or contact the development team.

## License

This extension is provided as-is for personal use with New York Times crosswords. Please respect NYT's terms of service when using this tool.