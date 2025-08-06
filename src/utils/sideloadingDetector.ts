export interface SideloadingStatus {
  isOfficeAvailable: boolean;
  isWordEnvironment: boolean;
  isServerRunning: boolean;
  isManifestValid: boolean;
  hasProtocolMismatch: boolean;
  hasPortMismatch: boolean;
  hasContainerElement: boolean;
  issues: string[];
  recommendations: string[];
}

export interface ManifestValidationResult {
  indexHtml: boolean;
  commandsHtml: boolean;
  iconSvg: boolean;
  allValid: boolean;
}

export class SideloadingDetector {
  private static instance: SideloadingDetector;
  private status: SideloadingStatus;

  private constructor() {
    this.status = this.initializeStatus();
  }

  public static getInstance(): SideloadingDetector {
    if (!SideloadingDetector.instance) {
      SideloadingDetector.instance = new SideloadingDetector();
    }
    return SideloadingDetector.instance;
  }

  private initializeStatus(): SideloadingStatus {
    return {
      isOfficeAvailable: false,
      isWordEnvironment: false,
      isServerRunning: false,
      isManifestValid: false,
      hasProtocolMismatch: false,
      hasPortMismatch: false,
      hasContainerElement: false,
      issues: [],
      recommendations: []
    };
  }

  public async detectSideloadingIssues(): Promise<SideloadingStatus> {
    this.status = this.initializeStatus();
    
    // Check Office.js availability
    this.checkOfficeAvailability();
    
    // Check environment configuration
    this.checkEnvironmentConfiguration();
    
    // Check DOM elements
    this.checkDOMElements();
    
    // Check server connectivity
    await this.checkServerConnectivity();
    
    // Check manifest files
    await this.checkManifestFiles();
    
    // Generate recommendations
    this.generateRecommendations();
    
    return this.status;
  }

  private checkOfficeAvailability(): void {
    this.status.isOfficeAvailable = typeof Office !== 'undefined';
    
    if (!this.status.isOfficeAvailable) {
      this.status.issues.push('Office.js is not available');
      return;
    }

    // Check if we're in a Word environment
    try {
      Office.onReady((info) => {
        this.status.isWordEnvironment = info.host === Office.HostType.Word;
        if (!this.status.isWordEnvironment) {
          this.status.issues.push('Add-in is not running in Microsoft Word');
        }
      });
    } catch (error) {
      this.status.issues.push('Failed to initialize Office.js');
    }
  }

  private checkEnvironmentConfiguration(): void {
    const currentProtocol = window.location.protocol;
    const currentHostname = window.location.hostname;
    const currentPort = window.location.port;

    // Check for HTTPS/HTTP mismatch
    if (currentProtocol === 'https:' && currentHostname === 'localhost') {
      this.status.hasProtocolMismatch = true;
      this.status.issues.push('HTTPS/HTTP protocol mismatch detected');
    }

    // Check for port configuration
    if (currentPort !== '3000') {
      this.status.hasPortMismatch = true;
      this.status.issues.push(`Expected port 3000, but running on port ${currentPort}`);
    }

    // Check for localhost environment
    if (currentHostname !== 'localhost') {
      this.status.issues.push('Not running on localhost - may cause sideloading issues');
    }
  }

  private checkDOMElements(): void {
    const container = document.getElementById('container');
    this.status.hasContainerElement = container !== null;
    
    if (!this.status.hasContainerElement) {
      this.status.issues.push('Container element not found in DOM');
    }
  }

  private async checkServerConnectivity(): Promise<void> {
    try {
      const response = await fetch(window.location.origin, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      this.status.isServerRunning = true;
    } catch (error) {
      this.status.isServerRunning = false;
      this.status.issues.push('Local server is not responding');
    }
  }

  private async checkManifestFiles(): Promise<void> {
    const manifestFiles = [
      { name: 'index.html', url: '/index.html' },
      { name: 'commands.html', url: '/commands.html' },
      { name: 'icon.svg', url: '/assets/icon.svg' }
    ];

    const results = await Promise.all(
      manifestFiles.map(async (file) => {
        try {
          const response = await fetch(file.url, { method: 'HEAD' });
          return { name: file.name, accessible: response.ok };
        } catch {
          return { name: file.name, accessible: false };
        }
      })
    );

    const allValid = results.every(result => result.accessible);
    this.status.isManifestValid = allValid;

    results.forEach(result => {
      if (!result.accessible) {
        this.status.issues.push(`Manifest file not accessible: ${result.name}`);
      }
    });
  }

  private generateRecommendations(): void {
    this.status.recommendations = [];

    if (!this.status.isOfficeAvailable) {
      this.status.recommendations.push(
        'Follow the sideloading instructions at http://localhost:3000/sideload-instructions.html'
      );
    }

    if (this.status.hasProtocolMismatch) {
      this.status.recommendations.push(
        'Update manifest.xml to use HTTP instead of HTTPS for localhost'
      );
    }

    if (this.status.hasPortMismatch) {
      this.status.recommendations.push(
        'Ensure the server is running on port 3000'
      );
    }

    if (!this.status.isServerRunning) {
      this.status.recommendations.push(
        'Start the local server: python3 -m http.server 3000 --directory dist'
      );
    }

    if (!this.status.isManifestValid) {
      this.status.recommendations.push(
        'Check that all manifest files are present in the dist directory'
      );
    }

    if (this.status.issues.length === 0) {
      this.status.recommendations.push(
        'All checks passed! The add-in should load properly in Word.'
      );
    }
  }

  public getStatus(): SideloadingStatus {
    return { ...this.status };
  }

  public isReady(): boolean {
    return this.status.isOfficeAvailable && 
           this.status.isWordEnvironment && 
           this.status.isServerRunning && 
           this.status.isManifestValid &&
           this.status.hasContainerElement &&
           this.status.issues.length === 0;
  }

  public getIssuesSummary(): string {
    if (this.status.issues.length === 0) {
      return '✅ All sideloading checks passed';
    }
    
    return `❌ Found ${this.status.issues.length} issue(s):\n${this.status.issues.join('\n')}`;
  }

  public getRecommendationsSummary(): string {
    if (this.status.recommendations.length === 0) {
      return 'No recommendations available';
    }
    
    return this.status.recommendations.join('\n');
  }
}

// Utility function to run detection and log results
export async function runSideloadingDiagnostics(): Promise<void> {
  const detector = SideloadingDetector.getInstance();
  const status = await detector.detectSideloadingIssues();
  
  console.log('🔍 Sideloading Diagnostics Results:');
  console.log('=====================================');
  console.log(`Office.js Available: ${status.isOfficeAvailable ? '✅' : '❌'}`);
  console.log(`Word Environment: ${status.isWordEnvironment ? '✅' : '❌'}`);
  console.log(`Server Running: ${status.isServerRunning ? '✅' : '❌'}`);
  console.log(`Manifest Valid: ${status.isManifestValid ? '✅' : '❌'}`);
  console.log(`Container Element: ${status.hasContainerElement ? '✅' : '❌'}`);
  console.log(`Protocol Mismatch: ${status.hasProtocolMismatch ? '❌' : '✅'}`);
  console.log(`Port Mismatch: ${status.hasPortMismatch ? '❌' : '✅'}`);
  
  if (status.issues.length > 0) {
    console.log('\n❌ Issues Found:');
    status.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (status.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    status.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  console.log(`\n🎯 Overall Status: ${detector.isReady() ? 'READY' : 'NEEDS ATTENTION'}`);
}

// Export a simple function to check if sideloading is ready
export function isSideloadingReady(): boolean {
  return SideloadingDetector.getInstance().isReady();
} 