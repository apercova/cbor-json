import React, { useState, useRef } from 'react';
import './App.css';
import FileUploadPanel, { FileUploadPanelRef } from './components/FileUploadPanel';
import JsonDisplayPanel from './components/JsonDisplayPanel';
import SettingsPane, { DecoderSettings } from './components/SettingsPane';

function App() {
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [decodeWarnings, setDecodeWarnings] = useState<string[]>([]);
  const [decodeError, setDecodeError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<DecoderSettings>({
    preserveTags: false,
    timestampFormat: 'epoch',
    largeIntegerMode: 'exact',
    strictMapKeys: false,
  });
  const fileUploadRef = useRef<FileUploadPanelRef>(null);

  const handleCborConverted = (convertedJson: string, warnings: string[], originalFileName: string) => {
    setJsonText(convertedJson);
    setDecodeWarnings(warnings);
    setDecodeError('');
    setFileName(originalFileName);
    setIsProcessingFile(false);
  };

  const handleFileProcessingStart = () => {
    setIsProcessingFile(true);
    setJsonText(null);
    setDecodeWarnings([]);
    setDecodeError('');
    setFileName('');
  };

  const handleFileProcessingError = () => {
    setIsProcessingFile(false);
  };

  const handleClearData = () => {
    setJsonText(null);
    setDecodeWarnings([]);
    setDecodeError('');
    setFileName('');
    setIsProcessingFile(false);
  };

  const handleNewFile = () => {
    setJsonText(null);
    setDecodeWarnings([]);
    setDecodeError('');
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
          <button
            className="settings-button"
            type="button"
            aria-expanded={showSettings}
            aria-controls="decoder-settings"
            onClick={() => setShowSettings((isOpen) => !isOpen)}
          >
            ⚙ Settings
          </button>
        </div>
      </header>
      
      <div className="main-container">
        {showSettings && <SettingsPane settings={settings} onChange={setSettings} />}
        <div className="panel-container">
          {/* Show upload panel when no data or processing */}
          {((!jsonText && !decodeError) || isProcessingFile) && (
            <FileUploadPanel 
              ref={fileUploadRef}
              onCborConverted={handleCborConverted}
              onFileProcessingStart={handleFileProcessingStart}
              onFileProcessingError={handleFileProcessingError}
              onError={setDecodeError}
              decodeOptions={settings}
              isProcessing={isProcessingFile}
            />
          )}
          
          {/* Show the result panel for decoded JSON or a decode error. */}
          {(jsonText || decodeError) && !isProcessingFile && (
            <JsonDisplayPanel 
              jsonText={jsonText || ''}
              warnings={decodeWarnings}
              error={decodeError}
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
