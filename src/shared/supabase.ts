import { createClient } from '@supabase/supabase-js';
import { AuthState, SaveSREFRequest } from '../types';

// Supabase configuration
const SUPABASE_URL = 'https://qqbbssxxddcsuboiceey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmJzc3h4ZGRjc3Vib2ljZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA4MDcsImV4cCI6MjA2NjcwNjgwN30.3NHXaXN_24TNoaXwaloPBu5nomHzeiC5m9DmGTuO1d8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Authentication service for session detection
 */
export class AuthService {
  static async getAuthState(): Promise<AuthState> {
    try {
      console.log('🔐 AUTH: Checking for existing session...');
      
      // First, try to get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 AUTH: Supabase session error:', error);
        return { isAuthenticated: false };
      }

      console.log('🔐 AUTH: Session check result:', {
        hasSession: !!session,
        sessionUser: session?.user?.email,
        sessionExpires: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
      });

      // If no session found, try to check if we can access the web app's session
      if (!session) {
        console.log('🔐 AUTH: No session found, checking if we can access web app session...');
        
        // Try to access the web app's localStorage (this might not work due to CORS)
        try {
          // This is a fallback attempt - it likely won't work due to browser security
          const webAppSession = await this.tryGetWebAppSession();
          if (webAppSession) {
            console.log('🔐 AUTH: Found web app session, attempting to use it...');
            return webAppSession;
          }
        } catch (webAppError) {
          console.log('🔐 AUTH: Could not access web app session (expected):', webAppError);
        }
      }

      return {
        isAuthenticated: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || undefined,
        } : undefined,
        session,
      };
    } catch (error) {
      console.error('🔐 AUTH: Failed to get auth state:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Try to get session from the SMC Manager web app
   * This is a fallback that likely won't work due to CORS restrictions
   */
  private static async tryGetWebAppSession(): Promise<AuthState | null> {
    try {
      // Try to access the SMC Manager web app's localStorage
      // This will likely fail due to CORS, but worth trying
      const response = await fetch('http://localhost:5173', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log('🔐 AUTH: Successfully connected to SMC Manager web app');
        // Even if we can connect, we can't access their localStorage due to CORS
        return null;
      }
    } catch (error) {
      console.log('🔐 AUTH: Cannot access SMC Manager web app:', error);
    }
    
    return null;
  }

  /**
   * Set session from external source (for session transfer)
   */
  static async setSession(sessionData: any): Promise<{ data: any; error: any }> {
    try {
      console.log('🔐 AUTH: Setting session from transfer data...');
      
      // Extract session information from the transferred data
      let session;
      
      if (sessionData.session) {
        session = sessionData.session;
      } else if (sessionData.access_token) {
        // If we have an access token, try to create a session object
        session = {
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at,
          user: sessionData.user,
        };
      } else {
        throw new Error('Invalid session data format');
      }
      
      // Set the session in Supabase
      const { data, error } = await supabase.auth.setSession(session);
      
      if (error) {
        console.error('🔐 AUTH: Failed to set session:', error);
        return { data: null, error };
      }
      
      console.log('🔐 AUTH: Session set successfully');
      return { data, error: null };
    } catch (error) {
      console.error('🔐 AUTH: Error setting session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  static async getUserSavedSREFs(userId: string): Promise<string[]> {
    try {
      console.log('🔐 AUTH: Fetching saved SREF codes for user:', userId);
      
      const { data, error } = await supabase
        .from('sref_codes')
        .select('code_value')
        .eq('user_id', userId);

      if (error) {
        console.error('🔐 AUTH: Failed to fetch user SREF codes:', error);
        return [];
      }

      console.log('🔐 AUTH: Found', data?.length || 0, 'saved SREF codes');
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
  static async saveSREF(request: SaveSREFRequest) {
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
