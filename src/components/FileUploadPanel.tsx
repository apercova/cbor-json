import React, { useState, useImperativeHandle, forwardRef } from 'react';
import LoadingIndicator from './LoadingIndicator';
import { useFileHandler } from '../hooks/useFileHandler';
import './FileUploadPanel.css';

interface FileUploadPanelProps {
  onCborConverted: (jsonText: string, warnings: string[], fileName: string) => void;
  onFileProcessingStart: () => void;
  onFileProcessingError: () => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

export interface FileUploadPanelRef {
  openFileDialog: () => void;
}

const FileUploadPanel = forwardRef<FileUploadPanelRef, FileUploadPanelProps>(({ onCborConverted, onFileProcessingStart, onFileProcessingError, onError, isProcessing = false }, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  
  const { handleFile, fileInputProps, openFileDialog } = useFileHandler({
    onCborConverted,
    onFileProcessingStart,
    onFileProcessingError,
    onError
  });

  // Expose openFileDialog to parent components
  useImperativeHandle(ref, () => ({
    openFileDialog
  }));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileWithTracking(files[0]);
    }
  };

  const handleFileWithTracking = (file: File) => {
    setUploadedFileName(file.name);
    handleFile(file);
  };

  return (
    <div className="panel">
      <div
        className={`upload-area expanded ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input {...fileInputProps} />
        
        {isProcessing ? (
          <div className="processing-state">
            <LoadingIndicator message={`Processing ${uploadedFileName || 'CBOR file'}...`} />
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📤</div>
            <h3>Drag & Drop a CBOR File</h3>
            <p>or click to choose a file</p>
            <div className="file-types">
              Supported: .cbor, .bin files
            </div>
          </div>
        )}
      </div>

      {uploadedFileName && !isProcessing && (
        <div className="file-info">
          <div className="file-icon">📄</div>
          <div className="file-details">
            <strong>Uploaded:</strong> {uploadedFileName}
          </div>
        </div>
      )}

      <div className="library-references">
        <h4>Powered by:</h4>
        <div className="library-links">
          <div className="library-item">
            <span><strong>CBOR Processing:</strong> <a href="https://github.com/rvagg/cborg" target="_blank" rel="noopener noreferrer">cborg</a></span>
            <span className="library-description">Strict CBOR decoding</span>
          </div>
          <div className="library-item">
            <span><strong>Code Editor:</strong> <a href="https://codemirror.net/" target="_blank" rel="noopener noreferrer">CodeMirror 6</a></span>
            <span className="library-description">Professional code editing with JSON support</span>
          </div>
        </div>
      </div>
    </div>
  );
});

FileUploadPanel.displayName = 'FileUploadPanel';

export default FileUploadPanel;
