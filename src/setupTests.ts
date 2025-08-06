import '@testing-library/jest-dom';

// Mock Office.js for testing
Object.defineProperty(window, 'Office', {
  value: {
    context: {
      document: {
        getFileAsync: jest.fn(),
        setSelectedDataAsync: jest.fn(),
      },
    },
  },
  writable: true,
});

// Mock fetch for testing
Object.defineProperty(window, 'fetch', {
  value: jest.fn(),
  writable: true,
}); 