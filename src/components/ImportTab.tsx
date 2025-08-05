import React, { useState, useRef } from 'react';
import { ProcessingOptions } from '../types';

interface ImportTabProps {
  onImport: (file: File, options: ProcessingOptions) => Promise<void>;
  isLoading: boolean;
}

export const ImportTab: React.FC<ImportTabProps> = ({ onImport, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocr, setOcr] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      const options: ProcessingOptions = {
        ocr,
      };
      onImport(selectedFile, options);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please drop a valid PDF file.');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="tab-content active">
      <div>
        <h3>Import from PDF</h3>
        <p>Convert a PDF file to Word document format using OCR.</p>
        
        <div
          style={{
            border: '2px dashed #c8c6c4',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '16px',
            backgroundColor: '#f3f2f1',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {selectedFile ? (
            <div>
              <p><strong>Selected file:</strong> {selectedFile.name}</p>
              <button
                className="button secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Different File
              </button>
            </div>
          ) : (
            <div>
              <p>Drag and drop a PDF file here, or</p>
              <button
                className="button secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <input
              type="checkbox"
              checked={ocr}
              onChange={(e) => setOcr(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Enable OCR (recommended for scanned documents)
          </label>
        </div>

        <button
          className="button"
          onClick={handleImport}
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? 'Processing...' : 'Import PDF'}
        </button>
      </div>
    </div>
  );
}; 