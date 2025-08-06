import { DocumentService } from '../DocumentService';

// Mock Office.js
const mockOffice = {
  context: {
    document: {
      getFileAsync: jest.fn(),
      setSelectedDataAsync: jest.fn(),
    },
  },
};

// Mock fetch
const mockFetch = jest.fn();

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');

// Setup global mocks
Object.defineProperty(window, 'Office', {
  value: mockOffice,
  writable: true,
});

Object.defineProperty(window, 'fetch', {
  value: mockFetch,
  writable: true,
});

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = new DocumentService();
    jest.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('should successfully export document to PDF', async () => {
      // Mock successful Office.js response
      const mockFile = {
        getSliceAsync: jest.fn((callback) => {
          callback({
            status: 'succeeded',
            value: {
              data: new ArrayBuffer(8),
            },
          });
        }),
        closeAsync: jest.fn(),
      };

      mockOffice.context.document.getFileAsync.mockImplementation((callback) => {
        callback({
          status: 'succeeded',
          value: mockFile,
        });
      });

      // Mock successful API response
      const mockPdfBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockPdfBlob),
      });

      // Mock successful viewer upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          documentId: 'doc123',
        }),
      });

      const result = await documentService.exportToPDF({
        format: 'pdf',
        ocr: false,
      });

      expect(result.success).toBe(true);
      expect(result.pdfUrl).toBe('blob:mock-url');
      expect(result.viewerUrl).toBe('https://viewer.nutrient.io/documents/doc123');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockPdfBlob);
    });

    it('should handle API errors gracefully', async () => {
      // Mock successful Office.js response
      const mockFile = {
        getSliceAsync: jest.fn((callback) => {
          callback({
            status: 'succeeded',
            value: {
              data: new ArrayBuffer(8),
            },
          });
        }),
        closeAsync: jest.fn(),
      };

      mockOffice.context.document.getFileAsync.mockImplementation((callback) => {
        callback({
          status: 'succeeded',
          value: mockFile,
        });
      });

      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const result = await documentService.exportToPDF({
        format: 'pdf',
        ocr: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API call failed');
    });

    it('should handle Office.js errors gracefully', async () => {
      // Mock Office.js error
      mockOffice.context.document.getFileAsync.mockImplementation((callback) => {
        callback({
          status: 'failed',
        });
      });

      const result = await documentService.exportToPDF({
        format: 'pdf',
        ocr: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get document file');
    });
  });

  describe('downloadPDF', () => {
    it('should create download link with correct attributes', () => {
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };

      // Mock document methods
      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => mockLink),
        writable: true,
      });

      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      });

      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      });

      const pdfUrl = 'blob:mock-pdf-url';
      const filename = 'test-document.pdf';

      documentService.downloadPDF(pdfUrl, filename);

      expect(mockLink.href).toBe(pdfUrl);
      expect(mockLink.download).toBe(filename);
      expect(mockLink.style.display).toBe('none');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('getApiUrl', () => {
    it('should return correct URL for development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Access private method through any
      const result = (documentService as any).getApiUrl('/api/test');

      expect(result).toBe('https://localhost:3000/api/test');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return correct URL for production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Access private method through any
      const result = (documentService as any).getApiUrl('/api/test');

      expect(result).toContain('vercel.app/api/test');

      process.env.NODE_ENV = originalEnv;
    });
  });
}); 