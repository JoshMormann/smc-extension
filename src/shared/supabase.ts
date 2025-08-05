import { createClient } from '@supabase/supabase-js';
import { SREFCode, AuthState } from '../types';

// These will need to be configured with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Authentication service for the extension
 */
export class AuthService {
  static async getAuthState(): Promise<AuthState> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error);
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
        } : undefined,
        session,
      };
    } catch (error) {
      console.error('Failed to get auth state:', error);
      return { isAuthenticated: false };
    }
  }

  static async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  static async signOut() {
    return await supabase.auth.signOut();
  }

  static async signInWithOAuth(provider: 'google' | 'discord') {
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: chrome.runtime.getURL('popup.html'),
      },
    });
  }
}

/**
 * SREF management service
 */
export class SREFService {
  static async saveSREF(srefData: Omit<SREFCode, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const authState = await AuthService.getAuthState();
      
      if (!authState.isAuthenticated || !authState.user) {
        throw new Error('User must be authenticated to save SREF codes');
      }

      // First, save the SREF code
      const { data: srefCode, error: srefError } = await supabase
        .from('sref_codes')
        .insert({
          title: srefData.title,
          code_value: srefData.code_value,
          sv_version: srefData.sv_version,
          user_id: authState.user.id,
        })
        .select()
        .single();

      if (srefError || !srefCode) {
        throw new Error(`Failed to save SREF code: ${srefError?.message}`);
      }

      // Then save the images
      if (srefData.images.length > 0) {
        const imageInserts = srefData.images.map((image, index) => ({
          sref_code_id: srefCode.id,
          image_url: image.image_url,
          position: index,
        }));

        const { error: imagesError } = await supabase
          .from('code_images')
          .insert(imageInserts);

        if (imagesError) {
          console.warn('Failed to save some images:', imagesError);
        }
      }

      // Finally, save the tags
      if (srefData.tags.length > 0) {
        const tagInserts = srefData.tags.map(tag => ({
          sref_code_id: srefCode.id,
          tag_name: tag,
        }));

        const { error: tagsError } = await supabase
          .from('code_tags')
          .insert(tagInserts);

        if (tagsError) {
          console.warn('Failed to save some tags:', tagsError);
        }
      }

      return { success: true, data: srefCode };
    } catch (error) {
      console.error('Failed to save SREF:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getUserSREFs(userId: string) {
    const { data, error } = await supabase
      .from('sref_codes')
      .select(`
        *,
        code_images(*),
        code_tags(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch SREF codes: ${error.message}`);
    }

    return data;
  }
}