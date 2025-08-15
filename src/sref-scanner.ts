import { DetectedSREF, ProcessedElement } from './types';

// Mock data for UI testing
const MOCK_SAVED_SREFS = new Set(['1591269566', '1234567890', '9876543210']);

export class SREFScanner {
  private processedElements: Map<HTMLElement, ProcessedElement> = new Map();
  private intersectionObserver!: IntersectionObserver;
  private scrollTimeout: number = 0;
  private elementsToProcess: Set<HTMLElement> = new Set();

  constructor() {
    this.initializeIntersectionObserver();
    this.initializeScrollHandling();
  }

  async initialize(): Promise<void> {
    console.log('🔍 SMC: Initializing SREF scanner...');
    console.log('🔍 SMC: Mock saved SREFs:', Array.from(MOCK_SAVED_SREFS));
    
    // Start initial scan
    this.scanForSREFButtons();
    
    console.log('✅ SMC: Scanner ready');
  }

  private initializeIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const element = entry.target as HTMLElement;
          
          if (entry.isIntersecting) {
            // Element entered viewport - inject spinner immediately
            this.injectSpinner(element);
            // Queue for full processing when scroll stops
            this.elementsToProcess.add(element);
          } else {
            // Element left viewport - update tracking
            const processed = this.processedElements.get(element);
            if (processed) {
              processed.isInViewport = false;
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  }

  private initializeScrollHandling(): void {
    const handleScroll = () => {
      clearTimeout(this.scrollTimeout);
      
      // Debounce processing - only process when scroll stops
      this.scrollTimeout = setTimeout(() => {
        this.processQueuedElements();
      }, 500) as unknown as number;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Listen for new content
    const observer = new MutationObserver(() => {
      this.scanForSREFButtons();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private scanForSREFButtons(): void {
    const srefButtons = document.querySelectorAll('button[title=\"Style reference\"]');
    
    srefButtons.forEach(button => {
      const element = button as HTMLElement;
      
      if (!this.processedElements.has(element)) {
        console.log('🔍 SMC: Found new SREF button');
        this.intersectionObserver.observe(element);
        
        this.processedElements.set(element, {
          element,
          state: 'spinner',
          srefCode: '',
          isInViewport: false
        });
      }
    });
  }

  private injectSpinner(element: HTMLElement): void {
    const processed = this.processedElements.get(element);
    if (!processed || processed.state !== 'spinner') return;
    
    console.log('⏳ SMC: Injecting spinner');
    
    const spinner = document.createElement('span');
    spinner.className = 'smc-spinner';
    spinner.innerHTML = ' ⏳';
    spinner.style.cssText = 'font-size: 12px; opacity: 0.7; margin-left: 4px;';
    
    element.parentNode?.insertBefore(spinner, element.nextSibling);
    processed.isInViewport = true;
  }
  
  private processQueuedElements(): void {
    if (this.elementsToProcess.size === 0) return;
    
    console.log('🔄 SMC: Processing', this.elementsToProcess.size, 'elements');
    
    this.elementsToProcess.forEach(element => {
      this.processElementFull(element);
    });
    
    this.elementsToProcess.clear();
  }
  
  private processElementFull(element: HTMLElement): void {
    const processed = this.processedElements.get(element);
    if (!processed || processed.state !== 'spinner') return;
    
    const srefCode = this.extractSREFCode(element);
    if (!srefCode) return;

    const images = this.extractImages(element);
    const isKnown = MOCK_SAVED_SREFS.has(srefCode);
    
    console.log('🔍 SMC: SREF', srefCode, 'known:', isKnown, 'images:', images.length);
    
    processed.srefCode = srefCode;
    processed.state = isKnown ? 'saved-check' : 'save-button';
    
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
    const match = text?.match(/--sref\s+(\d+)/);
    return match?.[1] || null;
  }

  private extractImages(button: HTMLElement): string[] {
    const container = this.findImageContainer(button);
    if (!container) return [];

    const images = Array.from(container.querySelectorAll('img[src*=\"cdn.midjourney.com\"]'))
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
    
    // Add to saved set
    MOCK_SAVED_SREFS.add(detectedSREF.code);
    
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
    
    // Update processed element
    const processed = this.processedElements.get(detectedSREF.element);
    if (processed) {
      processed.state = 'saved-check';
    }
    
    console.log('✅ SMC: Mock saved successfully');
  }
}