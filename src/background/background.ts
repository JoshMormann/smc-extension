import { AuthService } from '../shared/supabase';

console.log('🚀 SMC: Background script starting...');

// Keep-alive mechanism to prevent service worker from sleeping
let keepAliveInterval: any;

function startKeepAlive() {
  console.log('⏰ SMC: Starting keep-alive mechanism...');
  keepAliveInterval = setInterval(() => {
    console.log('⏰ SMC: Keep-alive ping...');
  }, 25000); // Ping every 25 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    console.log('⏰ SMC: Stopped keep-alive mechanism');
  }
}

// Simple message router
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  console.log('📨 SMC: Received message:', message.type);
  
  // Wake up the service worker
  startKeepAlive();
  
  if (message.type === 'TEST_PING') {
    console.log('🏓 SMC: TEST Pong!');
    sendResponse({ success: true, data: { message: 'test pong' } });
    return true;
  }
  
  if (message.type === 'GET_AUTH_STATUS') {
    handleGetAuthStatus(sendResponse);
    return true;
  }
  
  if (message.type === 'TRANSFER_SESSION') {
    handleSessionTransfer(sendResponse);
    return true;
  }
  
  if (message.type === 'GET_USER_SREF_CODES') {
    handleGetUserSREFCodes(message.data.userId, sendResponse);
    return true;
  }
  
  if (message.type === 'PING') {
    console.log('🏓 SMC: Pong!');
    sendResponse({ success: true, data: { message: 'pong' } });
    return true;
  }
  
  console.log('❓ SMC: Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

async function handleGetAuthStatus(sendResponse: (response: any) => void) {
  try {
    console.log('🔐 BACKGROUND: Getting auth status...');
    const authState = await AuthService.getAuthState();
    console.log('🔐 BACKGROUND: Auth state:', authState);
    sendResponse({ success: true, data: authState });
  } catch (error: any) {
    console.error('❌ BACKGROUND: Error getting auth status:', error);
    sendResponse({ success: false, error: 'Failed to get auth status: ' + error.message });
  }
}

async function handleSessionTransfer(sendResponse: (response: any) => void) {
  try {
    console.log('🔄 BACKGROUND: Starting session transfer...');
    const result = await AuthService.transferSessionFromWebApp();
    console.log('🔄 BACKGROUND: Session transfer result:', result);
    sendResponse(result);
  } catch (error: any) {
    console.error('❌ BACKGROUND: Error during session transfer:', error);
    sendResponse({ success: false, error: 'Session transfer failed: ' + error.message });
  }
}

async function handleGetUserSREFCodes(userId: string, sendResponse: (response: any) => void) {
  try {
    console.log('🔐 BACKGROUND: Getting user SREF codes...');
    const codes = await AuthService.getUserSavedSREFs(userId);
    console.log('🔐 BACKGROUND: Found', codes.length, 'SREF codes');
    sendResponse({ success: true, data: codes });
  } catch (error: any) {
    console.error('❌ BACKGROUND: Error getting user SREF codes:', error);
    sendResponse({ success: false, error: 'Failed to get SREF codes: ' + error.message });
  }
}

// Add startup listeners for debugging
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 SMC: Extension started');
  startKeepAlive();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 SMC: Extension installed');
  startKeepAlive();
});

// Clean up on shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('🚀 SMC: Extension suspending...');
  stopKeepAlive();
});

console.log('✅ SMC: Background script loaded successfully');
startKeepAlive();

// Export to make this a module
export {};
