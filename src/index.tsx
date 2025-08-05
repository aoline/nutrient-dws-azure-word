import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize Office.js
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const container = document.getElementById('container');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  }
}); 