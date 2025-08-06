import React, { useState } from 'react';
import { ProcessingOptions } from '../types';

interface RedactTabProps {
  onRedact: (options: ProcessingOptions) => Promise<void>;
  isLoading: boolean;
  pdfUrl: string | null;
  viewerUrl: string | null;
}

export const RedactTab: React.FC<RedactTabProps> = ({ onRedact, isLoading, pdfUrl, viewerUrl }) => {
  const [stripMetadata, setStripMetadata] = useState(true);
  const [redactSensitiveData, setRedactSensitiveData] = useState(true);

  const handleRedact = () => {
    const options: ProcessingOptions = {
      redact: redactSensitiveData,
      stripMetadata,
    };
    onRedact(options);
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'redacted-document.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="tab-content active">
      <div>
        <h3>Redact & Strip Metadata</h3>
        <p>Remove sensitive information and metadata from your document.</p>
        
        <div style={{ marginBottom: '16px' }}>
          <label>
            <input
              type="checkbox"
              checked={redactSensitiveData}
              onChange={(e) => setRedactSensitiveData(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Redact sensitive data (names, emails, phone numbers, etc.)
          </label>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <input
              type="checkbox"
              checked={stripMetadata}
              onChange={(e) => setStripMetadata(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Strip document metadata (author, creation date, etc.)
          </label>
        </div>

        <button
          className="button"
          onClick={handleRedact}
          disabled={isLoading}
          style={{ 
            backgroundColor: '#d13438', 
            color: 'white', 
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Processing...' : 'Process Document'}
        </button>

        {pdfUrl && (
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: '#fff4f4', 
            borderRadius: '8px',
            border: '1px solid #d13438'
          }}>
            <h4 style={{ color: '#d13438', margin: '0 0 12px 0' }}>✅ Processing Complete!</h4>
            <p style={{ margin: '0 0 16px 0', color: '#333' }}>
              Your document has been redacted and metadata has been stripped. You can now download the secure version or preview it below.
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
                📥 Download Redacted PDF
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
                  👁️ Preview Redacted PDF
                </a>
              )}
            </div>
            
            {viewerUrl && (
              <div style={{ marginTop: '16px' }}>
                <h5 style={{ margin: '0 0 8px 0' }}>Redacted PDF Preview:</h5>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  overflow: 'hidden',
                  height: '400px'
                }}>
                  <iframe
                    src={viewerUrl}
                    title="Redacted PDF Preview"
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