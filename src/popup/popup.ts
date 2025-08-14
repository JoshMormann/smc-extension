/**
 * Popup script for SMC Extension
 * Shows authentication status and basic info
 */
import { AuthState } from '../types';

console.log('🚀 SMC: Popup initializing...');

class SMCPopup {
  private authState: AuthState = { isAuthenticated: false };

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log('🚀 SMC: Popup initializing...');
    this.setupEventListeners();
    await this.checkAuthStatus();
  }

  private setupEventListeners(): void {
    // Test connection button
    document.getElementById('testConnection')?.addEventListener('click', () => {
      this.handleTestConnection();
    });

    // Transfer session button
    document.getElementById('transferSession')?.addEventListener('click', () => {
      this.handleSessionTransfer();
    });

    // Inject content script debug button
    document.getElementById('injectContentScript')?.addEventListener('click', () => {
      this.handleInjectContentScript();
    });
  }

  private async handleTestConnection(): Promise<void> {
    try {
      console.log('🔧 POPUP: Testing background connection...');
      const response = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
      console.log('🔧 POPUP: Test connection response:', response);
      
      if (response.success) {
        alert('✅ Background script is working!');
      } else {
        alert('❌ Background script test failed: ' + response.error);
      }
    } catch (error: any) {
      console.error('🔧 POPUP: Test connection error:', error);
      alert('❌ Test connection failed: ' + error.message);
    }
  }

  private async handleSessionTransfer(): Promise<void> {
    try {
      console.log('🔄 POPUP: Starting session transfer...');
      const response = await chrome.runtime.sendMessage({ type: 'TRANSFER_SESSION' });
      console.log('🔄 POPUP: Session transfer response:', response);
      
      if (response.success) {
        alert('✅ Session transferred successfully!');
        await this.checkAuthStatus(); // Refresh auth status
      } else {
        alert('❌ Session transfer failed: ' + response.error);
      }
    } catch (error: any) {
      console.error('🔄 POPUP: Session transfer error:', error);
      alert('❌ Session transfer failed: ' + error.message);
    }
  }

  private async handleInjectContentScript(): Promise<void> {
    try {
      console.log('🔧 POPUP: Manually injecting content script...');
      
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        alert('❌ No active tab found');
        return;
      }
      
      console.log('🔧 POPUP: Injecting into tab:', tab.url);
      
      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      alert('✅ Content script injected! Check the page console for logs.');
    } catch (error: any) {
      console.error('🔧 POPUP: Content script injection error:', error);
      alert('❌ Failed to inject content script: ' + error.message);
    }
  }

  private async checkAuthStatus(): Promise<void> {
    try {
      console.log('🔐 POPUP: Requesting auth status from background script...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      console.log('🔐 POPUP: Auth status response:', response);
      
      if (response.success) {
        this.authState = response.data;
        console.log('🔐 POPUP: Updating UI with auth state:', this.authState);
        this.updateUI();
      } else {
        console.error('❌ POPUP: Failed to get auth status:', response.error);
        this.authState = { isAuthenticated: false };
        this.updateUI();
      }
    } catch (error: any) {
      console.error('❌ SMC: Failed to get auth status:', error);
      this.authState = { isAuthenticated: false };
      this.updateUI();
    }
  }

  private updateUI(): void {
    const statusElement = document.getElementById('status');
    const statusTextElement = document.getElementById('statusText');
    const authenticatedSection = document.getElementById('authenticated');
    const unauthenticatedSection = document.getElementById('unauthenticated');
    const userEmailElement = document.getElementById('userEmail');

    if (!statusElement || !statusTextElement || !authenticatedSection || !unauthenticatedSection || !userEmailElement) {
      console.error('❌ POPUP: Could not find UI elements');
      return;
    }

    if (this.authState.isAuthenticated) {
      console.log('🔐 POPUP: User is authenticated, updating UI...');
      
      // Update status
      statusElement.className = 'status connected';
      statusTextElement.textContent = 'Connected to SMC Manager';
      
      // Update user email
      userEmailElement.textContent = this.authState.user?.email || 'Unknown user';
      
      // Show authenticated section
      authenticatedSection.classList.remove('hidden');
      unauthenticatedSection.classList.add('hidden');
    } else {
      console.log('🔐 POPUP: User is not authenticated, updating UI...');
      
      // Update status
      statusElement.className = 'status disconnected';
      statusTextElement.textContent = 'Not connected to SMC Manager';
      
      // Show unauthenticated section
      unauthenticatedSection.classList.remove('hidden');
      authenticatedSection.classList.add('hidden');
    }
  }
}

// Initialize popup
new SMCPopup();
