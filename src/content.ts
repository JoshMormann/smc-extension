import { SREFScanner } from './sref-scanner';

console.log('🚀 SMC: Content script starting...');

class SMCContentScript {
  private scanner?: SREFScanner;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      console.log('🚀 SMC: Content script initializing...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        console.log('📄 SMC: DOM loading, waiting...');
        document.addEventListener('DOMContentLoaded', () => this.initializeScanner());
      } else {
        console.log('📄 SMC: DOM ready, initializing scanner...');
        this.initializeScanner();
      }
    } catch (error: any) {
      console.error('❌ SMC: Error in content script init:', error);
    }
  }

  private async initializeScanner(): Promise<void> {
    try {
      console.log('🔍 SMC: Initializing SREF scanner...');
      
      this.scanner = new SREFScanner();
      await this.scanner.initialize();
      
      console.log('✅ SMC: SREF scanner initialized successfully');
      
    } catch (error: any) {
      console.error('❌ SMC: Failed to initialize SREF scanner:', error);
    }
  }
}

// Initialize content script
try {
  console.log('🚀 SMC: Creating content script instance...');
  new SMCContentScript();
  console.log('✅ SMC: Content script loaded successfully');
} catch (error: any) {
  console.error('❌ SMC: Failed to create content script instance:', error);
}