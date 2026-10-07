import React, { useState, useImperativeHandle, forwardRef } from 'react';
import LoadingIndicator from './LoadingIndicator';
import { useFileHandler } from '../hooks/useFileHandler';
import type { DecodeCborOptions } from '../utils/decodeCbor.mjs';
import './FileUploadPanel.css';

interface FileUploadPanelProps {
  onCborConverted: (jsonText: string, warnings: string[], fileName: string) => void;
  onFileProcessingStart: () => void;
  onFileProcessingError: () => void;
  onError: (error: string) => void;
  decodeOptions: DecodeCborOptions;
  isProcessing?: boolean;
  hidden?: boolean;
}

export interface FileUploadPanelRef {
  openFileDialog: () => void;
}

const FileUploadPanel = forwardRef<FileUploadPanelRef, FileUploadPanelProps>(({ onCborConverted, onFileProcessingStart, onFileProcessingError, onError, decodeOptions, isProcessing = false, hidden = false }, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  
  const { handleFile, fileInputProps, openFileDialog } = useFileHandler({
    onCborConverted,
    onFileProcessingStart,
    onFileProcessingError,
    onError,
    decodeOptions
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
    <div className="panel" hidden={hidden}>
      <div
        className={`upload-area expanded ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
            <p>or <button
              className="upload-trigger"
              type="button"
              disabled={isProcessing}
              onClick={openFileDialog}
            >choose a file</button></p>
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
    </div>
  );
});

FileUploadPanel.displayName = 'FileUploadPanel';

export default FileUploadPanel;
