import { DetectedSREF, ScannerState, SREFIndicator } from '../types';
import { AuthService } from '../shared/supabase';

/**
 * SREF Scanner for Midjourney web app
 * Handles viewport-based detection with scroll optimization
 */
export class SREFScanner {
  private state: ScannerState;
  private intersectionObserver!: IntersectionObserver;
  private indicators: Map<string, SREFIndicator> = new Map();

  constructor() {
    this.state = {
      processedElements: new Set(),
      scrollDebounceTimer: 0,
      userSavedCodes: new Set(),
      isAuthenticated: false,
      isProcessing: false,
    };

    this.initializeIntersectionObserver();
    this.initializeScrollHandling();
  }

  /**
   * Initialize the scanner
   */
  async initialize(): Promise<void> {
    console.log('🔍 SMC: Initializing SREF scanner...');
    
    // Check authentication status
    const authState = await AuthService.getAuthState();
    this.state.isAuthenticated = authState.isAuthenticated;
    
    if (authState.isAuthenticated && authState.user) {
      // Load user's saved SREF codes
      const savedCodes = await AuthService.getUserSavedSREFs(authState.user.id);
      this.state.userSavedCodes = new Set(savedCodes);
      console.log('🔍 SMC: Loaded', savedCodes.length, 'saved SREF codes');
    }

    // Start scanning visible content
    this.scanVisibleContent();
  }

