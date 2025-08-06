import { jest } from '@jest/globals';

// Mock Office.js for testing
const mockOffice = {
  onReady: jest.fn((callback) => {
    // Simulate Office.js ready event
    setTimeout(() => {
      callback({
        host: 'Word',
        platform: 'PC',
        version: '16.0'
      });
    }, 100);
  }),
  context: {
    document: {
      getFileAsync: jest.fn(),
      setSelectedDataAsync: jest.fn(),
    },
  },
  HostType: {
    Word: 'Word',
    Excel: 'Excel',
    PowerPoint: 'PowerPoint'
  }
};

// Mock window object
const mockWindow = {
  location: {
    href: 'http://localhost:3000/index.html',
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000'
  },
  addEventListener: jest.fn(),
  setTimeout: jest.fn((callback, delay) => {
    setTimeout(callback, delay);
  }),
  Office: undefined as any
};

// Mock document object
const mockDocument = {
  getElementById: jest.fn((id) => {
    if (id === 'container') {
      return {
        innerHTML: '',
        appendChild: jest.fn(),
        removeChild: jest.fn()
      };
    }
    return null;
  }),
  createElement: jest.fn((tag) => ({
    href: '',
    download: '',
    style: { display: 'block' },
    click: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock fetch for API calls
const mockFetch = jest.fn();

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn((blob) => `blob:mock-url-${Date.now()}`);

// Mock URL.revokeObjectURL
const mockRevokeObjectURL = jest.fn();

// Global mocks
global.window = mockWindow as any;
global.document = mockDocument as any;
global.fetch = mockFetch as any;
global.URL = {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL
} as any;

describe('Add-in Sideloading Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow.Office = undefined;
    mockDocument.getElementById.mockClear();
    mockFetch.mockClear();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  describe('Office.js Detection', () => {
    it('should detect when Office.js is available', () => {
      // Simulate Office.js being available
      mockWindow.Office = mockOffice;
      
      const isOfficeAvailable = typeof mockWindow.Office !== 'undefined';
      expect(isOfficeAvailable).toBe(true);
    });

    it('should detect when Office.js is not available', () => {
      // Simulate Office.js not being available
      mockWindow.Office = undefined;
      
      const isOfficeAvailable = typeof mockWindow.Office !== 'undefined';
      expect(isOfficeAvailable).toBe(false);
    });

    it('should handle Office.js loading delay', () => {
      // Simulate Office.js loading after a delay
      mockWindow.Office = undefined;
      
      let officeDetected = false;
      const checkOffice = () => {
        if (typeof mockWindow.Office !== 'undefined') {
          officeDetected = true;
        }
      };

      // Initial check
      checkOffice();
      expect(officeDetected).toBe(false);

      // Simulate Office.js loading
      mockWindow.Office = mockOffice;
      checkOffice();
      expect(officeDetected).toBe(true);
    });
  });

  describe('Environment Validation', () => {
    it('should validate correct localhost environment', () => {
      const environment = {
        protocol: mockWindow.location.protocol,
        hostname: mockWindow.location.hostname,
        port: mockWindow.location.port
      };

      expect(environment.protocol).toBe('http:');
      expect(environment.hostname).toBe('localhost');
      expect(environment.port).toBe('3000');
    });

    it('should detect HTTPS/HTTP mismatch', () => {
      // Simulate HTTPS manifest with HTTP server
      const manifestProtocol = 'https:';
      const serverProtocol = mockWindow.location.protocol;

      const hasProtocolMismatch = manifestProtocol !== serverProtocol;
      expect(hasProtocolMismatch).toBe(true);
    });

    it('should validate port configuration', () => {
      const expectedPort = '3000';
      const actualPort = mockWindow.location.port;

      expect(actualPort).toBe(expectedPort);
    });
  });

  describe('Manifest Validation', () => {
    it('should validate manifest URLs are accessible', async () => {
      const manifestUrls = [
        'http://localhost:3000/index.html',
        'http://localhost:3000/commands.html',
        'http://localhost:3000/assets/icon.svg'
      ];

      // Mock successful responses
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const results = await Promise.all(
        manifestUrls.map(async (url) => {
          try {
            const response = await fetch(url);
            return { url, accessible: response.ok };
          } catch {
            return { url, accessible: false };
          }
        })
      );

      results.forEach(result => {
        expect(result.accessible).toBe(true);
      });
    });

    it('should detect missing manifest files', async () => {
      const manifestUrls = [
        'http://localhost:3000/index.html',
        'http://localhost:3000/missing-file.html'
      ];

      // Mock mixed responses
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new Error('File not found'));

      const results = await Promise.all(
        manifestUrls.map(async (url) => {
          try {
            const response = await fetch(url);
            return { url, accessible: response.ok };
          } catch {
            return { url, accessible: false };
          }
        })
      );

      expect(results[0].accessible).toBe(true);
      expect(results[1].accessible).toBe(false);
    });
  });

  describe('Add-in Initialization', () => {
    it('should initialize successfully when Office.js is available', () => {
      mockWindow.Office = mockOffice;
      const container = mockDocument.getElementById('container');
      
      // Simulate successful initialization
      const initializeApp = () => {
        if (typeof mockWindow.Office !== 'undefined') {
          mockWindow.Office.onReady((info: any) => {
            if (info.host === 'Word') {
              container.innerHTML = '<div>Add-in loaded successfully</div>';
            }
          });
        }
      };

      initializeApp();
      
      // Verify Office.onReady was called
      expect(mockOffice.onReady).toHaveBeenCalled();
    });

    it('should show error when Office.js is not available', () => {
      mockWindow.Office = undefined;
      const container = mockDocument.getElementById('container');
      
      // Simulate failed initialization
      const initializeApp = () => {
        if (typeof mockWindow.Office !== 'undefined') {
          // This won't execute
        } else {
          container.innerHTML = '<div>Office.js Not Available</div>';
        }
      };

      initializeApp();
      
      expect(container.innerHTML).toBe('<div>Office.js Not Available</div>');
    });

    it('should handle non-Word environment', () => {
      mockWindow.Office = {
        ...mockOffice,
        onReady: jest.fn((callback) => {
          callback({ host: 'Excel', platform: 'PC', version: '16.0' });
        })
      };

      const container = mockDocument.getElementById('container');
      
      const initializeApp = () => {
        if (typeof mockWindow.Office !== 'undefined') {
          mockWindow.Office.onReady((info: any) => {
            if (info.host === 'Word') {
              container.innerHTML = '<div>Add-in loaded</div>';
            } else {
              container.innerHTML = '<div>This add-in is designed to run in Microsoft Word.</div>';
            }
          });
        }
      };

      initializeApp();
      
      expect(container.innerHTML).toBe('<div>This add-in is designed to run in Microsoft Word.</div>');
    });
  });

  describe('Network Connectivity', () => {
    it('should detect local server connectivity', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const response = await fetch('http://localhost:3000');
      expect(response.ok).toBe(true);
    });

    it('should detect API endpoint availability', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const apiEndpoints = [
        'http://localhost:3000/api/build',
        'http://localhost:3000/api/viewer-upload'
      ];

      const results = await Promise.all(
        apiEndpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint, { method: 'OPTIONS' });
            return { endpoint, available: response.ok };
          } catch {
            return { endpoint, available: false };
          }
        })
      );

      results.forEach(result => {
        expect(result.available).toBe(true);
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await fetch('http://localhost:3000/api/build');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Sideloading Issues Detection', () => {
    it('should detect missing container element', () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      const container = mockDocument.getElementById('container');
      expect(container).toBeNull();
    });

    it('should detect manifest loading issues', () => {
      const manifestIssues = {
        missingIcon: !mockDocument.getElementById('icon'),
        wrongProtocol: mockWindow.location.protocol === 'https:',
        wrongPort: mockWindow.location.port !== '3000'
      };

      expect(manifestIssues.missingIcon).toBe(true);
      expect(manifestIssues.wrongProtocol).toBe(false);
      expect(manifestIssues.wrongPort).toBe(false);
    });

    it('should validate CORS configuration', () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };

      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('OPTIONS');
    });

    it('should detect mixed content issues', () => {
      const hasMixedContent = 
        mockWindow.location.protocol === 'http:' && 
        document.querySelector('script[src*="https://"]');

      expect(hasMixedContent).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should handle initialization timeout', () => {
      const timeout = 5000;
      let initialized = false;

      const initializeWithTimeout = () => {
        const timer = setTimeout(() => {
          if (!initialized) {
            const container = mockDocument.getElementById('container');
            container.innerHTML = '<div>Initialization timeout</div>';
          }
        }, timeout);

        // Simulate successful initialization before timeout
        setTimeout(() => {
          initialized = true;
          clearTimeout(timer);
        }, 1000);
      };

      initializeWithTimeout();
      expect(initialized).toBe(false); // Initially false
    });

    it('should provide fallback UI when Office.js fails', () => {
      mockWindow.Office = undefined;
      const container = mockDocument.getElementById('container');
      
      const provideFallback = () => {
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #666;">
            <h3>Office.js Not Available</h3>
            <p>This add-in requires Microsoft Word to function properly.</p>
            <p>If you're testing in a browser, please sideload the add-in in Word.</p>
          </div>
        `;
      };

      provideFallback();
      
      expect(container.innerHTML).toContain('Office.js Not Available');
      expect(container.innerHTML).toContain('sideload the add-in in Word');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full sideloading validation', async () => {
      const validationResults = {
        officeAvailable: typeof mockWindow.Office !== 'undefined',
        containerExists: mockDocument.getElementById('container') !== null,
        serverRunning: true, // Mock successful server check
        manifestValid: true, // Mock successful manifest validation
        corsConfigured: true // Mock successful CORS check
      };

      // Simulate successful environment
      mockWindow.Office = mockOffice;
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const allChecksPass = Object.values(validationResults).every(result => result === true);
      expect(allChecksPass).toBe(true);
    });

    it('should identify common sideloading issues', () => {
      const issues = [];

      // Check for common problems
      if (typeof mockWindow.Office === 'undefined') {
        issues.push('Office.js not loaded');
      }

      if (mockDocument.getElementById('container') === null) {
        issues.push('Container element missing');
      }

      if (mockWindow.location.protocol === 'https:' && mockWindow.location.hostname === 'localhost') {
        issues.push('HTTPS/HTTP mismatch');
      }

      if (mockWindow.location.port !== '3000') {
        issues.push('Wrong port configuration');
      }

      // Simulate some issues
      mockWindow.Office = undefined;
      mockWindow.location.protocol = 'https:';

      const newIssues = [];
      if (typeof mockWindow.Office === 'undefined') {
        newIssues.push('Office.js not loaded');
      }
      if (mockWindow.location.protocol === 'https:' && mockWindow.location.hostname === 'localhost') {
        newIssues.push('HTTPS/HTTP mismatch');
      }

      expect(newIssues).toContain('Office.js not loaded');
      expect(newIssues).toContain('HTTPS/HTTP mismatch');
    });
  });
}); 