// Simple test background script
console.log('🔥 TEST: Background script is running!');
console.log('🔥 TEST: Chrome APIs available:', typeof chrome);
console.log('🔥 TEST: Current time:', new Date().toISOString());

// Test basic Chrome API
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🔥 TEST: Extension installed/reloaded:', details);
});

// Test message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔥 TEST: Message received:', message);
  sendResponse({ test: 'working' });
  return false;
});