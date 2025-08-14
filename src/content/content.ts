console.log('🚀 SMC: Content script starting...');

// Set global flags to indicate the content script is loaded
(window as any).SMCContentScriptLoaded = true;
(window as any).SMCContentScriptVersion = '1.0.1';

/**
 * Main content script for SMC Extension
 * Initializes SREF scanning on Midjourney pages
 */
class SMCContentScript {
  private sessionData: any = null;

  constructor() {
    console.log('🚀 SMC: Content script class constructor called');
    this.init();
  }

  private async init(): Promise<void> {
    try {
      console.log('🚀 SMC: Content script initializing...');
      
      // Set up message listener for background script communication
      chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
        console.log('📨 CONTENT: Received message:', message.type);
        
        if (message.type === 'GET_AUTH_STATUS_FROM_CONTENT') {
          this.handleGetAuthStatus(sendResponse);
          return true;
        }
        
        if (message.type === 'SET_SESSION_FROM_CONTENT') {
          this.handleSetSession(message.data, sendResponse);
          return true;
        }
        
        console.log('❓ CONTENT: Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
        return true;
      });
      
      console.log('✅ SMC: Content script message listener set up');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        console.log('📄 SMC: DOM still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => this.initializeScanner());
      } else {
        console.log('📄 SMC: DOM already ready, initializing scanner...');
        this.initializeScanner();
      }
    } catch (error: any) {
      console.error('❌ SMC: Error in content script init:', error);
    }
  }

  private async handleGetAuthStatus(sendResponse: (response: any) => void) {
    try {
      console.log('🔐 CONTENT: Getting auth status...');
      
      if (this.sessionData) {
        console.log('🔐 CONTENT: Using transferred session data');
        // Return authenticated state based on transferred session
        const authState = { 
          isAuthenticated: true, 
          user: { 
            id: this.sessionData.user?.id || 'unknown',
            email: this.sessionData.user?.email || 'unknown'
          },
          session: this.sessionData
        };
        console.log('🔐 CONTENT: Auth state result:', authState);
        sendResponse({ success: true, data: authState });
      } else {
        console.log('🔐 CONTENT: No session data, returning unauthenticated');
        // For now, just return unauthenticated
        const authState = { isAuthenticated: false, user: undefined };
        console.log('🔐 CONTENT: Auth state result:', authState);
        sendResponse({ success: true, data: authState });
      }
    } catch (error: any) {
      console.error('❌ CONTENT: Error getting auth status:', error);
      sendResponse({ success: false, error: 'Failed to get auth status: ' + error.message });
    }
  }

  private async handleSetSession(sessionData: any, sendResponse: (response: any) => void) {
    try {
      console.log('🔄 CONTENT: Setting session from background script...');
      console.log('🔄 CONTENT: Session data received:', sessionData);
      
      // Store the session data
      this.sessionData = sessionData;
      
      console.log('🔄 CONTENT: Session stored successfully');
      sendResponse({ success: true, data: { message: 'Session stored successfully' } });
    } catch (error: any) {
      console.error('🔄 CONTENT: Error setting session:', error);
      sendResponse({ success: false, error: 'Failed to set session' });
    }
  }

  private async initializeScanner(): Promise<void> {
    try {
      console.log('🔍 SMC: Initializing SREF scanner...');
      console.log('✅ SMC: SREF scanner would be initialized here');
      console.log('✅ SMC: Ready to scan for SREF codes on Midjourney');
    } catch (error: any) {
      console.error('❌ SMC: Failed to initialize SREF scanner:', error);
    }
  }
}

// Initialize content script with error handling
try {
  console.log('🚀 SMC: Creating content script instance...');
  new SMCContentScript();
  console.log('✅ SMC: Content script loaded successfully');
} catch (error: any) {
  console.error('❌ SMC: Failed to create content script instance:', error);
}
