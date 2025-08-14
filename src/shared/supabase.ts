import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://qqbbssxxddcsuboiceey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmJzc3h4ZGRjc3Vib2ljZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA4MDcsImV4cCI6MjA2NjcwNjgwN30.3NHXaXN_24TNoaXwaloPBu5nomHzeiC5m9DmGTuO1d8';

// Create Supabase client with custom storage for Chrome extension
const createSupabaseClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          const result = await chrome.storage.local.get([key]);
          return result[key] || null;
        },
        setItem: async (key: string, value: string) => {
          await chrome.storage.local.set({ [key]: value });
        },
        removeItem: async (key: string) => {
          await chrome.storage.local.remove([key]);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = createSupabaseClient();

/**
 * Authentication service for session transfer from SMC Manager
 */
export class AuthService {
  /**
   * Get current authentication state
   */
  static async getAuthState() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 AUTH: Session error:', error);
        return { isAuthenticated: false };
      }

      if (!session) {
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email || undefined,
        },
        session,
      };
    } catch (error) {
      console.error('🔐 AUTH: Failed to get auth state:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Transfer session from SMC Manager web app
   * This is the key method that enables SSO support
   */
  static async transferSessionFromWebApp() {
    try {
      console.log('🔄 AUTH: Attempting session transfer from SMC Manager...');
      
      // Get session data from SMC Manager web app
      const sessionData = await this.getSessionFromWebApp();
      
      if (!sessionData) {
        console.log('❌ AUTH: No session found in SMC Manager');
        return { success: false, error: 'No session found in SMC Manager. Please log in to SMC Manager first.' };
      }

      console.log('🔄 AUTH: Found session data, setting in extension...');
      
      // Set the session in our Supabase client
      const { data, error } = await supabase.auth.setSession(sessionData);
      
      if (error) {
        console.error('❌ AUTH: Failed to set session:', error);
        return { success: false, error: 'Failed to transfer session: ' + error.message };
      }
      
      console.log('✅ AUTH: Session transferred successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ AUTH: Error during session transfer:', error);
      return { success: false, error: 'Session transfer failed' };
    }
  }

  /**
   * Get session from SMC Manager web app
   * This method accesses the web app's localStorage to get the session
   */
  private static async getSessionFromWebApp(): Promise<any> {
    try {
      // Find SMC Manager tab
      const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
      
      if (tabs.length === 0) {
        console.log('❌ AUTH: No SMC Manager tab found. Please open SMC Manager in a tab.');
        return null;
      }
      
      const targetTab = tabs[0];
      if (!targetTab || !targetTab.id) {
        console.log('❌ AUTH: Invalid SMC Manager tab');
        return null;
      }
      
      console.log('🔄 AUTH: Found SMC Manager tab, getting session...');
      
      // Execute script in SMC Manager tab to get session
      const results = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        func: () => {
          try {
            // Try different possible storage keys for Supabase session
            const storageKeys = [
              'sb-qqbbssxxddcsuboiceey-auth-token',
              'supabase.auth.token',
              'supabase-session',
              'sb-auth-token'
            ];
            
            for (const key of storageKeys) {
              const session = localStorage.getItem(key);
              if (session) {
                console.log(`🔄 WEBAPP: Found session in ${key}`);
                return JSON.parse(session);
              }
            }
            
            // Log all localStorage keys for debugging
            console.log('🔄 WEBAPP: All localStorage keys:', Object.keys(localStorage));
            
            return null;
          } catch (error) {
            console.error('🔄 WEBAPP: Error getting session:', error);
            return null;
          }
        }
      });
      
      if (results && results[0] && results[0].result) {
        console.log('✅ AUTH: Successfully retrieved session data');
        return results[0].result;
      }
      
      console.log('❌ AUTH: No session data found in SMC Manager');
      return null;
    } catch (error) {
      console.error('❌ AUTH: Error getting session from web app:', error);
      return null;
    }
  }

  /**
   * Get user's saved SREF codes
   */
  static async getUserSavedSREFs(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('sref_codes')
        .select('code_value')
        .eq('user_id', userId);

      if (error) {
        console.error('🔐 AUTH: Failed to fetch user SREF codes:', error);
        return [];
      }

      return data?.map(item => item.code_value) || [];
    } catch (error) {
      console.error('🔐 AUTH: Failed to get user SREF codes:', error);
      return [];
    }
  }
}

/**
 * SREF management service
 */
export class SREFService {
  static async saveSREF(request: {
    code: string;
    name: string;
    images: string[];
    userId: string;
  }) {
    try {
      console.log('💾 SREF: Saving SREF code:', request.code, 'with name:', request.name);
      
      // First, save the SREF code
      const { data: srefCode, error: srefError } = await supabase
        .from('sref_codes')
        .insert({
          title: request.name,
          code_value: request.code,
          sv_version: 6, // Default to v6
          user_id: request.userId,
        })
        .select()
        .single();

      if (srefError || !srefCode) {
        throw new Error(`Failed to save SREF code: ${srefError?.message}`);
      }

      console.log('💾 SREF: Successfully saved SREF code with ID:', srefCode.id);

      // Then save the images
      if (request.images.length > 0) {
        console.log('💾 SREF: Saving', request.images.length, 'images...');
        
        const imageInserts = request.images.map((image, index) => ({
          sref_code_id: srefCode.id,
          image_url: image,
          position: index,
        }));

        const { error: imagesError } = await supabase
          .from('code_images')
          .insert(imageInserts);

        if (imagesError) {
          console.warn('💾 SREF: Failed to save some images:', imagesError);
        } else {
          console.log('💾 SREF: Successfully saved all images');
        }
      }

      return { success: true, data: srefCode };
    } catch (error) {
      console.error('💾 SREF: Failed to save SREF:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
