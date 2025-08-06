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
      link.download = `document-${format}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="tab-content active">
      <div>
        <h3>Export Word Document to PDF</h3>
        <p>Convert your current document to PDF format.</p>
        
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
          style={{ 
            backgroundColor: '#0078d4', 
            color: 'white', 
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Converting...' : 'Export to PDF'}
        </button>

        {pdfUrl && (
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: '#f0f8ff', 
            borderRadius: '8px',
            border: '1px solid #0078d4'
          }}>
            <h4 style={{ color: '#0078d4', margin: '0 0 12px 0' }}>✅ Export Successful!</h4>
            <p style={{ margin: '0 0 16px 0', color: '#333' }}>
              Your document has been converted to PDF format. You can now download it or preview it below.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownload}
                style={{
                  backgroundColor: '#107c10',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📥 Download PDF
              </button>
              
              {viewerUrl && (
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#0078d4',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  👁️ Preview PDF
                </a>
              )}
            </div>
            
            {viewerUrl && (
              <div style={{ marginTop: '16px' }}>
                <h5 style={{ margin: '0 0 8px 0' }}>PDF Preview:</h5>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  overflow: 'hidden',
                  height: '400px'
                }}>
                  <iframe
                    src={viewerUrl}
                    title="PDF Preview"
                    sandbox="allow-scripts allow-same-origin"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 