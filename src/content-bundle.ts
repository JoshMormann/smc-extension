// Bundled content script for Chrome extension (no modules)

// Type definitions (inline)
interface DetectedSREF {
  code: string;
  element: HTMLElement;
  images: string[];
  isKnown: boolean;
  timestamp: number;
}

// Mock data for UI testing
const MOCK_SAVED_SREFS = new Set(['1591269566', '1234567890', '9876543210']);

class SREFScanner {
  private scrollTimeout: number = 0;

  constructor() {
    this.initializeScrollHandling();
  }

  async initialize(): Promise<void> {
    console.log('🔍 SMC: SREF scanner initialized');
    
    // Start initial scan
    this.scanForSREFButtons();
  }


  private initializeScrollHandling(): void {
    const handleScroll = () => {
      clearTimeout(this.scrollTimeout);
      
      // Debounce processing - only process when scroll stops
      this.scrollTimeout = setTimeout(() => {
        console.log('📜 SMC: Scroll stopped, processing visible spinners...');
        this.processVisibleSpinners();
      }, 500) as unknown as number;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Process elements after delay for initial load
    setTimeout(() => {
      console.log('⏰ SMC: Initial processing...');
      this.processVisibleSpinners();
    }, 2000);
    
    // Listen for new content and scan for new SREF buttons
    const observer = new MutationObserver(() => {
      this.scanForSREFButtons();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private scanForSREFButtons(): void {
    // Find all SREF buttons first
    const allSrefButtons = document.querySelectorAll('button[title="Style reference"]');
    console.log('🔎 SMC: Total SREF buttons found:', allSrefButtons.length);
    
    // Count how many are already processed
    const processedButtons = document.querySelectorAll('button[title="Style reference"][data-smc-processed]');
    console.log('🔎 SMC: Already processed:', processedButtons.length);
    
    // Find SREF buttons that haven't been processed yet
    const unprocessedButtons = document.querySelectorAll('button[title="Style reference"]:not([data-smc-processed])');
    console.log('🔎 SMC: Unprocessed buttons:', unprocessedButtons.length);
    
    unprocessedButtons.forEach(button => {
      const element = button as HTMLElement;
      
      console.log('🔍 SMC: Found new SREF button, setting attributes...');
      
      // Mark as processed and add spinner
      element.setAttribute('data-smc-processed', 'true');
      element.setAttribute('data-smc-state', 'spinner');
      
      console.log('🔍 SMC: Attributes set, processed:', element.getAttribute('data-smc-processed'));
      
      this.injectSpinner(element);
    });
  }

  private injectSpinner(element: HTMLElement): void {
    // Only inject if state is spinner and no existing SMC indicator
    const state = element.getAttribute('data-smc-state');
    const existingIndicator = element.parentNode?.querySelector('.smc-spinner, .smc-button');
    
    if (state !== 'spinner' || existingIndicator) return;
    
    const spinner = document.createElement('span');
    spinner.className = 'smc-spinner';
    spinner.innerHTML = ' ⏳';
    spinner.style.cssText = 'font-size: 12px; opacity: 0.7; margin-left: 4px;';
    
    element.parentNode?.insertBefore(spinner, element.nextSibling);
  }
  
  private processVisibleSpinners(): void {
    // Find all SREF buttons that are in spinner state and currently visible
    const spinnerElements = document.querySelectorAll('button[title="Style reference"][data-smc-state="spinner"]');
    const visibleSpinners: HTMLElement[] = [];
    
    spinnerElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (this.isElementInViewport(htmlElement)) {
        visibleSpinners.push(htmlElement);
      }
    });
    
    if (visibleSpinners.length === 0) {
      console.log('🔄 SMC: No visible spinner elements to process');
      return;
    }
    
    console.log('🔄 SMC: Processing', visibleSpinners.length, 'visible spinner elements');
    
    visibleSpinners.forEach(element => {
      this.processElement(element);
    });
  }

  private isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= -50 && 
      rect.left >= -50 &&
      rect.bottom <= windowHeight + 50 &&
      rect.right <= windowWidth + 50
    );
  }
  
  private processElement(element: HTMLElement): void {
    // Only process if still in spinner state
    const state = element.getAttribute('data-smc-state');
    if (state !== 'spinner') return;
    
    const srefCode = this.extractSREFCode(element);
    if (!srefCode) return;

    const images = this.extractImages(element);
    const isKnown = MOCK_SAVED_SREFS.has(srefCode);
    
    console.log('🔍 SMC: SREF', srefCode, 'known:', isKnown, 'images:', images.length);
    
    // Update DOM attributes
    element.setAttribute('data-smc-code', srefCode);
    element.setAttribute('data-smc-state', isKnown ? 'saved-check' : 'save-button');
    
    const detectedSREF: DetectedSREF = {
      code: srefCode,
      element,
      images,
      isKnown,
      timestamp: Date.now(),
    };

    this.replaceSpinnerWithButton(detectedSREF);
  }

