import { ExtensionMessage, AuthState } from '../types';

/**
 * Popup script for the SREF Mining Extension
 * Handles authentication, status display, and recent SREF management
 */

class PopupManager {
  private authState: AuthState | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial state
      await this.loadAuthStatus();
      this.loadRecentSREFs();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to initialize extension');
    }
  }

  private setupEventListeners() {
    // Authentication buttons
    const signInGoogleBtn = document.getElementById('sign-in-google');
    const signInDiscordBtn = document.getElementById('sign-in-discord');
    const signOutBtn = document.getElementById('sign-out');
    
    signInGoogleBtn?.addEventListener('click', () => this.handleSignIn('google'));
    signInDiscordBtn?.addEventListener('click', () => this.handleSignIn('discord'));
    signOutBtn?.addEventListener('click', () => this.handleSignOut());
    
    // Action buttons
    const openLibraryBtn = document.getElementById('open-library');
    openLibraryBtn?.addEventListener('click', () => this.handleOpenLibrary());
  }

  private async loadAuthStatus() {
    try {
      this.showLoading();
      
      const message: ExtensionMessage = {
        type: 'GET_AUTH_STATUS',
      };
      
      const response = await chrome.runtime.sendMessage(message);
      
      if (response.success) {
        this.authState = response.data;
        this.updateUI();
      } else {
        throw new Error(response.error || 'Failed to get auth status');
      }
    } catch (error) {
      console.error('Failed to load auth status:', error);
      this.showError('Failed to load authentication status');
    }
  }

  private async loadRecentSREFs() {
    try {
      const result = await chrome.storage.local.get(['lastDetectedSREF']);
      const recentSREF = result.lastDetectedSREF;
      
      if (recentSREF) {
        this.displayRecentSREF(recentSREF);
      } else {
        this.hideRecentSection();
      }
    } catch (error) {
      console.error('Failed to load recent SREFs:', error);
    }
  }

  private displayRecentSREF(sref: any) {
    const recentSection = document.getElementById('recent-section');
    const recentList = document.getElementById('recent-sref-list');
    
    if (!recentSection || !recentList) return;
    
    recentSection.classList.remove('hidden');
    
    const timeAgo = this.formatTimeAgo(sref.timestamp);
    
    recentList.innerHTML = `
      <div class="recent-sref">
        <div class="recent-sref-code">${sref.srefCode}</div>
        <div class="recent-sref-info">
          Detected ${timeAgo} • ${sref.images?.length || 0} images
        </div>
      </div>
    `;
  }

  private hideRecentSection() {
    const recentSection = document.getElementById('recent-section');
    recentSection?.classList.add('hidden');
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'today';
  }

  private updateUI() {
    if (!this.authState) return;
    
    this.hideLoading();
    this.hideError();
    
    if (this.authState.isAuthenticated) {
      this.showAuthenticatedState();
    } else {
      this.showUnauthenticatedState();
    }
  }

  private showAuthenticatedState() {
    const authState = document.getElementById('auth-state');
    const authenticatedState = document.getElementById('authenticated-state');
    const userEmail = document.getElementById('user-email');
    
    authState?.classList.add('hidden');
    authenticatedState?.classList.remove('hidden');
    
    if (userEmail && this.authState?.user?.email) {
      userEmail.textContent = this.authState.user.email;
    }
    
    // Load user stats (could be enhanced to fetch from API)
    this.loadUserStats();
  }

  private showUnauthenticatedState() {
    const authState = document.getElementById('auth-state');
    const authenticatedState = document.getElementById('authenticated-state');
    
    authState?.classList.remove('hidden');
    authenticatedState?.classList.add('hidden');
  }

  private async loadUserStats() {
    // This could be enhanced to fetch real stats from the API
    const srefCount = document.getElementById('sref-count');
    if (srefCount) {
      srefCount.textContent = '...'; // Placeholder
    }
  }

  private async handleSignIn(provider: 'google' | 'discord') {
    try {
      // For OAuth sign-in, we need to create a new tab
      // This is a simplified approach - in production you'd want proper OAuth flow
      const authUrl = this.getAuthUrl(provider);
      
      // Open auth tab
      const tab = await chrome.tabs.create({ url: authUrl });
      
      // Monitor for auth completion
      // This is a basic implementation - you'd want proper OAuth callback handling
      const checkAuth = setInterval(async () => {
        try {
          await this.loadAuthStatus();
          if (this.authState?.isAuthenticated) {
            clearInterval(checkAuth);
            chrome.tabs.remove(tab.id!);
          }
        } catch (error) {
          // Continue checking
        }
      }, 1000);
      
      // Stop checking after 2 minutes
      setTimeout(() => clearInterval(checkAuth), 120000);
      
    } catch (error) {
      console.error('Sign in failed:', error);
      this.showError('Sign in failed. Please try again.');
    }
  }

  private getAuthUrl(provider: 'google' | 'discord'): string {
    // This would need to be configured with your actual Supabase project
    const supabaseUrl = 'https://your-project.supabase.co';
    const redirectUrl = chrome.runtime.getURL('popup.html');
    
    return `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`;
  }

  private async handleSignOut() {
    try {
      // Clear local auth state
      await chrome.storage.local.clear();
      
      // Reload auth status
      await this.loadAuthStatus();
      
    } catch (error) {
      console.error('Sign out failed:', error);
      this.showError('Sign out failed. Please try again.');
    }
  }

  private handleOpenLibrary() {
    // Open the SREF Manager web app
    const libraryUrl = 'https://your-sref-manager-url.com'; // Configure this
    chrome.tabs.create({ url: libraryUrl });
  }

  private showLoading() {
    const loadingState = document.getElementById('loading-state');
    const authState = document.getElementById('auth-state');
    const authenticatedState = document.getElementById('authenticated-state');
    
    loadingState?.classList.remove('hidden');
    authState?.classList.add('hidden');
    authenticatedState?.classList.add('hidden');
  }

  private hideLoading() {
    const loadingState = document.getElementById('loading-state');
    loadingState?.classList.add('hidden');
  }

  private showError(message: string) {
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    
    if (errorState && errorMessage) {
      errorMessage.textContent = message;
      errorState.classList.remove('hidden');
    }
  }

  private hideError() {
    const errorState = document.getElementById('error-state');
    errorState?.classList.add('hidden');
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});