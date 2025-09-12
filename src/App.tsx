import React, { useState, useRef } from 'react';
import './App.css';
import FileUploadPanel, { FileUploadPanelRef } from './components/FileUploadPanel';
import JsonDisplayPanel from './components/JsonDisplayPanel';

function App() {
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const fileUploadRef = useRef<FileUploadPanelRef>(null);

  const handleCborConverted = (convertedData: any, originalFileName: string) => {
    setJsonData(convertedData);
    setFileName(originalFileName);
    setIsProcessingFile(false);
  };

  const handleFileProcessingStart = () => {
    setIsProcessingFile(true);
    setJsonData(null);
    setFileName('');
  };

  const handleFileProcessingError = () => {
    setIsProcessingFile(false);
  };

  const handleClearData = () => {
    setJsonData(null);
    setFileName('');
    setIsProcessingFile(false);
  };

  const handleNewFile = () => {
    setJsonData(null);
    setFileName('');
    setIsProcessingFile(false);
    // Directly call the file dialog when upload panel is shown
    setTimeout(() => {
      fileUploadRef.current?.openFileDialog();
    }, 100);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="title-section">
            <h1>CBOR to JSON Converter</h1>
          </div>
        </div>
      </header>
      
      <div className="main-container">
        <div className="panel-container">
          {/* Show upload panel when no data or processing */}
          {(!jsonData || isProcessingFile) && (
            <FileUploadPanel 
              ref={fileUploadRef}
              onCborConverted={handleCborConverted}
              onFileProcessingStart={handleFileProcessingStart}
              onFileProcessingError={handleFileProcessingError}
              isProcessing={isProcessingFile}
            />
          )}
          
          {/* Show JSON panel only when data is available (after successful processing) */}
          {jsonData && !isProcessingFile && (
            <JsonDisplayPanel 
              jsonData={jsonData} 
              fileName={fileName}
              onClearData={handleClearData}
              onNewFile={handleNewFile}
            />
          )}
        </div>
      </div>
      
      <footer className="App-footer">
        Made with ❤️ by <a href="https://github.com/apercova" target="_blank" rel="noopener noreferrer">apercova</a> | <a href="https://buymeacoffee.com/apercova" target="_blank" rel="noopener noreferrer">Buy me a coffee</a> ☕
      </footer>
    </div>
  );
}

export default App;
