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
        >
          {isLoading ? 'Processing...' : 'Process Document'}
        </button>

        {pdfUrl && (
          <div style={{ marginTop: '16px' }}>
            <h4>Processing Complete!</h4>
            <p>Your document has been redacted and metadata has been stripped.</p>
            
            <button
              className="button secondary"
              onClick={handleDownload}
              style={{ marginBottom: '8px' }}
            >
              Download Redacted PDF
            </button>
            
            {viewerUrl && (
              <div className="iframe-container">
                <iframe
                  src={viewerUrl}
                  title="Redacted PDF Preview"
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