  /**
   * Initialize intersection observer for viewport detection
   */
  private initializeIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.processElement(entry.target as HTMLElement);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // Start processing 50px before element enters viewport
        threshold: 0.1,
      }
    );
  }

  /**
   * Initialize scroll handling with debouncing
   */
  private initializeScrollHandling(): void {
    let scrollTimeout: number;
    
    const handleScroll = () => {
      // Clear previous timeout
      clearTimeout(scrollTimeout);
      
      // Show loading indicators for new content
      this.showLoadingIndicators();
      
      // Debounce processing
      scrollTimeout = setTimeout(() => {
        this.scanVisibleContent();
      }, 500) as unknown as number;
    };

    // Listen for scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen for dynamic content changes
    const observer = new MutationObserver(() => {
      handleScroll();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Scan visible content for SREF codes
   */
  private scanVisibleContent(): void {
    if (this.state.isProcessing) return;
    
    this.state.isProcessing = true;
    console.log('🔍 SMC: Scanning visible content...');

    // Find all SREF buttons in viewport
    const srefButtons = document.querySelectorAll('button[title="Style reference"]');
    
    srefButtons.forEach(button => {
      if (!this.state.processedElements.has(button as HTMLElement)) {
        this.processElement(button as HTMLElement);
      }
    });

    this.state.isProcessing = false;
  }

  /**
   * Process a single element for SREF detection
   */
  private processElement(element: HTMLElement): void {
    if (this.state.processedElements.has(element)) return;
    
    // Extract SREF code
    const srefCode = this.extractSREFCode(element);
    if (!srefCode) return;

    // Extract images from the same container
    const images = this.extractImages(element);
    
    // Check if user has already saved this SREF
    const isKnown = this.state.userSavedCodes.has(srefCode);
    
    // Create detected SREF object
    const detectedSREF: DetectedSREF = {
      code: srefCode,
      element,
      images,
      isKnown,
      timestamp: Date.now(),
      isProcessed: true,
      isVisible: true,
    };

    // Mark as processed
    this.state.processedElements.add(element);
    
    // Add to intersection observer
    this.intersectionObserver.observe(element);
    
    // Create visual indicator
    this.createIndicator(detectedSREF);
    
    console.log('🔍 SMC: Detected SREF', srefCode, 'known:', isKnown, 'images:', images.length);
  }

  /**
   * Extract SREF code from button element
   */
  private extractSREFCode(button: HTMLElement): string | null {
    const text = button.textContent;
    const match = text?.match(/sref\s+(\d+)/);
    return match?.[1] || null;
  }

  /**
   * Extract image URLs from the same container as the SREF button
   */
  private extractImages(button: HTMLElement): string[] {
    // Find the parent container that holds both the SREF button and images
    const container = this.findImageContainer(button);
    if (!container) return [];

    // Extract all Midjourney image URLs
    const images = Array.from(container.querySelectorAll('img[src*="cdn.midjourney.com"]'))
      .map(img => (img as HTMLImageElement).src)
      .filter(src => src.includes('cdn.midjourney.com'));

    return images;
  }

  /**
   * Find the container that holds both SREF button and images
   */
  private findImageContainer(button: HTMLElement): HTMLElement | null {
    // Navigate up the DOM to find the main content container
    let current = button;
    while (current && current !== document.body) {
      // Look for the grid container that holds images
      if (current.classList.contains('grid') && current.style.gridTemplateColumns) {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
    return null;
  }

  /**
   * Create visual indicator for SREF code
   */
  private createIndicator(detectedSREF: DetectedSREF): void {
    if (!this.state.isAuthenticated) return; // Don't show indicators if not authenticated

    const indicator = this.createIndicatorElement(detectedSREF);
    
    // Insert after the SREF button
    const button = detectedSREF.element;
    button.parentNode?.insertBefore(indicator, button.nextSibling);
    
    // Store reference
    this.indicators.set(detectedSREF.code, {
      element: indicator,
      srefCode: detectedSREF.code,
      isKnown: detectedSREF.isKnown,
      isVisible: true,
    });
  }

  /**
   * Create the indicator element
   */
  private createIndicatorElement(detectedSREF: DetectedSREF): HTMLElement {
    const indicator = document.createElement('button');
    
    if (detectedSREF.isKnown) {
      // Green check for known SREF
      indicator.innerHTML = '✓';
      indicator.className = 'flex-center disabled:pointer-events-none py-1.5 group-button group/button whitespace-nowrap relative min-w-max pointer-events-auto h-7 shrink-0 gap-1.5 cursor-pointer rounded-md font-medium overflow-hidden select-none w-auto px-2 text-xs flex border border-green-500 bg-green-500 text-white';
      indicator.title = 'Already saved to SMC Manager';
    } else {
      // SMC logo for unknown SREF
      indicator.innerHTML = '💾';
      indicator.className = 'flex-center disabled:pointer-events-none py-1.5 group-button group/button whitespace-nowrap relative min-w-max pointer-events-auto h-7 shrink-0 gap-1.5 cursor-pointer rounded-md font-medium overflow-hidden select-none w-auto px-2 text-xs flex border border-white/50 dark:border-dark-750 shadow-md shadow-black/5 bg-light-50 dark:bg-dark-900 dark:hover:bg-dark-950 hover:bg-white buttonActiveRing text-light-900 backdrop-brightness-150 ring-dark-900! dark:ring-white! transition';
      indicator.title = 'Save to SMC Manager';
      
      // Add click handler
      indicator.addEventListener('click', () => {
        this.handleSaveClick(detectedSREF);
      });
    }
    
    return indicator;
  }

  /**
   * Handle save button click
   */
  private handleSaveClick(detectedSREF: DetectedSREF): void {
    console.log('💾 SMC: Save clicked for SREF', detectedSREF.code);
    
    // Create input tooltip
    this.createSaveTooltip(detectedSREF);
  }

  /**
   * Create save tooltip with input field
   */
  private createSaveTooltip(detectedSREF: DetectedSREF): void {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.smc-save-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create tooltip container
    const tooltip = document.createElement('div');
    tooltip.className = 'smc-save-tooltip absolute z-50 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-750 rounded-md shadow-lg p-3';
    tooltip.style.top = '100%';
    tooltip.style.left = '0';
    tooltip.style.marginTop = '5px';

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Name this SREF';
    input.className = 'w-full px-2 py-1 border border-gray-300 dark:border-dark-750 rounded text-sm bg-white dark:bg-dark-900 text-black dark:text-white';
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600';
    
    // Handle save
    const handleSave = async () => {
      const name = input.value.trim();
      if (!name) return;
      
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      
      // Send save request to background script
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_SREF',
        data: {
          code: detectedSREF.code,
          name,
          images: detectedSREF.images,
        }
      });
      
      if (response.success) {
        // Update indicator to green check
        this.updateIndicatorToSaved(detectedSREF.code);
        tooltip.remove();
      } else {
        alert('Failed to save SREF: ' + response.error);
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
      }
    };
    
    saveButton.addEventListener('click', handleSave);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSave();
      }
    });
    
    // Add elements to tooltip
    tooltip.appendChild(input);
    tooltip.appendChild(saveButton);
    
    // Add tooltip to page
    const indicator = this.indicators.get(detectedSREF.code);
    if (indicator) {
      indicator.element.appendChild(tooltip);
      input.focus();
    }
  }

  /**
   * Update indicator to saved state
   */
  private updateIndicatorToSaved(srefCode: string): void {
    const indicator = this.indicators.get(srefCode);
    if (indicator) {
      indicator.element.innerHTML = '✓';
      indicator.element.className = 'flex-center disabled:pointer-events-none py-1.5 group-button group/button whitespace-nowrap relative min-w-max pointer-events-auto h-7 shrink-0 gap-1.5 cursor-pointer rounded-md font-medium overflow-hidden select-none w-auto px-2 text-xs flex border border-green-500 bg-green-500 text-white';
      indicator.element.title = 'Already saved to SMC Manager';
      indicator.isKnown = true;
      
      // Remove click handler
      indicator.element.replaceWith(indicator.element.cloneNode(true));
    }
  }

  /**
   * Show loading indicators during scroll
   */
  private showLoadingIndicators(): void {
    // This could show spinners for new content
    // For now, we'll keep it simple
  }
}
