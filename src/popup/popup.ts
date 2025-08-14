console.log('🚀 SMC: TEST Popup script starting...');

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
    this.initializeElements();
    this.setupEventListeners();
    this.testConnection();
  }

  private initializeElements() {
    this.statusElement = document.getElementById('status') as HTMLElement;
    this.statusTextElement = document.getElementById('statusText') as HTMLElement;
    this.unauthenticatedDiv = document.getElementById('unauthenticated') as HTMLElement;
    this.authenticatedDiv = document.getElementById('authenticated') as HTMLElement;
    this.userEmailElement = document.getElementById('userEmail') as HTMLElement;
    this.transferSessionBtn = document.getElementById('transferSession') as HTMLButtonElement;
    this.refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    this.transferErrorElement = document.getElementById('transferError') as HTMLElement;
    this.testPingBtn = document.getElementById('testPing') as HTMLButtonElement;
  }

  private setupEventListeners() {
    this.transferSessionBtn.addEventListener('click', () => this.handleSessionTransfer());
    this.refreshBtn.addEventListener('click', () => this.testConnection());
    this.testPingBtn.addEventListener('click', () => this.handleTestPing());
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
    this.statusElement.className = 'status connected';
    this.statusTextElement.textContent = 'Connected to SMC Manager';
    this.userEmailElement.textContent = email;
    this.unauthenticatedDiv.classList.add('hidden');
    this.authenticatedDiv.classList.remove('hidden');
  }

  private showUnauthenticatedState() {
    this.statusElement.className = 'status disconnected';
    this.statusTextElement.textContent = 'Not connected';
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
    this.transferErrorElement.textContent = '';
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 SMC: TEST DOM ready, initializing popup...');
  new SMCPopup();
});

console.log('✅ SMC: TEST Popup script loaded');
