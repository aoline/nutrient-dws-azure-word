import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { runSideloadingDiagnostics } from './utils/sideloadingDetector';

// Initialize Office.js with error handling and sideloading detection
const initializeApp = () => {
  try {
    // Run sideloading diagnostics in development
    if (process.env.NODE_ENV === 'development') {
      runSideloadingDiagnostics();
    }

    // Check if Office.js is available
    if (typeof Office !== 'undefined') {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          const container = document.getElementById('container');
          if (container) {
            const root = createRoot(container);
            root.render(<App />);
          }
        } else {
          // Handle non-Word environment
          const container = document.getElementById('container');
          if (container) {
            container.innerHTML = `
              <div style="padding: 20px; text-align: center; color: #666;">
                <h3>⚠️ Wrong Office Application</h3>
                <p>This add-in is designed to run in Microsoft Word.</p>
                <p>Current application: ${info.host}</p>
                <p>Please open this add-in in Microsoft Word.</p>
              </div>
            `;
          }
        }
      });
    } else {
      // Office.js not loaded, show error or fallback
      const container = document.getElementById('container');
      if (container) {
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #666;">
            <h3>🔧 Office.js Not Available</h3>
            <p>This add-in requires Microsoft Word to function properly.</p>
            <p>If you're testing in a browser, please sideload the add-in in Word.</p>
            <div style="margin-top: 20px;">
              <a href="http://localhost:3000/sideload-instructions.html" 
                 target="_blank" 
                 rel="noopener"
                 style="color: #0078d4; text-decoration: none;">
                📋 View Sideloading Instructions
              </a>
            </div>
            <div style="margin-top: 10px;">
              <a href="http://localhost:3000/debug.html" 
                 target="_blank" 
                 rel="noopener"
                 style="color: #0078d4; text-decoration: none;">
                🔍 Open Debug Console
              </a>
            </div>
          </div>
        `;
      }
    }
  } catch (error: any) {
    console.error('Error initializing Office.js:', error);
    const container = document.getElementById('container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h3>❌ Initialization Error</h3>
          <p>Failed to initialize the add-in: ${error.message}</p>
          <p>Please check the browser console for more details.</p>
          <div style="margin-top: 20px;">
            <a href="http://localhost:3000/debug.html" 
               target="_blank" 
               rel="noopener"
               style="color: #0078d4; text-decoration: none;">
              🔍 Open Debug Console
            </a>
          </div>
        </div>
      `;
    }
  }
};

// Try to initialize immediately, or wait for Office.js to load
if (typeof Office !== 'undefined') {
  initializeApp();
} else {
  // Wait for Office.js to load
  window.addEventListener('load', () => {
    // Give Office.js a moment to load
    setTimeout(initializeApp, 1000);
  });
} 