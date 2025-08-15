// Type definitions for SMC Extension

export interface DetectedSREF {
  code: string;
  element: HTMLElement;
  images: string[];
  isKnown: boolean;
  timestamp: number;
}

export interface ProcessedElement {
  element: HTMLElement;
  state: 'spinner' | 'save-button' | 'saved-check';
  srefCode: string;
  isInViewport: boolean;
}