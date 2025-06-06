# NYT Mini Crossword Replay Chrome Extension

Record and share replays of your NYT Mini Crossword solving sessions.

## 🎯 What This Does

- Records every letter you type while solving the NYT Mini Crossword
- Captures accurate timing of your solve
- Uploads recordings to the cloud for sharing
- Generates shareable links that anyone can view
- Works automatically when you start solving a puzzle

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" 
4. Click "Load unpacked" and select the project folder
5. Navigate to [NYT Mini Crossword](https://www.nytimes.com/crosswords/game/mini) and start solving!

## 📱 How to Use

1. **Start Solving**: Just click the play button on NYT Mini - recording starts automatically
2. **Solve the Puzzle**: Type letters as normal - everything is recorded
3. **Get Share Link**: When you complete the puzzle, a shareable link is automatically copied to your clipboard
4. **Share with Friends**: Send the link to anyone - they can watch your solve replay

## 🔗 Sharing Options

When you complete a puzzle, you'll get two shareable links:

- **Extension Link**: `chrome-extension://...` - For friends who have the extension installed
- **Public Link**: `https://yourusername.github.io/NytCross/public-replay.html?id=...` - Anyone can view this

## 🏗 Technical Details

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

## 📊 Data Format

Recordings are stored as JSON with this structure:

```javascript
{
  gridSize: 5,                    // Always 5x5 for Mini
  blackSquares: [[0,3], [0,4]],  // Black square positions
  actions: [
    {ms: 0,    type: "letter", row: 0, col: 0, letter: "A"},
    {ms: 1000, type: "letter", row: 0, col: 1, letter: "B"},
    {ms: 2000, type: "delete", row: 0, col: 1},
    {ms: 15000, type: "complete", message: "Puzzle completed!"}
  ],
  totalTime: 15000,              // Total solve time in ms
  puzzleDate: "2024-01-15",      // Puzzle date
  uploadedAt: "2024-01-15T10:30:00Z"
}
```

## 🔒 Privacy

- Only puzzle solving data is recorded (letters, timing, completion)
- No personal information is collected
- Recordings are stored with random IDs
- Anyone with a replay link can view that specific recording

## 🐛 Troubleshooting

### Recording Not Starting
- Make sure you're on the NYT Mini page (`/crosswords/game/mini`)
- Check that the extension is enabled
- Try refreshing the page

### Share Links Not Working
- Verify Firebase configuration is correct
- Check browser console for error messages
- Ensure you have internet connection for cloud upload

### GitHub Pages Not Deploying
- Verify repository has GitHub Pages enabled
- Check Actions tab for deployment status
- Ensure workflow file is in `.github/workflows/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify as needed.

## 🎉 Credits

Built for NYT Mini Crossword enthusiasts who want to share their solving strategies with friends!