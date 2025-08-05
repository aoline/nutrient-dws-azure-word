import { ProcessingOptions, NutrientBuildResponse, NutrientViewerResponse, API_ENDPOINTS } from '../types';

export class DocumentService {
  private getApiUrl(endpoint: string): string {
    // In development, use localhost. In production, this would be your Vercel deployment URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://nutrient-dws-vercel-word-l4ew7apzw-matthewms-projects-e3b6e354.vercel.app'
      : 'https://localhost:3001';
    return `${baseUrl}${endpoint}`;
  }

  private async getDocumentAsBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      Office.context.document.getFileAsync(Office.FileType.Compressed, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const file = result.value;
          file.getSliceAsync(0, (sliceResult) => {
            if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
              const slice = sliceResult.value;
              const data = slice.data;
              const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
              file.closeAsync();
              resolve(blob);
            } else {
              file.closeAsync();
              reject(new Error('Failed to get document slice'));
            }
          });
        } else {
          reject(new Error('Failed to get document file'));
        }
      });
    });
  }

  private async uploadToViewer(pdfBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', pdfBlob, 'document.pdf');

          const response = await fetch(this.getApiUrl(API_ENDPOINTS.VIEWER_UPLOAD), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Viewer upload failed: ${response.statusText}`);
    }

    const result: NutrientViewerResponse = await response.json();
    
    if (!result.success || !result.documentId) {
      throw new Error(result.error || 'Failed to upload to viewer');
    }

    return result.documentId;
  }

  async exportToPDF(options: ProcessingOptions): Promise<NutrientBuildResponse> {
    try {
      // Get the current document as a blob
      const documentBlob = await this.getDocumentAsBlob();
      
      // Prepare the request
      const formData = new FormData();
      formData.append('file', documentBlob, 'document.docx');
      
      // Add processing instructions
      const instructions = {
        format: options.format || 'pdf',
        ocr: options.ocr || false,
        redact: options.redact || false,
        stripMetadata: options.stripMetadata || false,
      };
      
      formData.append('instructions', JSON.stringify(instructions));

      // Call the API
      const response = await fetch(this.getApiUrl(API_ENDPOINTS.BUILD), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create a URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Upload to viewer for embedding
      let viewerUrl: string | null = null;
      try {
        const documentId = await this.uploadToViewer(pdfBlob);
        viewerUrl = `https://viewer.nutrient.io/documents/${documentId}`;
      } catch (viewerError) {
        console.warn('Failed to upload to viewer:', viewerError);
        // Continue without viewer - user can still download the PDF
      }

      return {
        success: true,
        pdfUrl,
        viewerUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async importFromPDF(file: File, options: ProcessingOptions): Promise<NutrientBuildResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const instructions = {
        action: 'import',
        format: 'docx',
        ocr: options.ocr || false,
        ...options,
      };
      
      formData.append('instructions', JSON.stringify(instructions));

      const response = await fetch(this.getApiUrl(API_ENDPOINTS.BUILD), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const docxBlob = await response.blob();
      
      // Insert the imported content into the current document
      await this.insertDocumentContent(docxBlob);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async redactDocument(options: ProcessingOptions): Promise<NutrientBuildResponse> {
    try {
      const documentBlob = await this.getDocumentAsBlob();
      
      const formData = new FormData();
      formData.append('file', documentBlob, 'document.docx');
      
      const instructions = {
        action: 'redact',
        format: 'pdf',
        redact: true,
        stripMetadata: options.stripMetadata || true,
        ...options,
      };
      
      formData.append('instructions', JSON.stringify(instructions));

      const response = await fetch(this.getApiUrl(API_ENDPOINTS.BUILD), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Redaction failed: ${response.statusText}`);
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Upload to viewer
      let viewerUrl: string | null = null;
      try {
        const documentId = await this.uploadToViewer(pdfBlob);
        viewerUrl = `https://viewer.nutrient.io/documents/${documentId}`;
      } catch (viewerError) {
        console.warn('Failed to upload to viewer:', viewerError);
      }

      return {
        success: true,
        pdfUrl,
        viewerUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async insertDocumentContent(docxBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      // Convert blob to text (simplified - in reality you'd need to parse DOCX)
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        
        Office.context.document.setSelectedDataAsync(text, {
          coercionType: Office.CoercionType.Text,
        }, (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            reject(new Error('Failed to insert content'));
          }
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(docxBlob);
    });
  }

  downloadPDF(pdfUrl: string, filename: string = 'document.pdf'): void {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 