import { API_ENDPOINTS } from '../types';

export interface ConversionResult {
  success: boolean;
  documentToken?: string;
  error?: string;
  details?: string;
}

export class DocumentService {
  private static getApiUrl(endpoint: string): string {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://nutrient-dws-vercel-word-l4ew7apzw-matthewms-projects-e3b6e354.vercel.app'
      : 'http://localhost:3000'; // Changed from https to http
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Convert document to PDF using the Express.js backend
   */
  static async convertDocument(file: File, options: any = {}): Promise<ConversionResult> {
    try {
      // Get the document file from Office.js
      const documentFile = await this.getDocumentFile();
      
      // Create FormData for the request
      const formData = new FormData();
      formData.append('file', documentFile, 'document.docx');

      // Make request to Express.js backend
      const response = await fetch(this.getApiUrl('/convert'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.documentToken) {
        return {
          success: true,
          documentToken: result.documentToken
        };
      } else {
        throw new Error('Conversion failed: No document token received');
      }

    } catch (error: any) {
      console.error('Document conversion error:', error);
      return {
        success: false,
        error: error.message || 'Document conversion failed',
        details: error.details || error.toString()
      };
    }
  }

  /**
   * Get document file from Office.js
   */
  private static async getDocumentFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      Office.context.document.getFileAsync(Office.FileType.Compressed, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const file = result.value;
          file.getSliceAsync(0, (sliceResult) => {
            if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
              const slice = sliceResult.value;
              const data = slice.data;
              
              // Convert to Blob and then to File
              const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
              const fileObj = new File([blob], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
              
              resolve(fileObj);
            } else {
              reject(new Error('Failed to get document slice'));
            }
          });
        } else {
          reject(new Error('Failed to get document file'));
        }
      });
    });
  }

  /**
   * Get viewer URL for the converted document
   */
  static getViewerUrl(documentToken: string): string {
    return `https://dws-viewer.nutrient-powered.io/view/${documentToken}`;
  }

  /**
   * Get download URL for the converted document
   */
  static getDownloadUrl(documentToken: string): string {
    return `https://dws-viewer.nutrient-powered.io/download/${documentToken}`;
  }

  /**
   * Legacy method for backward compatibility
   */
  static async exportToPDF(format: string = 'pdf'): Promise<{ success: boolean; pdfUrl?: string; viewerUrl?: string; error?: string }> {
    try {
      const result = await this.convertDocument(new File([], 'document.docx'));
      
      if (result.success && result.documentToken) {
        const viewerUrl = this.getViewerUrl(result.documentToken);
        const downloadUrl = this.getDownloadUrl(result.documentToken);
        
        // Create a blob URL for download
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        
        return {
          success: true,
          pdfUrl,
          viewerUrl
        };
      } else {
        return {
          success: false,
          error: result.error || 'PDF export failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'PDF export failed'
      };
    }
  }

  /**
   * Download PDF with proper cleanup
   */
  static async downloadPDF(pdfUrl: string, filename: string): Promise<void> {
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download PDF');
    }
  }
} 