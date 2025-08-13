// Background script with Supabase - enhanced logging version
import { ExtensionMessage, SaveSREFRequest } from '../types';

console.log('🚀 SIMPLE: Background script loading - timestamp:', new Date().toISOString());

// Import pure storage-based auth (no Supabase)
import { StorageAuthService } from '../shared/storage-auth';

console.log('✅ SIMPLE: Storage auth service imported successfully');

console.log('🚀 SIMPLE: Background script loaded - timestamp:', new Date().toISOString());

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 SIMPLE: Extension installed:', details);
  
  if (details.reason === 'install') {
    // Set up initial extension state
    chrome.storage.local.set({
      isFirstTime: true,
      settings: {
        autoDetect: true,
        notifications: true,
      },
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  sender,
  sendResponse
) => {
  console.log('📨 SIMPLE: Background received message:', message.type, message.data);

  switch (message.type) {
    case 'GET_AUTH_STATUS':
      console.log('🔐 SIMPLE: Getting real auth status...');
      handleGetAuthStatus(sendResponse);
      return true; // Keep message channel open for async response

    case 'SAVE_SREF':
      console.log('💾 SIMPLE: Mock SREF save');
      sendResponse({ success: false, error: 'Auth not implemented yet' });
      return false;

    case 'SREF_DETECTED':
      console.log('🔍 SIMPLE: SREF detected');
      return false;

    default:
      console.warn('❓ SIMPLE: Unknown message type:', message.type);
      return false;
  }
});

/**
 * Handle authentication status requests with detailed logging
 */
async function handleGetAuthStatus(sendResponse: (response: any) => void) {
  try {
    console.log('🔐 SIMPLE: Calling StorageAuthService.getAuthState()...');
    const authState = await StorageAuthService.getAuthState();
    console.log('🔐 SIMPLE: Auth state received:', authState);
    sendResponse({ success: true, data: authState });
  } catch (error) {
    console.error('❌ SIMPLE: Failed to get auth status:', error);
    sendResponse({ success: false, error: 'Failed to get authentication status' });
  }
}

console.log('✅ SIMPLE: Background script setup complete');