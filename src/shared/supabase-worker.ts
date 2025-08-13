// Service Worker compatible Supabase integration
import { createClient } from '@supabase/supabase-js';
import { AuthState } from '../types';

// Supabase configuration for SREF Manager extension
const SUPABASE_URL = 'https://qqbbssxxddcsuboiceey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmJzc3h4ZGRjc3Vib2ljZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA4MDcsImV4cCI6MjA2NjcwNjgwN30.3NHXaXN_24TNoaXwaloPBu5nomHzeiC5m9DmGTuO1d8';

// Create Supabase client with service worker-compatible options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Disable features that require DOM APIs
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Service Worker compatible Authentication service
 */
export class WorkerAuthService {
  static async getAuthState(): Promise<AuthState> {
    try {
      // For service worker, we'll check Chrome storage for auth state
      // since we can't rely on Supabase's session management
      const result = await chrome.storage.local.get(['authState']);
      
      if (result.authState) {
        console.log('🔐 WORKER: Using stored auth state');
        return result.authState;
      }

      console.log('🔐 WORKER: No stored auth state, returning unauthenticated');
      return { isAuthenticated: false };
    } catch (error) {
      console.error('🔐 WORKER: Failed to get auth state:', error);
      return { isAuthenticated: false };
    }
  }

  static async storeAuthState(authState: AuthState) {
    try {
      await chrome.storage.local.set({ authState });
      console.log('🔐 WORKER: Auth state stored');
    } catch (error) {
      console.error('🔐 WORKER: Failed to store auth state:', error);
    }
  }

  static async clearAuthState() {
    try {
      await chrome.storage.local.remove(['authState']);
      console.log('🔐 WORKER: Auth state cleared');
    } catch (error) {
      console.error('🔐 WORKER: Failed to clear auth state:', error);
    }
  }

  // Note: OAuth will be handled in the popup/content script context
  // Service worker just manages the stored auth state
}