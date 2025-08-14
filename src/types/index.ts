// Core types for SMC Extension

export interface DetectedSREF {
  code: string;
  element: HTMLElement;
  images: string[];
  isKnown: boolean;
  timestamp: number;
  isProcessed: boolean;
  isVisible: boolean;
}

export interface ScannerState {
  processedElements: Set<HTMLElement>;
  scrollDebounceTimer: number;
  userSavedCodes: Set<string>;
  isAuthenticated: boolean;
  isProcessing: boolean;
}

export interface SaveSREFRequest {
  code: string;
  name: string;
  images: string[];
  userId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email?: string | undefined;
  } | undefined;
  session?: any;
}

export interface ExtensionMessage {
  type: 'SREF_DETECTED' | 'SAVE_SREF' | 'AUTH_STATUS' | 'GET_AUTH_STATUS' | 'TRANSFER_SESSION' | 'TEST_CONNECTION';
  data?: any;
}

export interface SREFIndicator {
  element: HTMLElement;
  srefCode: string;
  isKnown: boolean;
  isVisible: boolean;
}
