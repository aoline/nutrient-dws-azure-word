import React, { useState } from 'react';
import { ProcessingOptions } from '../types';

interface ExportTabProps {
  onExport: (options: ProcessingOptions) => Promise<void>;
  isLoading: boolean;
  pdfUrl: string | null;
  viewerUrl: string | null;
}

export const ExportTab: React.FC<ExportTabProps> = ({ onExport, isLoading, pdfUrl, viewerUrl }) => {
  const [format, setFormat] = useState<'pdf' | 'pdf-a' | 'pdf-ua'>('pdf');
  const [ocr, setOcr] = useState(false);

  const handleExport = () => {
    const options: ProcessingOptions = {
      format,
      ocr,
    };
    onExport(options);
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="tab-content active">
      <div>
        <h3>Export to PDF</h3>
        <p>Convert your current Word document to PDF format.</p>
        
        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>PDF Format:</strong>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as 'pdf' | 'pdf-a' | 'pdf-ua')}
              style={{ marginLeft: '8px', padding: '4px' }}
            >
              <option value="pdf">Standard PDF</option>
              <option value="pdf-a">PDF/A (Archival)</option>
              <option value="pdf-ua">PDF/UA (Accessible)</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <input
              type="checkbox"
              checked={ocr}
              onChange={(e) => setOcr(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Enable OCR (for scanned documents)
          </label>
        </div>

        <button
          className="button"
          onClick={handleExport}
          disabled={isLoading}
        >
          {isLoading ? 'Converting...' : 'Convert to PDF'}
        </button>

        {pdfUrl && (
          <div style={{ marginTop: '16px' }}>
            <h4>Conversion Complete!</h4>
            <button
              className="button secondary"
              onClick={handleDownload}
              style={{ marginBottom: '8px' }}
            >
              Download PDF
            </button>
            
            {viewerUrl && (
              <div className="iframe-container">
                <iframe
                  src={viewerUrl}
                  title="PDF Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 