import { AuthService } from '../shared/supabase';

console.log('🚀 SMC: Background script starting...');

// Add a simple test to verify the script is running
setTimeout(() => {
  console.log('⏰ SMC: Background script is alive and running!');
}, 1000);

chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  console.log('📨 SMC: Received message:', message.type);
  
  if (message.type === 'TEST_CONNECTION') {
    console.log('🔧 SMC: Test connection received');
    sendResponse({ success: true, data: { message: 'Background script is working!' } });
    return true;
  }
  
  if (message.type === 'GET_AUTH_STATUS') {
    console.log('🔐 SMC: Getting auth status...');
    handleGetAuthStatus(sendResponse);
    return true;
  }
  
  if (message.type === 'TRANSFER_SESSION') {
    console.log('🔄 SMC: Transfer session received');
    handleSessionTransfer(sendResponse);
    return true;
  }
  
  console.log('❓ SMC: Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

async function handleGetAuthStatus(sendResponse: (response: any) => void) {
  try {
    console.log('🔐 BACKGROUND: Getting auth status...');
    
    // First check if we have a stored session
    const storedSession = await chrome.storage.local.get(['smc_session']);
    
    if (storedSession.smc_session) {
      console.log('🔐 BACKGROUND: Found stored session, checking with Supabase...');
      const { data, error } = await AuthService.setSession(storedSession.smc_session);
      
      if (!error) {
        const authState = await AuthService.getAuthState();
        console.log('🔐 BACKGROUND: Auth state from stored session:', authState);
        sendResponse({ success: true, data: authState });
        return;
      }
    }
    
    // Fall back to checking Supabase directly
    console.log('🔐 BACKGROUND: No stored session, checking Supabase directly...');
    const authState = await AuthService.getAuthState();
    console.log('🔐 BACKGROUND: Auth state from Supabase:', authState);
    sendResponse({ success: true, data: authState });
  } catch (error: any) {
    console.error('❌ BACKGROUND: Error getting auth status:', error);
    sendResponse({ success: false, error: 'Failed to get auth status: ' + error.message });
  }
}

async function handleSessionTransfer(sendResponse: (response: any) => void) {
  try {
    console.log('🔄 BACKGROUND: Starting session transfer...');
    const sessionData = await getSessionFromWebApp();
    
    if (sessionData) {
      console.log('🔄 BACKGROUND: Found session data, setting in Supabase...');
      
      // Set the session in Supabase
      const { data, error } = await AuthService.setSession(sessionData);
      
      if (error) {
        console.error('🔄 BACKGROUND: Failed to set session in Supabase:', error);
        sendResponse({ success: false, error: 'Failed to set session: ' + error.message });
        return;
      }
      
      // Store session in local storage for persistence
      await chrome.storage.local.set({ smc_session: sessionData });
      
      console.log('🔄 BACKGROUND: Session transferred and stored successfully');
      sendResponse({ success: true, data: { message: 'Session transferred successfully' } });
    } else {
      console.log('❌ BACKGROUND: No session data found in SMC Manager');
      sendResponse({ success: false, error: 'No session found in SMC Manager. Please log in to SMC Manager first.' });
    }
  } catch (error: any) {
    console.error('❌ BACKGROUND: Error during session transfer:', error);
    sendResponse({ success: false, error: 'Session transfer failed: ' + error.message });
  }
}

async function getSessionFromWebApp(): Promise<any> {
  try {
    console.log('🔄 BACKGROUND: Attempting to get session from SMC Manager web app...');
    
    // First check if SMC Manager is accessible
    const response = await fetch('http://localhost:5173', { 
      method: 'GET', 
      credentials: 'include' 
    });
    
    if (!response.ok) {
      console.log('❌ BACKGROUND: SMC Manager not accessible at localhost:5173');
      return null;
    }
    
    // Find SMC Manager tab
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    
    if (tabs.length === 0) {
      console.log('❌ BACKGROUND: No SMC Manager tab found. Please open SMC Manager in a tab.');
      return null;
    }
    
    const targetTab = tabs[0];
    if (!targetTab || !targetTab.id) {
      console.log('❌ BACKGROUND: Invalid SMC Manager tab');
      return null;
    }
    
    console.log('🔄 BACKGROUND: Found SMC Manager tab, attempting to get session...');
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: () => {
        // This function runs in the context of the SMC Manager web app
        try {
          console.log('🔄 WEBAPP: Looking for Supabase session in localStorage...');
          
          // Try different possible storage keys
          const supabaseSession = localStorage.getItem('sb-qqbbssxxddcsuboiceey-auth-token');
          if (supabaseSession) {
            console.log('🔄 WEBAPP: Found session in sb-qqbbssxxddcsuboiceey-auth-token');
            return JSON.parse(supabaseSession);
          }
          
          // Try alternative storage keys
          const alternativeKeys = [
            'supabase.auth.token',
            'supabase-session',
            'sb-auth-token'
          ];
          
          for (const key of alternativeKeys) {
            const session = localStorage.getItem(key);
            if (session) {
              console.log(`🔄 WEBAPP: Found session in ${key}`);
              return JSON.parse(session);
            }
          }
          
          // Log all localStorage keys for debugging
          console.log('🔄 WEBAPP: All localStorage keys:', Object.keys(localStorage));
          
          return null;
        } catch (error) {
          console.error('🔄 WEBAPP: Error getting session:', error);
          return null;
        }
      }
    });
    
    if (results && results[0] && results[0].result) {
      console.log('🔄 BACKGROUND: Successfully retrieved session data');
      return results[0].result;
    }
    
    console.log('❌ BACKGROUND: No session data found in SMC Manager');
    return null;
  } catch (error) {
    console.error('❌ BACKGROUND: Error getting session from web app:', error);
    return null;
  }
}

// Add startup listeners for debugging
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 SMC: Extension started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 SMC: Extension installed');
});

console.log('✅ SMC: Background script loaded successfully');

// Export to make this a module
export {};
