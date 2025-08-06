# Minimal Test Add-in

A minimal Office Add-in for testing the sideloading detection system.

## 🎯 Purpose

This add-in is designed to:
- Test the sideloading detection functionality
- Provide a simple, clean interface for debugging
- Demonstrate proper add-in initialization
- Show real-time status of all sideloading requirements

## 📁 Files

```
minimal-addin/
├── manifest.xml          # Add-in manifest
├── minimal.html          # Main add-in page
├── commands.html         # Commands page
├── assets/
│   └── icon.svg         # Add-in icon
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Copy Files to dist Directory

```bash
# Copy the minimal add-in files to the dist directory
cp minimal-addin/manifest.xml dist/minimal-manifest.xml
cp minimal-addin/minimal.html dist/minimal.html
cp minimal-addin/commands.html dist/commands.html
mkdir -p dist/assets
cp minimal-addin/assets/icon.svg dist/assets/icon.svg
```

### 2. Start the Server

```bash
python3 -m http.server 3000 --directory dist
```

### 3. Sideload the Add-in

```bash
# Use the minimal manifest for testing
npx office-addin-debugging start dist/minimal-manifest.xml
```

## 🔍 Features

### Sideloading Detection
- **Real-time Status**: Shows current state of all requirements
- **Issue Detection**: Identifies common sideloading problems
- **Recommendations**: Provides specific solutions for each issue
- **Visual Feedback**: Color-coded status indicators

### Status Checks
- ✅ Office.js Availability
- ✅ Word Environment Detection
- ✅ Server Connectivity
- ✅ Manifest File Validation
- ✅ Environment Configuration
- ✅ DOM Element Availability

### Interactive Tools
- 🔄 **Run Diagnostics**: Re-run all checks
- 🔍 **Debug Console**: Open the main debug console
- 📋 **Sideload Instructions**: View detailed setup guide

## 🎨 UI Design

The add-in features a modern, gradient-based design with:
- **Purple Gradient Background**: Professional appearance
- **Glass Morphism Cards**: Modern UI elements
- **Color-coded Status**: Green (success), Orange (warning), Red (error)
- **Responsive Layout**: Works in narrow taskpane
- **Smooth Animations**: Enhanced user experience

## 🧪 Testing Scenarios

### 1. **Perfect Environment**
- All checks pass
- Shows success message
- Green status indicators

### 2. **Browser Environment**
- Office.js not available
- Shows appropriate error message
- Links to sideloading instructions

### 3. **Configuration Issues**
- Protocol mismatches
- Port configuration problems
- Missing manifest files

### 4. **Server Issues**
- Server not running
- Network connectivity problems
- File accessibility issues

## 🔧 Customization

### Modify Status Checks
Edit the `MockSideloadingDetector` class in `minimal.html` to:
- Add new detection methods
- Modify existing checks
- Change recommendation logic

### Update UI
Modify the CSS in `minimal.html` to:
- Change colors and styling
- Adjust layout and spacing
- Add new UI components

### Add Features
Extend the add-in to include:
- Additional diagnostic tools
- Performance monitoring
- User interaction tracking

## 📊 Expected Behavior

### In Browser (Expected)
```
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
  - Follow the sideloading instructions
```

### In Word (Success)
```
Office.js Available: ✅
Word Environment: ✅
Server Running: ✅
Manifest Valid: ✅
Container Element: ✅
Protocol Mismatch: ✅
Port Mismatch: ✅

✅ All Systems Ready!
The add-in is properly configured and ready to use.
```

## 🚀 Integration with Main Add-in

This minimal add-in can be used to:
1. **Test Detection System**: Verify the sideloading detection works
2. **Debug Issues**: Isolate problems in a simple environment
3. **Demonstrate Features**: Show how the detection system works
4. **Development Tool**: Use during add-in development

## 📚 Related Documentation

- [Sideloading Detection System](../SIDELOADING_DETECTION.md)
- [Developer Handover Document](../developer_handover_document.md)
- [Main Add-in Documentation](../README.md)

---

**Created:** 2025-08-05  
**Purpose:** Testing and demonstration  
**Status:** Ready for use 