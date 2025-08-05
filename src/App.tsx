import React, { useState } from 'react';
import { AppState, ProcessingOptions } from './types';
import { DocumentService } from './services/DocumentService';
import { ExportTab } from './components/ExportTab';
import { ImportTab } from './components/ImportTab';
import { RedactTab } from './components/RedactTab';
import './App.css';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    currentTab: 'export',
    status: { type: null, message: '' },
    pdfUrl: null,
    viewerUrl: null,
  });

  const documentService = new DocumentService();

  const setStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setState(prev => ({
      ...prev,
      status: { type, message }
    }));
  };

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const handleExportToPDF = async (options: ProcessingOptions) => {
    try {
      setLoading(true);
      setStatus('info', 'Converting document to PDF...');

      const result = await documentService.exportToPDF(options);
      
      if (result.success && result.pdfUrl) {
        setState(prev => ({
          ...prev,
          pdfUrl: result.pdfUrl!,
          viewerUrl: result.viewerUrl || null
        }));
        setStatus('success', 'Document converted successfully!');
      } else {
        setStatus('error', result.error || 'Failed to convert document');
      }
    } catch (error) {
      setStatus('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromPDF = async (file: File, options: ProcessingOptions) => {
    try {
      setLoading(true);
      setStatus('info', 'Processing PDF...');

      const result = await documentService.importFromPDF(file, options);
      
      if (result.success) {
        setStatus('success', 'PDF imported successfully!');
      } else {
        setStatus('error', result.error || 'Failed to import PDF');
      }
    } catch (error) {
      setStatus('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRedactDocument = async (options: ProcessingOptions) => {
    try {
      setLoading(true);
      setStatus('info', 'Processing document for redaction...');

      const result = await documentService.redactDocument(options);
      
      if (result.success && result.pdfUrl) {
        setState(prev => ({
          ...prev,
          pdfUrl: result.pdfUrl!,
          viewerUrl: result.viewerUrl || null
        }));
        setStatus('success', 'Document redacted successfully!');
      } else {
        setStatus('error', result.error || 'Failed to redact document');
      }
    } catch (error) {
      setStatus('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: 'export' | 'import' | 'redact') => {
    setState(prev => ({ ...prev, currentTab: tab }));
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Nutrient.io PDF Tools</h1>
        <p>Convert, import, and process documents</p>
      </div>

      {state.status.type && (
        <div className={`status ${state.status.type}`}>
          {state.status.message}
        </div>
      )}

      <div className="tab-container">
        <div className="tab-buttons">
          <button
            className={`tab-button ${state.currentTab === 'export' ? 'active' : ''}`}
            onClick={() => switchTab('export')}
          >
            Export to PDF
          </button>
          <button
            className={`tab-button ${state.currentTab === 'import' ? 'active' : ''}`}
            onClick={() => switchTab('import')}
          >
            Import from PDF
          </button>
          <button
            className={`tab-button ${state.currentTab === 'redact' ? 'active' : ''}`}
            onClick={() => switchTab('redact')}
          >
            Redact & Strip
          </button>
        </div>

        <div className="tab-content">
          {state.currentTab === 'export' && (
            <ExportTab
              onExport={handleExportToPDF}
              isLoading={state.isLoading}
              pdfUrl={state.pdfUrl}
              viewerUrl={state.viewerUrl}
            />
          )}
          {state.currentTab === 'import' && (
            <ImportTab
              onImport={handleImportFromPDF}
              isLoading={state.isLoading}
            />
          )}
          {state.currentTab === 'redact' && (
            <RedactTab
              onRedact={handleRedactDocument}
              isLoading={state.isLoading}
              pdfUrl={state.pdfUrl}
              viewerUrl={state.viewerUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App; 