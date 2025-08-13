// Pure Chrome storage based auth - no Supabase imports
import { AuthState } from '../types';

/**
 * Simple storage-based auth service for service worker
 * No external dependencies, just Chrome storage
 */
export class StorageAuthService {
  static async getAuthState(): Promise<AuthState> {
    try {
      console.log('🔐 STORAGE: Getting auth state from Chrome storage...');
      const result = await chrome.storage.local.get(['authState']);
      
      if (result.authState) {
        console.log('🔐 STORAGE: Found stored auth state:', result.authState);
        return result.authState;
      }

      console.log('🔐 STORAGE: No stored auth state, returning unauthenticated');
      return { isAuthenticated: false };
    } catch (error) {
      console.error('🔐 STORAGE: Failed to get auth state:', error);
      return { isAuthenticated: false };
    }
  }

  static async storeAuthState(authState: AuthState): Promise<void> {
    try {
      console.log('🔐 STORAGE: Storing auth state:', authState);
      await chrome.storage.local.set({ authState });
      console.log('🔐 STORAGE: Auth state stored successfully');
    } catch (error) {
      console.error('🔐 STORAGE: Failed to store auth state:', error);
      throw error;
    }
  }

  static async clearAuthState(): Promise<void> {
    try {
      console.log('🔐 STORAGE: Clearing auth state...');
      await chrome.storage.local.remove(['authState']);
      console.log('🔐 STORAGE: Auth state cleared successfully');
    } catch (error) {
      console.error('🔐 STORAGE: Failed to clear auth state:', error);
      throw error;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const authState = await this.getAuthState();
    return authState.isAuthenticated;
  }
}