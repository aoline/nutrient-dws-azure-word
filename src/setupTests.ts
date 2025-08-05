// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock Office.js
global.Office = {
  context: {
    document: {
      getFileAsync: jest.fn(),
      setSelectedDataAsync: jest.fn(),
    },
  },
  FileType: {
    Compressed: 'compressed',
  },
  AsyncResultStatus: {
    Succeeded: 'succeeded',
    Failed: 'failed',
  },
  CoercionType: {
    Text: 'text',
  },
} as any;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn(); 