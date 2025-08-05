// Office.js types
declare global {
  interface Window {
    Office: any;
  }
}

// API Response types
export interface NutrientBuildResponse {
  success: boolean;
  pdfUrl?: string;
  documentId?: string;
  error?: string;
}

export interface NutrientViewerResponse {
  success: boolean;
  documentId?: string;
  viewerUrl?: string;
  error?: string;
}

// Document processing options
export interface ProcessingOptions {
  format?: 'pdf-a' | 'pdf-ua' | 'pdf';
  ocr?: boolean;
  redact?: boolean;
  stripMetadata?: boolean;
}

// UI State types
export interface AppState {
  isLoading: boolean;
  currentTab: 'export' | 'import' | 'redact';
  status: {
    type: 'success' | 'error' | 'info' | null;
    message: string;
  };
  pdfUrl: string | null;
  viewerUrl: string | null;
}

// Azure Function endpoints
export const API_ENDPOINTS = {
  BUILD: '/api/build',
  VIEWER_UPLOAD: '/api/viewer-upload',
} as const; 