// src/js/hotkeys.js

export class HotkeyManager {
  constructor(app) {
    this.app = app;
    this.setupHotkeys();
  }
  
  setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      // F1 - CQ
      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('cqButton').click();
      }
      
      // Enter - Send
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('sendButton').click();
      }
      
      // Shift+Enter - TU
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        document.getElementById('tuButton').click();
      }
      
      // Escape - Stop
      if (e.key === 'Escape') {
        e.preventDefault();
        document.getElementById('stopButton').click();
      }
      
      // Ctrl+R - Reset
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        document.getElementById('resetButton').click();
      }
      
      // F2 - AGN?
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('responseField').value = 'AGN?';
        document.getElementById('sendButton').click();
      }
      
      // F3 - QRS
      if (e.key === 'F3') {
        e.preventDefault();
        document.getElementById('responseField').value = 'QRS';
        document.getElementById('sendButton').click();
      }
    });
  }
}