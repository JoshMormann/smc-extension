console.log('🚀 SMC: TEST Popup script starting...');

// Add error handling for script loading
window.addEventListener('error', (event) => {
  console.error('❌ POPUP: Script error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ POPUP: Unhandled promise rejection:', event.reason);
});

class SMCPopup {
  private statusElement!: HTMLElement;
  private statusTextElement!: HTMLElement;
  private unauthenticatedDiv!: HTMLElement;
  private authenticatedDiv!: HTMLElement;
  private userEmailElement!: HTMLElement;
  private transferSessionBtn!: HTMLButtonElement;
  private refreshBtn!: HTMLButtonElement;
  private transferErrorElement!: HTMLElement;
  private testPingBtn!: HTMLButtonElement;

  constructor() {
    console.log('🚀 SMC: TEST Creating popup instance...');
    try {
      this.initializeElements();
      this.setupEventListeners();
      this.testConnection();
      console.log('✅ SMC: TEST Popup instance created successfully');
    } catch (error) {
      console.error('❌ SMC: TEST Error creating popup instance:', error);
    }
  }

  private initializeElements() {
    console.log('🔧 POPUP: Initializing elements...');
    try {
      this.statusElement = document.getElementById('status') as HTMLElement;
      this.statusTextElement = document.getElementById('statusText') as HTMLElement;
      this.unauthenticatedDiv = document.getElementById('unauthenticated') as HTMLElement;
      this.authenticatedDiv = document.getElementById('authenticated') as HTMLElement;
      this.userEmailElement = document.getElementById('userEmail') as HTMLElement;
      this.transferSessionBtn = document.getElementById('transferSession') as HTMLButtonElement;
      this.refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
      this.transferErrorElement = document.getElementById('transferError') as HTMLElement;
      this.testPingBtn = document.getElementById('testPing') as HTMLButtonElement;
      
      console.log('✅ POPUP: Elements initialized successfully');
    } catch (error) {
      console.error('❌ POPUP: Error initializing elements:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    console.log('🔧 POPUP: Setting up event listeners...');
    try {
      this.transferSessionBtn.addEventListener('click', () => this.handleSessionTransfer());
      this.refreshBtn.addEventListener('click', () => this.testConnection());
      this.testPingBtn.addEventListener('click', () => this.handleTestPing());
      console.log('✅ POPUP: Event listeners set up successfully');
    } catch (error) {
      console.error('❌ POPUP: Error setting up event listeners:', error);
      throw error;
    }
  }

  private async testConnection() {
    try {
      console.log('🔐 POPUP: Testing connection...');
      this.setStatus('Testing connection...', 'disconnected');
      
      const response = await chrome.runtime.sendMessage({ type: 'TEST_PING' });
      
      if (response.success) {
        console.log('✅ POPUP: Connection test successful:', response.data);
        this.setStatus('Connected to service worker', 'connected');
        this.showUnauthenticatedState(); // Still show unauthenticated since we're in test mode
      } else {
        console.error('❌ POPUP: Connection test failed:', response.error);
        this.setStatus('Connection failed', 'disconnected');
        this.showUnauthenticatedState();
      }
    } catch (error) {
      console.error('❌ POPUP: Error testing connection:', error);
      this.setStatus('Connection error', 'disconnected');
      this.showUnauthenticatedState();
    }
  }

  private async handleTestPing() {
    try {
      console.log('🏓 POPUP: Sending test ping...');
      this.testPingBtn.disabled = true;
      this.testPingBtn.textContent = 'Pinging...';
      
      const response = await chrome.runtime.sendMessage({ type: 'TEST_PING' });
      
      if (response.success) {
        console.log('✅ POPUP: Ping successful:', response.data);
        alert('✅ Ping successful! Service worker is responding.');
      } else {
        console.error('❌ POPUP: Ping failed:', response.error);
        alert('❌ Ping failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ POPUP: Error during ping:', error);
      alert('❌ Ping error: ' + error);
    } finally {
      this.testPingBtn.disabled = false;
      this.testPingBtn.textContent = 'Test Ping';
    }
  }

  private async handleSessionTransfer() {
    try {
      console.log('🔄 POPUP: Attempting session transfer...');
      this.transferSessionBtn.disabled = true;
      this.transferSessionBtn.textContent = 'Transferring Session...';
      this.hideTransferError();
      
      // For now, just show a test message since we're in test mode
      alert('🔄 Session transfer would happen here in production mode');
      
    } catch (error) {
      console.error('❌ POPUP: Error during session transfer:', error);
      this.showTransferError('Session transfer failed');
    } finally {
      this.transferSessionBtn.disabled = false;
      this.transferSessionBtn.textContent = 'Transfer Session from SMC Manager';
    }
  }

  private showAuthenticatedState(email: string) {
    this.unauthenticatedDiv.classList.add('hidden');
    this.authenticatedDiv.classList.remove('hidden');
    this.userEmailElement.textContent = email;
  }

  private showUnauthenticatedState() {
    this.authenticatedDiv.classList.add('hidden');
    this.unauthenticatedDiv.classList.remove('hidden');
  }

  private setStatus(text: string, className: string) {
    this.statusTextElement.textContent = text;
    this.statusElement.className = `status ${className}`;
  }

  private showTransferError(message: string) {
    this.transferErrorElement.textContent = message;
    this.transferErrorElement.classList.remove('hidden');
  }

  private hideTransferError() {
    this.transferErrorElement.classList.add('hidden');
  }
}

// Initialize popup when DOM is ready
console.log('🚀 SMC: TEST DOM ready, initializing popup...');
try {
  new SMCPopup();
  console.log('✅ SMC: TEST Popup initialized successfully');
} catch (error) {
  console.error('❌ SMC: TEST Failed to initialize popup:', error);
}

console.log('✅ SMC: TEST Popup script loaded');