  private extractSREFCode(button: HTMLElement): string | null {
    const text = button.textContent;
    
    // Match both "--sref 1234" and "sref 1234" formats
    const match = text?.match(/(?:--)?sref\s+(\d+)/);
    
    return match?.[1] || null;
  }

  private extractImages(button: HTMLElement): string[] {
    const container = this.findImageContainer(button);
    if (!container) return [];

    const images = Array.from(container.querySelectorAll('img[src*="cdn.midjourney.com"]'))
      .map(img => (img as HTMLImageElement).src)
      .filter(src => src.includes('cdn.midjourney.com'));

    return images;
  }

  private findImageContainer(button: HTMLElement): HTMLElement | null {
    let current = button;
    while (current && current !== document.body) {
      if (current.style.gridTemplateColumns === 'minmax(0,8fr) minmax(0,3fr)') {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
    return null;
  }

  private replaceSpinnerWithButton(detectedSREF: DetectedSREF): void {
    // Remove spinner
    const spinner = detectedSREF.element.parentNode?.querySelector('.smc-spinner');
    if (spinner) spinner.remove();
    
    const button = document.createElement('button');
    button.className = 'smc-button';
    
    if (detectedSREF.isKnown) {
      button.innerHTML = ' ✅';
      button.title = 'Already saved to SMC Manager';
      button.style.cssText = 'background: #28a745; color: white; border: none; border-radius: 3px; padding: 2px 6px; margin-left: 4px; font-size: 12px; cursor: default;';
    } else {
      button.innerHTML = ' 💾';
      button.title = 'Save to SMC Manager';
      button.style.cssText = 'background: #007bff; color: white; border: none; border-radius: 3px; padding: 2px 6px; margin-left: 4px; font-size: 12px; cursor: pointer;';
      
      button.addEventListener('click', () => {
        this.handleSaveClick(detectedSREF);
      });
    }
    
    detectedSREF.element.parentNode?.insertBefore(button, detectedSREF.element.nextSibling);
  }

  private handleSaveClick(detectedSREF: DetectedSREF): void {
    console.log('💾 SMC: Save clicked for SREF', detectedSREF.code);
    
    const name = prompt(`Name this SREF code (${detectedSREF.code}):`);
    if (!name) return;
    
    this.mockSave(detectedSREF, name);
  }

  private async mockSave(detectedSREF: DetectedSREF, name: string): Promise<void> {
    console.log('💾 SMC: Mock saving...', detectedSREF.code, 'as', name);
    
    // Find the save button and update it
    const saveButton = detectedSREF.element.parentNode?.querySelector('.smc-button') as HTMLButtonElement;
    if (saveButton) {
      saveButton.innerHTML = ' ⏳';
      saveButton.disabled = true;
    }
    
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add to saved set and update DOM attribute
    MOCK_SAVED_SREFS.add(detectedSREF.code);
    detectedSREF.element.setAttribute('data-smc-state', 'saved-check');
    
    // Update button to saved state
    if (saveButton) {
      saveButton.innerHTML = ' ✅';
      saveButton.title = 'Already saved to SMC Manager';
      saveButton.style.cssText = 'background: #28a745; color: white; border: none; border-radius: 3px; padding: 2px 6px; margin-left: 4px; font-size: 12px; cursor: default;';
      saveButton.disabled = false;
      
      // Remove click handler
      const newButton = saveButton.cloneNode(true);
      saveButton.replaceWith(newButton);
    }
    
    console.log('✅ SMC: Mock saved successfully');
  }
}

class SMCContentScript {
  private scanner?: SREFScanner;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeScanner());
      } else {
        this.initializeScanner();
      }
    } catch (error: any) {
      console.error('❌ SMC: Content script init failed:', error);
    }
  }

  private async initializeScanner(): Promise<void> {
    try {
      this.scanner = new SREFScanner();
      await this.scanner.initialize();
      
    } catch (error: any) {
      console.error('❌ SMC: Scanner initialization failed:', error);
    }
  }
}

// Initialize content script
try {
  new SMCContentScript();
  console.log('✅ SMC: Extension loaded');
} catch (error: any) {
  console.error('❌ SMC: Extension failed to load:', error);
}