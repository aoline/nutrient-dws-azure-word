import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportTab from '../ExportTab';

// Mock the DocumentService
jest.mock('../../services/DocumentService', () => ({
  DocumentService: {
    exportToPDF: jest.fn(),
    getViewerUrl: jest.fn(),
  },
}));

describe('ExportTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders export tab with all form elements', () => {
    render(<ExportTab />);
    
    expect(screen.getByText('Export to PDF')).toBeInTheDocument();
    expect(screen.getByLabelText('PDF Format:')).toBeInTheDocument();
    expect(screen.getByLabelText('Quality:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export to PDF' })).toBeInTheDocument();
  });

  it('shows default form values', () => {
    render(<ExportTab />);
    
    expect(screen.getByDisplayValue('PDF/A-1b')).toBeInTheDocument();
    expect(screen.getByDisplayValue('High')).toBeInTheDocument();
  });

  it('allows changing PDF format', async () => {
    const user = userEvent.setup();
    render(<ExportTab />);
    
    const formatSelect = screen.getByLabelText('PDF Format:');
    await user.selectOptions(formatSelect, 'PDF/UA');
    
    expect(formatSelect).toHaveValue('PDF/UA');
  });

  it('allows changing quality setting', async () => {
    const user = userEvent.setup();
    render(<ExportTab />);
    
    const qualitySelect = screen.getByLabelText('Quality:');
    await user.selectOptions(qualitySelect, 'Medium');
    
    expect(qualitySelect).toHaveValue('Medium');
  });

  it('shows loading state when exporting', async () => {
    const user = userEvent.setup();
    const mockExportToPDF = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { DocumentService } = require('../../services/DocumentService');
    DocumentService.exportToPDF = mockExportToPDF;
    
    render(<ExportTab />);
    
    const exportButton = screen.getByRole('button', { name: 'Export to PDF' });
    await user.click(exportButton);
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(exportButton).toBeDisabled();
  });

  it('handles successful export', async () => {
    const user = userEvent.setup();
    const mockPdfBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    const mockExportToPDF = jest.fn().mockResolvedValue(mockPdfBlob);
    const mockGetViewerUrl = jest.fn().mockResolvedValue('https://viewer.example.com/doc123');
    
    const { DocumentService } = require('../../services/DocumentService');
    DocumentService.exportToPDF = mockExportToPDF;
    DocumentService.getViewerUrl = mockGetViewerUrl;
    
    render(<ExportTab />);
    
    const exportButton = screen.getByRole('button', { name: 'Export to PDF' });
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export successful!')).toBeInTheDocument();
    });
    
    expect(mockExportToPDF).toHaveBeenCalledWith({
      format: 'PDF/A-1b',
      quality: 'High'
    });
  });

  it('handles export error', async () => {
    const user = userEvent.setup();
    const mockExportToPDF = jest.fn().mockRejectedValue(new Error('Export failed'));
    
    const { DocumentService } = require('../../services/DocumentService');
    DocumentService.exportToPDF = mockExportToPDF;
    
    render(<ExportTab />);
    
    const exportButton = screen.getByRole('button', { name: 'Export to PDF' });
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('shows viewer iframe after successful export', async () => {
    const user = userEvent.setup();
    const mockPdfBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    const mockExportToPDF = jest.fn().mockResolvedValue(mockPdfBlob);
    const mockGetViewerUrl = jest.fn().mockResolvedValue('https://viewer.example.com/doc123');
    
    const { DocumentService } = require('../../services/DocumentService');
    DocumentService.exportToPDF = mockExportToPDF;
    DocumentService.getViewerUrl = mockGetViewerUrl;
    
    render(<ExportTab />);
    
    const exportButton = screen.getByRole('button', { name: 'Export to PDF' });
    await user.click(exportButton);
    
    await waitFor(() => {
      const iframe = screen.getByTitle('PDF Viewer');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://viewer.example.com/doc123');
    });
  });

  it('provides download link after successful export', async () => {
    const user = userEvent.setup();
    const mockPdfBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    const mockExportToPDF = jest.fn().mockResolvedValue(mockPdfBlob);
    
    const { DocumentService } = require('../../services/DocumentService');
    DocumentService.exportToPDF = mockExportToPDF;
    
    render(<ExportTab />);
    
    const exportButton = screen.getByRole('button', { name: 'Export to PDF' });
    await user.click(exportButton);
    
    await waitFor(() => {
      const downloadLink = screen.getByRole('link', { name: 'Download PDF' });
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('download', 'document.pdf');
    });
  });
}); 