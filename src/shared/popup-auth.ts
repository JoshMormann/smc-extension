// Popup-based Supabase authentication (has DOM access)
import { createClient } from '@supabase/supabase-js';
import { AuthState } from '../types';
import { StorageAuthService } from './storage-auth';

// Supabase configuration for SREF Manager extension
const SUPABASE_URL = 'https://qqbbssxxddcsuboiceey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmJzc3h4ZGRjc3Vib2ljZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA4MDcsImV4cCI6MjA2NjcwNjgwN30.3NHXaXN_24TNoaXwaloPBu5nomHzeiC5m9DmGTuO1d8';

// Create Supabase client (popup context has DOM access)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Popup-based authentication service that works with Supabase
 */
export class PopupAuthService {
  static async initializeAuth(): Promise<AuthState> {
    try {
      console.log('🔐 POPUP: Initializing Supabase auth...');
      
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 POPUP: Session error:', error);
        return { isAuthenticated: false };
      }

      if (session) {
        console.log('🔐 POPUP: Found existing session');
        const authState: AuthState = {
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || undefined,
          },
          session,
        };

        // Store auth state for service worker
        await StorageAuthService.storeAuthState(authState);
        return authState;
      }

      console.log('🔐 POPUP: No existing session');
      return { isAuthenticated: false };
    } catch (error) {
      console.error('🔐 POPUP: Failed to initialize auth:', error);
      return { isAuthenticated: false };
    }
  }

  static async signInWithOAuth(provider: 'google' | 'discord'): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔐 POPUP: Starting ${provider} OAuth with Chrome Identity API...`);
      console.log(`🔐 POPUP: Current extension ID: ${chrome.runtime.id}`);
      
      if (provider === 'google') {
        // Use launchWebAuthFlow for Google OAuth (getAuthToken is deprecated)
        return new Promise((resolve) => {
          const clientId = "127425740407-lrp8rri4vr431j20dkati11ph229ms37.apps.googleusercontent.com";
          const redirectUri = chrome.identity.getRedirectURL();
          const state = Math.random().toString(36).substring(7);
          const scopes = "openid email profile";
          
          // Build OAuth URL
          const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
          authUrl.searchParams.set("client_id", clientId);
          authUrl.searchParams.set("redirect_uri", redirectUri);
          authUrl.searchParams.set("response_type", "code");
          authUrl.searchParams.set("scope", scopes);
          authUrl.searchParams.set("state", state);
          authUrl.searchParams.set("access_type", "offline");
          
          console.log(`🔐 POPUP: Launching OAuth flow with URL:`, authUrl.toString());
          console.log(`🔐 POPUP: Redirect URI:`, redirectUri);
          
          chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true,
          }, async (redirectedTo) => {
            if (chrome.runtime.lastError) {
              console.error(`🔐 POPUP: OAuth failed:`, chrome.runtime.lastError);
              resolve({ 
                success: false, 
                error: chrome.runtime.lastError.message || 'OAuth failed' 
              });
              return;
            }

            if (!redirectedTo) {
              console.error(`🔐 POPUP: No redirect URL received`);
              resolve({ success: false, error: 'Authentication cancelled' });
              return;
            }

            console.log(`🔐 POPUP: OAuth redirect received:`, redirectedTo);
            
            try {
              // Parse authorization code from redirect URL
              const url = new URL(redirectedTo);
              const code = url.searchParams.get('code');
              const returnedState = url.searchParams.get('state');
              
              if (!code) {
                throw new Error('No authorization code received');
              }
              
              if (returnedState !== state) {
                throw new Error('State parameter mismatch');
              }
              
              console.log(`🔐 POPUP: Authorization code received, exchanging for tokens...`);
              
              // Exchange code for tokens
              const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  client_id: clientId,
                  code: code,
                  redirect_uri: redirectUri,
                  grant_type: 'authorization_code',
                }),
              });
              
              if (!tokenResponse.ok) {
                throw new Error(`Token exchange failed: ${tokenResponse.status}`);
              }
              
              const tokens = await tokenResponse.json();
              console.log(`🔐 POPUP: Tokens received, getting user info...`);
              
              // Get user info with access token
              const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
              if (!userResponse.ok) {
                throw new Error(`Failed to fetch user info: ${userResponse.status}`);
              }
              
              const userInfo = await userResponse.json();
              console.log(`🔐 POPUP: Got user info:`, userInfo.email);
              
              if (!userInfo.email) {
                resolve({ success: false, error: 'Failed to get user email from Google' });
                return;
              }

              // Create auth state
              const authState: AuthState = {
                isAuthenticated: true,
                user: {
                  id: userInfo.id,
                  email: userInfo.email,
                },
                // Store tokens for later use
                tokens: {
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token,
                  expires_in: tokens.expires_in,
                }
              };

              await StorageAuthService.storeAuthState(authState);
              console.log(`🔐 POPUP: Authentication successful for ${userInfo.email}`);
              resolve({ success: true });
              
            } catch (error) {
              console.error(`🔐 POPUP: Failed to process OAuth callback:`, error);
              resolve({ 
                success: false, 
                error: error instanceof Error ? error.message : 'OAuth processing failed' 
              });
            }
          });
        });
      }

      // For other providers, fall back to the original approach
      const redirectUrl = chrome.identity.getRedirectURL();
      console.log(`🔐 POPUP: Using redirect URL:`, redirectUrl);
      
      // Get OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error(`🔐 POPUP: ${provider} OAuth error:`, error);
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        console.error(`🔐 POPUP: No OAuth URL received`);
        return { success: false, error: 'No OAuth URL received' };
      }

      console.log(`🔐 POPUP: OAuth URL from Supabase:`, data.url);
      console.log(`🔐 POPUP: Launching Chrome Identity OAuth flow...`);
      
      // Use Chrome Identity API for proper OAuth flow
      return new Promise((resolve) => {
        chrome.identity.launchWebAuthFlow({
          url: data.url,
          interactive: true,
        }, async (redirectedTo) => {
          if (chrome.runtime.lastError) {
            console.error(`🔐 POPUP: OAuth failed:`, chrome.runtime.lastError);
            resolve({ 
              success: false, 
              error: chrome.runtime.lastError.message || 'OAuth failed' 
            });
            return;
          }

          if (!redirectedTo) {
            console.error(`🔐 POPUP: No redirect URL received`);
            resolve({ success: false, error: 'Authentication cancelled' });
            return;
          }

          console.log(`🔐 POPUP: OAuth redirect received:`, redirectedTo);
          
          try {
            // Parse the OAuth callback
            const authState = await this.handleOAuthCallback(redirectedTo);
            if (authState.isAuthenticated) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: 'Authentication failed' });
            }
          } catch (error) {
            console.error(`🔐 POPUP: Failed to handle OAuth callback:`, error);
            resolve({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Callback handling failed' 
            });
          }
        });
      });
    } catch (error) {
      console.error(`🔐 POPUP: ${provider} OAuth failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'OAuth failed' 
      };
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 POPUP: Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('🔐 POPUP: Sign out error:', error);
        return { success: false, error: error.message };
      }

      // Clear stored auth state
      await StorageAuthService.clearAuthState();
      console.log('🔐 POPUP: Signed out successfully');
      
      return { success: true };
    } catch (error) {
      console.error('🔐 POPUP: Sign out failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  }

  static async handleOAuthCallback(redirectUrl: string): Promise<AuthState> {
    try {
      console.log('🔐 POPUP: Handling OAuth callback URL:', redirectUrl);
      
      // Parse URL hash parameters (format: #access_token=...&refresh_token=...)
      const url = new URL(redirectUrl);
      const hashParams = new URLSearchParams(url.hash.replace('#', ''));
      
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (!accessToken || !refreshToken) {
        console.error('🔐 POPUP: No tokens found in callback URL');
        return { isAuthenticated: false };
      }

      console.log('🔐 POPUP: Tokens found, setting session...');
      
      // Set the session with Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('🔐 POPUP: Failed to set session:', error);
        return { isAuthenticated: false };
      }

      if (data.session) {
        console.log('🔐 POPUP: OAuth session established successfully');
        const authState: AuthState = {
          isAuthenticated: true,
          user: {
            id: data.session.user.id,
            email: data.session.user.email || undefined,
          },
          session: data.session,
        };

        // Store auth state for service worker
        await StorageAuthService.storeAuthState(authState);
        return authState;
      }

      return { isAuthenticated: false };
    } catch (error) {
      console.error('🔐 POPUP: OAuth callback handling failed:', error);
      return { isAuthenticated: false };
    }
  }

  static async handleAuthCallback(): Promise<AuthState> {
    try {
      console.log('🔐 POPUP: Checking for existing session...');
      
      // Check if we're in an OAuth callback or have existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 POPUP: Session check error:', error);
        return { isAuthenticated: false };
      }

      if (session) {
        console.log('🔐 POPUP: Existing session found');
        const authState: AuthState = {
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || undefined,
          },
          session,
        };

        // Store auth state for service worker
        await StorageAuthService.storeAuthState(authState);
        return authState;
      }

      return { isAuthenticated: false };
    } catch (error) {
      console.error('🔐 POPUP: Auth callback handling failed:', error);
      return { isAuthenticated: false };
    }
  }

  // Listen for auth state changes
  static onAuthStateChange(callback: (authState: AuthState) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 POPUP: Auth state changed:', event, session?.user?.email);
      
      let authState: AuthState;
      
      if (session) {
        authState = {
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || undefined,
          },
          session,
        };
        
        // Store for service worker
        await StorageAuthService.storeAuthState(authState);
      } else {
        authState = { isAuthenticated: false };
        await StorageAuthService.clearAuthState();
      }
      
      callback(authState);
    });
  }
}