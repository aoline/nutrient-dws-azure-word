# Sideloading Detection System

## Overview

The Sideloading Detection System is a comprehensive testing and diagnostic tool designed to identify and resolve issues that prevent the MS Word Add-in from loading properly. It provides real-time feedback about the add-in's environment and offers specific recommendations for fixing common sideloading problems.

## 🎯 What It Detects

### 1. **Office.js Availability**
- ✅ Detects when Office.js library is loaded
- ❌ Identifies when Office.js is missing (browser environment)
- 🔄 Handles delayed Office.js loading

### 2. **Word Environment Detection**
- ✅ Confirms the add-in is running in Microsoft Word
- ❌ Detects when running in other Office applications (Excel, PowerPoint)
- 🎯 Ensures proper host application

### 3. **Server Connectivity**
- ✅ Verifies local HTTP server is running on port 3000
- ❌ Detects server not responding
- 🌐 Tests network connectivity to local endpoints

### 4. **Manifest File Validation**
- ✅ Checks all required manifest files are accessible:
  - `index.html` - Main add-in page
  - `commands.html` - Add-in commands
  - `assets/icon.svg` - Add-in icon
- ❌ Identifies missing or inaccessible files

### 5. **Environment Configuration**
- ✅ Validates correct localhost setup
- ❌ Detects HTTPS/HTTP protocol mismatches
- 🔧 Identifies wrong port configurations
- 🌍 Checks for non-localhost environments

### 6. **DOM Element Availability**
- ✅ Confirms container element exists
- ❌ Detects missing DOM elements
- 🏗️ Validates page structure

## 🚀 How to Use

### 1. **Automatic Detection (Recommended)**

The detection system is automatically integrated into the add-in initialization:

```typescript
// In src/index.tsx
import { runSideloadingDiagnostics } from './utils/sideloadingDetector';

const initializeApp = () => {
  // Run diagnostics in development mode
  if (process.env.NODE_ENV === 'development') {
    runSideloadingDiagnostics();
  }
  // ... rest of initialization
};
```

### 2. **Manual Detection**

You can manually run diagnostics at any time:

```typescript
import { SideloadingDetector } from './utils/sideloadingDetector';

const detector = SideloadingDetector.getInstance();
const status = await detector.detectSideloadingIssues();

console.log('Issues:', status.issues);
console.log('Recommendations:', status.recommendations);
console.log('Ready:', detector.isReady());
```

### 3. **Quick Status Check**

For a simple ready/not-ready check:

```typescript
import { isSideloadingReady } from './utils/sideloadingDetector';

if (isSideloadingReady()) {
  console.log('✅ Add-in is ready to load');
} else {
  console.log('❌ Add-in needs attention');
}
```

## 📊 Test Results

### Example Output

```
🔍 Sideloading Diagnostics Results:
=====================================
Office.js Available: ❌
Word Environment: ❌
Server Running: ✅
Manifest Valid: ✅
Container Element: ✅
Protocol Mismatch: ✅
Port Mismatch: ✅

❌ Issues Found:
  - Office.js is not available

💡 Recommendations:
  - Follow the sideloading instructions at http://localhost:3000/sideload-instructions.html

🎯 Overall Status: NEEDS ATTENTION
```

## 🔧 Common Issues & Solutions

### Issue 1: "Office.js is not available"
**Cause:** Add-in is running in a regular browser instead of Word
**Solution:** 
- Follow the sideloading instructions at `http://localhost:3000/sideload-instructions.html`
- Use the manual sideloading process in Word

### Issue 2: "HTTPS/HTTP protocol mismatch"
**Cause:** Manifest.xml uses HTTPS but server runs HTTP
**Solution:**
- Update `manifest.xml` to use `http://localhost:3000` instead of `https://localhost:3000`
- Restart the development server

### Issue 3: "Expected port 3000, but running on port 3001"
**Cause:** Server is running on wrong port
**Solution:**
- Start server on port 3000: `python3 -m http.server 3000 --directory dist`
- Update manifest.xml if using different port

