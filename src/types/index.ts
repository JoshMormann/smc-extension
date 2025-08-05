// Shared types for the SREF Mining Extension

export interface SREFCode {
  id?: string;
  title: string;
  code_value: string;
  sv_version: 4 | 6;
  images: SREFImage[];
  tags: string[];
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SREFImage {
  id?: string;
  image_url: string;
  position: number;
}

export interface MidJourneyResult {
  srefCode: string;
  images: string[];
  prompt?: string;
  messageId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email?: string;
  };
  session?: any;
}

export interface ExtensionMessage {
  type: 'SREF_DETECTED' | 'SAVE_SREF' | 'AUTH_STATUS' | 'GET_AUTH_STATUS';
  data?: any;
}

export interface SaveSREFRequest {
  title: string;
  srefCode: string;
  images: string[];
  tags: string[];
  svVersion: 4 | 6;
}

// Chrome extension specific types
export interface DetectedSREF extends MidJourneyResult {
  element: HTMLElement;
  timestamp: number;
}