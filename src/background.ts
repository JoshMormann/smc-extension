console.log('🚀 SMC: Background script starting...');

// Simple background script for extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 SMC: Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 SMC: Extension started');
});

console.log('✅ SMC: Background script loaded successfully');