### Issue 4: "Manifest file not accessible"
**Cause:** Required files are missing from dist directory
**Solution:**
- Ensure all files are built: `npm run build`
- Check that `dist/` contains: `index.html`, `commands.html`, `assets/icon.svg`

### Issue 5: "Local server is not responding"
**Cause:** HTTP server is not running
**Solution:**
- Start the server: `python3 -m http.server 3000 --directory dist`
- Check for port conflicts

## 🧪 Testing the Detection System

### Run the Test Suite

```bash
# Run the comprehensive test scenarios
node test-sideloading-detection.js
```

### Test Scenarios Covered

1. **Browser Environment** - Expected behavior when testing in browser
2. **HTTPS/HTTP Mismatch** - Protocol configuration issues
3. **Wrong Port Configuration** - Server port mismatches
4. **Missing Manifest Files** - Incomplete build artifacts
5. **Server Not Running** - Network connectivity issues
6. **Perfect Environment** - All conditions met

### Expected Test Results

```
🧪 Test 1: Browser Environment (Expected)
   Testing in regular browser - Office.js not available
   ──────────────────────────────────────────────────
   Office.js Available: ❌
   Word Environment: ❌
   Server Running: ✅
   Manifest Valid: ✅
   Container Element: ✅
   Protocol Mismatch: ✅
   Port Mismatch: ✅

   ❌ Issues Found:
     - Office.js is not available

   💡 Recommendations:
     - Follow the sideloading instructions at http://localhost:3000/sideload-instructions.html

   🎯 Overall Status: NEEDS ATTENTION
```

## 🏗️ Architecture

### Core Components

1. **SideloadingDetector Class**
   - Singleton pattern for consistent state
   - Comprehensive issue detection
   - Recommendation generation

2. **Status Interface**
   ```typescript
   interface SideloadingStatus {
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
   ```

3. **Utility Functions**
   - `runSideloadingDiagnostics()` - Console logging
   - `isSideloadingReady()` - Quick status check

### Integration Points

- **Main Add-in Initialization** (`src/index.tsx`)
- **Debug Console** (`dist/debug.html`)
- **Status Dashboard** (`dist/status.html`)
- **Sideloading Instructions** (`dist/sideload-instructions.html`)

## 🔍 Debugging with the Detection System

### 1. **Check Browser Console**
The detection system logs detailed information to the console in development mode.

### 2. **Use Debug Console**
Visit `http://localhost:3000/debug.html` for interactive debugging tools.

### 3. **Check Status Dashboard**
Visit `http://localhost:3000/status.html` for a visual status overview.

### 4. **Follow Recommendations**
Each detected issue comes with specific, actionable recommendations.

## 📈 Benefits

### For Developers
- **Quick Issue Identification** - Instant feedback on what's wrong
- **Specific Solutions** - Clear, actionable recommendations
- **Comprehensive Coverage** - Tests all common sideloading scenarios
- **Automated Detection** - Runs automatically during development

### For Users
- **Clear Error Messages** - Understandable feedback instead of generic errors
- **Step-by-Step Solutions** - Guided troubleshooting process
- **Visual Status Indicators** - Easy-to-understand status displays
- **Self-Service Resolution** - Users can fix issues without developer intervention

## 🚀 Future Enhancements

### Planned Features
- **Real-time Monitoring** - Continuous status updates
- **Auto-fix Capabilities** - Automatic resolution of common issues
- **Performance Metrics** - Load time and performance tracking
- **User Analytics** - Track common issues and resolutions

### Integration Opportunities
- **CI/CD Pipeline** - Automated testing in deployment
- **Error Reporting** - Integration with error tracking services
- **User Feedback** - Collect user-reported issues
- **Documentation Generation** - Auto-generate troubleshooting guides

## 📚 Related Documentation

- [Developer Handover Document](./developer_handover_document.md)
- [DWS Viewer Integration](./DWS_VIEWER_INTEGRATION.md)
- [Sideloading Instructions](./dist/sideload-instructions.html)
- [Debug Console](./dist/debug.html)
- [Status Dashboard](./dist/status.html)

---

**Created:** 2025-08-05  
**Version:** 1.0  
**Status:** Production Ready 