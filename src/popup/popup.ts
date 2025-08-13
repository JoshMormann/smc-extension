import { ExtensionMessage, AuthState } from '../types';
import { PopupAuthService } from '../shared/popup-auth';

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
      console.log('🚀 POPUP: Initializing popup...');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize Supabase auth first
      await this.initializeAuth();
      
      // Load recent SREFs
      this.loadRecentSREFs();
      
    } catch (error) {
      console.error('❌ POPUP: Failed to initialize popup:', error);
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

  private async initializeAuth() {
    try {
      this.showLoading();
      
      console.log('🔐 POPUP: Initializing Supabase auth...');
      
      // Initialize Supabase auth and handle any callbacks
      const authState = await PopupAuthService.initializeAuth();
      
      // Also handle potential OAuth callbacks
      const callbackState = await PopupAuthService.handleAuthCallback();
      
      // Use the callback state if available, otherwise use initial state
      this.authState = callbackState.isAuthenticated ? callbackState : authState;
      
      console.log('🔐 POPUP: Auth state:', this.authState);
      
      // Set up auth state change listener
      PopupAuthService.onAuthStateChange((newAuthState) => {
        console.log('🔐 POPUP: Auth state changed:', newAuthState);
        this.authState = newAuthState;
        this.updateUI();
      });
      
      this.updateUI();
    } catch (error) {
      console.error('❌ POPUP: Failed to initialize auth:', error);
      this.showError('Failed to initialize authentication');
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
      console.log(`🔐 POPUP: Starting ${provider} sign in...`);
      
      const result = await PopupAuthService.signInWithOAuth(provider);
      
      if (result.success) {
        console.log(`🔐 POPUP: ${provider} OAuth initiated`);
        // OAuth will redirect and we'll handle it in the auth state change listener
      } else {
        console.error(`🔐 POPUP: ${provider} sign in failed:`, result.error);
        this.showError(`${provider} sign in failed: ${result.error}`);
      }
    } catch (error) {
      console.error('🔐 POPUP: Sign in failed:', error);
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
      console.log('🔐 POPUP: Starting sign out...');
      
      const result = await PopupAuthService.signOut();
      
      if (result.success) {
        console.log('🔐 POPUP: Signed out successfully');
        // Auth state change listener will handle UI update
      } else {
        console.error('🔐 POPUP: Sign out failed:', result.error);
        this.showError(`Sign out failed: ${result.error}`);
      }
    } catch (error) {
      console.error('🔐 POPUP: Sign out failed:', error);
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