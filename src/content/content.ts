console.log('🚀 SMC: TEST Content script starting...');

// Set global flags to indicate the content script is loaded
(window as any).SMCContentScriptLoaded = true;
(window as any).SMCContentScriptVersion = '1.0.4';

/**
 * Main content script for SMC Extension
 * Handles SREF scanning on Midjourney pages
 */
class SMCContentScript {
  private isAuthenticated = false;
  private userSavedCodes: Set<string> = new Set();

  constructor() {
    console.log('🚀 SMC: TEST Content script class constructor called');
    this.init();
  }

  private async init(): Promise<void> {
    try {
      console.log('🚀 SMC: TEST Content script initializing...');
      
      // Set up message listener for background script communication
      chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
        console.log('📨 CONTENT: TEST Received message:', message.type);
        
        if (message.type === 'TEST_PING') {
          this.handleTestPing(sendResponse);
          return true;
        }
        
        console.log('❓ CONTENT: TEST Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown test message type' });
        return true;
      });
      
      console.log('✅ SMC: TEST Content script message listener set up');
      
      // Test connection to service worker
      await this.testServiceWorkerConnection();
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        console.log('📄 SMC: TEST DOM still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => this.initializeScanner());
      } else {
        console.log('📄 SMC: TEST DOM already ready, initializing scanner...');
        this.initializeScanner();
      }
    } catch (error: any) {
      console.error('❌ SMC: TEST Error in content script init:', error);
    }
  }

  private async testServiceWorkerConnection(): Promise<void> {
    try {
      console.log('🔔 CONTENT: TEST Testing service worker connection...');
      const response = await chrome.runtime.sendMessage({ type: 'TEST_PING' });
      console.log('🔔 CONTENT: TEST Service worker response:', response);
      
      if (response.success) {
        console.log('✅ CONTENT: TEST Service worker connection successful');
      } else {
        console.log('❌ CONTENT: TEST Service worker connection failed');
      }
    } catch (error: any) {
      console.error('❌ CONTENT: TEST Failed to connect to service worker:', error);
    }
  }

  private async handleTestPing(sendResponse: (response: any) => void) {
    try {
      console.log('🏓 CONTENT: TEST Handling ping request...');
      sendResponse({ 
        success: true, 
        data: { 
          message: 'Content script is alive!',
          timestamp: new Date().toISOString(),
          version: '1.0.4'
        } 
      });
    } catch (error: any) {
      console.error('❌ CONTENT: TEST Error handling ping:', error);
      sendResponse({ success: false, error: 'Failed to handle ping' });
    }
  }

  private async initializeScanner(): Promise<void> {
    try {
      console.log('🔍 SMC: TEST Initializing SREF scanner...');
      
      // For now, just log that we're ready
      console.log('🔍 SMC: TEST Ready to scan for SREF codes on Midjourney');
      console.log('🔍 SMC: TEST Scanner will be active in production mode');
      
      // TODO: Initialize SREFScanner here when we add authentication back
      // const scanner = new SREFScanner();
      // scanner.initialize();
      
    } catch (error: any) {
      console.error('❌ SMC: TEST Failed to initialize SREF scanner:', error);
    }
  }
}

// Initialize content script with error handling
try {
  console.log('🚀 SMC: TEST Creating content script instance...');
  new SMCContentScript();
  console.log('✅ SMC: TEST Content script loaded successfully');
} catch (error: any) {
  console.error('❌ SMC: TEST Failed to create content script instance:', error);
}
