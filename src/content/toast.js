// Toast notification system for in-page notifications
class Toast {
  constructor() {
    this.container = null;
    this.createContainer();
  }
  
  createContainer() {
    // Check if container already exists
    if (document.getElementById('nyt-replay-toast-container')) {
      this.container = document.getElementById('nyt-replay-toast-container');
      return;
    }
    
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'nyt-replay-toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }
  
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'nyt-replay-toast';
    
    // Set colors based on type
    const colors = {
      info: '#007bff',
      success: '#28a745',
      error: '#dc3545',
      recording: '#dc3545'
    };
    
    const bgColor = colors[type] || colors.info;
    
    toast.style.cssText = `
      background-color: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
      max-width: 300px;
    `;
    
    // Add icon based on type
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      recording: '🔴'
    };
    
    toast.innerHTML = `
      <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;
    
    this.container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
    
    return toast;
  }
  
  remove(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
  
  showRecordingStarted() {
    return this.show('Recording started', 'recording', 3000);
  }
  
  showRecordingStopped(duration) {
    const seconds = Math.round(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    return this.show(`Recording stopped (${timeStr})`, 'success', 4000);
  }
  
  showShareLink(url) {
    const toast = this.show('📋 Replay link copied to clipboard!', 'success', 5000);
    
    // Make it clickable
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', () => {
      navigator.clipboard.writeText(url);
      this.show('Link copied again!', 'info', 2000);
    });
    
    return toast;
  }
}

// Export for use in other modules
window.NYTReplayToast = new Toast();