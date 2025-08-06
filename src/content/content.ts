import { DetectedSREF, ExtensionMessage } from '../types';
import './content.css';

/**
 * Content script for detecting SREF codes on MidJourney (Discord) pages
 * Injects UI elements and handles SREF mining functionality
 */

console.log('SREF Mining Extension content script loaded');

class SREFMiner {
  private detectedSREFs: Map<string, DetectedSREF> = new Map();
  private observer: MutationObserver | null = null;
  private isActive = false;

  constructor() {
    this.init();
  }

  private async init() {
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  private start() {
    console.log('Starting SREF detection on:', window.location.href);
    
    // Check if we're on a Discord page (MidJourney runs in Discord)
    if (!this.isDiscordPage()) {
      console.log('Not a Discord page, SREF mining disabled');
      return;
    }

    this.isActive = true;
    this.startObserving();
    this.scanExistingSREFs();
  }

  private isDiscordPage(): boolean {
    return window.location.hostname.includes('discord.com');
  }

  private startObserving() {
    this.observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes might contain SREF codes
          const hasRelevantNodes = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return this.mightContainSREF(element);
            }
            return false;
          });
          
          if (hasRelevantNodes) {
            shouldScan = true;
          }
        }
      });

      if (shouldScan) {
        // Debounce scanning to avoid excessive checks
        setTimeout(() => this.scanForSREFs(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private mightContainSREF(element: Element): boolean {
    // Look for Discord message elements or image containers
    return (
      element.classList.contains('message') ||
      element.classList.contains('messageContent') ||
      element.classList.contains('imageWrapper') ||
      element.querySelector('[class*="message"]') !== null ||
      element.querySelector('img') !== null
    );
  }

  private scanExistingSREFs() {
    // Scan for any existing SREF codes on page load
    this.scanForSREFs();
  }

  private scanForSREFs() {
    if (!this.isActive) return;

    // Look for SREF codes in Discord messages
    const messages = document.querySelectorAll('[class*="message"]');
    
    messages.forEach((message) => {
      this.checkMessageForSREF(message as HTMLElement);
    });
  }

  private checkMessageForSREF(messageElement: HTMLElement) {
    // Look for SREF patterns in message text
    const textContent = messageElement.textContent || '';
    const srefMatch = textContent.match(/--sref\s+(\d+)/i);
    
    if (!srefMatch) return;

    const srefCode = srefMatch[1];
    const messageId = this.getMessageId(messageElement);
    
    if (!messageId || this.detectedSREFs.has(messageId)) {
      return; // Already processed or can't identify
    }

    // Look for associated images
    const images = this.extractImagesFromMessage(messageElement);
    
    if (images.length === 0) {
      return; // No images found, not a complete SREF result
    }

    // Create detected SREF object
    const prompt = this.extractPrompt(messageElement);
    const detectedSREF: DetectedSREF = {
      srefCode: `--sref ${srefCode}`,
      images,
      prompt,
      messageId,
      element: messageElement,
      timestamp: Date.now(),
    };

    this.detectedSREFs.set(messageId, detectedSREF);
    this.injectMiningUI(messageElement, detectedSREF);
    this.notifyBackground(detectedSREF);
  }

  private getMessageId(messageElement: HTMLElement): string | null {
    // Try to find a unique identifier for the message
    const idAttr = messageElement.getAttribute('id') || 
                   messageElement.getAttribute('data-list-item-id') ||
                   messageElement.querySelector('[id]')?.getAttribute('id');
    
    return idAttr || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractImagesFromMessage(messageElement: HTMLElement): string[] {
    const images: string[] = [];
    const imgElements = messageElement.querySelectorAll('img');
    
    imgElements.forEach((img) => {
      const src = img.src || img.getAttribute('data-src');
      if (src && !src.includes('emoji') && !src.includes('avatar')) {
        images.push(src);
      }
    });

    return images;
  }

  private extractPrompt(messageElement: HTMLElement): string | undefined {
    // Try to extract the prompt text from the message
    const textElements = messageElement.querySelectorAll('[class*="markup"], [class*="content"]');
    
    for (const element of Array.from(textElements)) {
      const text = element.textContent?.trim();
      if (text && text.length > 10 && !text.startsWith('--sref')) {
        return text;
      }
    }

    return undefined;
  }

  private injectMiningUI(messageElement: HTMLElement, detectedSREF: DetectedSREF) {
    // Don't inject if already present
    if (messageElement.querySelector('.sref-mining-button')) {
      return;
    }

    // Create mining button
    const miningButton = document.createElement('button');
    miningButton.className = 'sref-mining-button';
    miningButton.innerHTML = `
      <svg class="sref-mining-icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
      </svg>
      <span>Mine SREF</span>
    `;
    
    miningButton.title = 'Save this SREF code to your library';
    
    miningButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showMiningModal(detectedSREF);
    });

    // Position the button (this will depend on Discord's current layout)
    miningButton.style.position = 'absolute';
    miningButton.style.top = '8px';
    miningButton.style.right = '8px';
    miningButton.style.zIndex = '1000';

    // Make the message container relatively positioned
    const messageContainer = messageElement.closest('[class*="message"]') as HTMLElement;
    if (messageContainer) {
      messageContainer.style.position = 'relative';
      messageContainer.appendChild(miningButton);
    }
  }

  private showMiningModal(detectedSREF: DetectedSREF) {
    // Create and show a modal for naming and tagging the SREF
    const modal = document.createElement('div');
    modal.className = 'sref-mining-modal';
    modal.innerHTML = `
      <div class="sref-mining-modal-content">
        <div class="sref-mining-modal-header">
          <h3>Save SREF Code</h3>
          <button class="sref-mining-modal-close">&times;</button>
        </div>
        <div class="sref-mining-modal-body">
          <div class="sref-mining-form">
            <div class="sref-mining-field">
              <label for="sref-title">Title:</label>
              <input type="text" id="sref-title" placeholder="Enter a title for this SREF..." />
            </div>
            <div class="sref-mining-field">
              <label for="sref-tags">Tags:</label>
              <input type="text" id="sref-tags" placeholder="Enter tags separated by commas..." />
            </div>
            <div class="sref-mining-field">
              <label>SREF Code:</label>
              <input type="text" value="${detectedSREF.srefCode}" readonly />
            </div>
            <div class="sref-mining-field">
              <label>Images Found:</label>
              <div class="sref-mining-images">
                ${detectedSREF.images.map(img => `<img src="${img}" alt="SREF reference" />`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="sref-mining-modal-footer">
          <button class="sref-mining-btn sref-mining-btn-secondary" id="sref-cancel">Cancel</button>
          <button class="sref-mining-btn sref-mining-btn-primary" id="sref-save">Save to Library</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle modal interactions
    const closeBtn = modal.querySelector('.sref-mining-modal-close') as HTMLElement;
    const cancelBtn = modal.querySelector('#sref-cancel') as HTMLElement;
    const saveBtn = modal.querySelector('#sref-save') as HTMLElement;
    const titleInput = modal.querySelector('#sref-title') as HTMLInputElement;
    const tagsInput = modal.querySelector('#sref-tags') as HTMLInputElement;

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    saveBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      if (!title) {
        alert('Please enter a title for this SREF code.');
        return;
      }

      // Send save request to background script
      const message: ExtensionMessage = {
        type: 'SAVE_SREF',
        data: {
          title,
          srefCode: detectedSREF.srefCode,
          images: detectedSREF.images,
          tags,
          svVersion: this.detectSVVersion(detectedSREF.srefCode),
        },
      };

      try {
        saveBtn.textContent = 'Saving...';
        saveBtn.setAttribute('disabled', 'true');
        
        const response = await chrome.runtime.sendMessage(message);
        
        if (response.success) {
          closeModal();
          this.showSuccessToast('SREF saved successfully!');
        } else {
          alert(`Failed to save SREF: ${response.error}`);
        }
      } catch (error) {
        console.error('Failed to save SREF:', error);
        alert('Failed to save SREF. Please try again.');
      } finally {
        saveBtn.textContent = 'Save to Library';
        saveBtn.removeAttribute('disabled');
      }
    });

    // Focus the title input
    titleInput.focus();
  }

  private detectSVVersion(srefCode: string): 4 | 6 {
    // Default to version 6 for now, could be enhanced to detect from context
    return 6;
  }

  private showSuccessToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'sref-mining-toast sref-mining-toast-success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('sref-mining-toast-show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('sref-mining-toast-show');
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  private notifyBackground(detectedSREF: DetectedSREF) {
    const message: ExtensionMessage = {
      type: 'SREF_DETECTED',
      data: {
        srefCode: detectedSREF.srefCode,
        images: detectedSREF.images,
        timestamp: detectedSREF.timestamp,
      },
    };

    chrome.runtime.sendMessage(message).catch(error => {
      console.error('Failed to notify background script:', error);
    });
  }

  public destroy() {
    this.isActive = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Clean up injected UI elements
    document.querySelectorAll('.sref-mining-button, .sref-mining-modal').forEach(el => {
      el.remove();
    });
  }
}

// Initialize the SREF miner
const srefMiner = new SREFMiner();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  srefMiner.destroy();
});