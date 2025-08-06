import { jest } from '@jest/globals';
import { SideloadingDetector, runSideloadingDiagnostics, isSideloadingReady } from '../sideloadingDetector';

// Mock Office.js
const mockOffice = {
  onReady: jest.fn((callback: any) => {
    callback({ host: 'Word', platform: 'PC', version: '16.0' });
  }),
  HostType: {
    Word: 'Word',
    Excel: 'Excel'
  }
};

// Mock window object
const mockWindow = {
  location: {
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
    origin: 'http://localhost:3000'
  }
};

// Mock document object
const mockDocument = {
  getElementById: jest.fn((id) => {
    if (id === 'container') {
      return { innerHTML: '' };
    }
    return null;
  })
};

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Global mocks
global.window = mockWindow as any;
global.document = mockDocument as any;
global.fetch = mockFetch;

describe('SideloadingDetector', () => {
  let detector: SideloadingDetector;

  beforeEach(() => {
    jest.clearAllMocks();
    detector = SideloadingDetector.getInstance();
    
    // Reset global Office
    (global as any).Office = undefined;
    
    // Reset fetch mock
    mockFetch.mockClear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SideloadingDetector.getInstance();
      const instance2 = SideloadingDetector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Office.js Detection', () => {
    it('should detect when Office.js is not available', async () => {
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isOfficeAvailable).toBe(false);
      expect(status.issues).toContain('Office.js is not available');
    });

    it('should detect when Office.js is available', async () => {
      (global as any).Office = mockOffice;
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isOfficeAvailable).toBe(true);
      expect(status.issues).not.toContain('Office.js is not available');
    });

    it('should detect Word environment', async () => {
      (global as any).Office = mockOffice;
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isWordEnvironment).toBe(true);
    });

    it('should detect non-Word environment', async () => {
      const excelOffice = {
        ...mockOffice,
        onReady: jest.fn((callback: any) => {
          callback({ host: 'Excel', platform: 'PC', version: '16.0' });
        })
      };
      (global as any).Office = excelOffice;
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isWordEnvironment).toBe(false);
      expect(status.issues).toContain('Add-in is not running in Microsoft Word');
    });
  });

  describe('Environment Configuration', () => {
    it('should detect correct localhost configuration', async () => {
      const status = await detector.detectSideloadingIssues();
      
      expect(status.hasProtocolMismatch).toBe(false);
      expect(status.hasPortMismatch).toBe(false);
    });

    it('should detect HTTPS/HTTP mismatch', async () => {
      mockWindow.location.protocol = 'https:';
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.hasProtocolMismatch).toBe(true);
      expect(status.issues).toContain('HTTPS/HTTP protocol mismatch detected');
    });

    it('should detect port mismatch', async () => {
      mockWindow.location.port = '3001';
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.hasPortMismatch).toBe(true);
      expect(status.issues).toContain('Expected port 3000, but running on port 3001');
    });

    it('should detect non-localhost environment', async () => {
      mockWindow.location.hostname = 'example.com';
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.issues).toContain('Not running on localhost - may cause sideloading issues');
    });
  });

  describe('DOM Elements', () => {
    it('should detect when container element exists', async () => {
      mockDocument.getElementById.mockReturnValue({ innerHTML: '' });
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.hasContainerElement).toBe(true);
    });

    it('should detect when container element is missing', async () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.hasContainerElement).toBe(false);
      expect(status.issues).toContain('Container element not found in DOM');
    });
  });

  describe('Server Connectivity', () => {
    it('should detect when server is running', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isServerRunning).toBe(true);
    });

    it('should detect when server is not running', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isServerRunning).toBe(false);
      expect(status.issues).toContain('Local server is not responding');
    });
  });

  describe('Manifest Files', () => {
    it('should detect when all manifest files are accessible', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isManifestValid).toBe(true);
    });

    it('should detect when manifest files are missing', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // index.html
        .mockRejectedValueOnce(new Error('Not found')) // commands.html
        .mockRejectedValueOnce(new Error('Not found')); // icon.svg
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.isManifestValid).toBe(false);
      expect(status.issues).toContain('Manifest file not accessible: commands.html');
      expect(status.issues).toContain('Manifest file not accessible: icon.svg');
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations for missing Office.js', async () => {
      const status = await detector.detectSideloadingIssues();
      
      expect(status.recommendations).toContain(
        'Follow the sideloading instructions at http://localhost:3000/sideload-instructions.html'
      );
    });

    it('should provide recommendations for protocol mismatch', async () => {
      mockWindow.location.protocol = 'https:';
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.recommendations).toContain(
        'Update manifest.xml to use HTTP instead of HTTPS for localhost'
      );
    });

    it('should provide recommendations for port mismatch', async () => {
      mockWindow.location.port = '3001';
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.recommendations).toContain(
        'Ensure the server is running on port 3000'
      );
    });

    it('should provide recommendations for server not running', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.recommendations).toContain(
        'Start the local server: python3 -m http.server 3000 --directory dist'
      );
    });

    it('should provide success message when all checks pass', async () => {
      (global as any).Office = mockOffice;
      mockFetch.mockResolvedValue({ ok: true });
      
      const status = await detector.detectSideloadingIssues();
      
      expect(status.recommendations).toContain(
        'All checks passed! The add-in should load properly in Word.'
      );
    });
  });

  describe('Status Methods', () => {
    it('should return correct ready status when all conditions are met', async () => {
      (global as any).Office = mockOffice;
      mockFetch.mockResolvedValue({ ok: true });
      
      await detector.detectSideloadingIssues();
      
      expect(detector.isReady()).toBe(true);
    });

    it('should return false ready status when conditions are not met', async () => {
      await detector.detectSideloadingIssues();
      
      expect(detector.isReady()).toBe(false);
    });

    it('should provide issues summary', async () => {
      await detector.detectSideloadingIssues();
      
      const summary = detector.getIssuesSummary();
      expect(summary).toContain('Found');
      expect(summary).toContain('issue(s)');
    });

    it('should provide recommendations summary', async () => {
      await detector.detectSideloadingIssues();
      
      const summary = detector.getRecommendationsSummary();
      expect(summary).toContain('sideloading instructions');
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).Office = undefined;
    mockFetch.mockClear();
  });

  describe('runSideloadingDiagnostics', () => {
    it('should run diagnostics and log results', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await runSideloadingDiagnostics();
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Sideloading Diagnostics Results:');
      expect(consoleSpy).toHaveBeenCalledWith('=====================================');
      
      consoleSpy.mockRestore();
    });
  });

  describe('isSideloadingReady', () => {
    it('should return false when not ready', () => {
      expect(isSideloadingReady()).toBe(false);
    });

    it('should return true when ready', async () => {
      (global as any).Office = mockOffice;
      mockFetch.mockResolvedValue({ ok: true });
      
      const detector = SideloadingDetector.getInstance();
      await detector.detectSideloadingIssues();
      
      expect(isSideloadingReady()).toBe(true);
    });
  });
}); 