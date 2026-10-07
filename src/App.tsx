import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import './App.css';
import FileUploadPanel, { FileUploadPanelRef } from './components/FileUploadPanel';
import JsonDisplayPanel from './components/JsonDisplayPanel';
import SettingsPane, { DecoderSettings } from './components/SettingsPane';
import HelpPane from './components/HelpPane';
import { jsonDownloadName } from './utils/downloadName';
import type { DecodeCborOptions } from './utils/decodeCbor.mjs';

type HeaderPane = 'settings' | 'help' | null;

function App() {
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [openHeaderPane, setOpenHeaderPane] = useState<HeaderPane>(null);
  const [settings, setSettings] = useState<DecoderSettings>({
    preserveTags: false,
    timestampFormat: 'epoch',
    timezoneEnabled: false,
    timezone: 'UTC',
    largeIntegerMode: 'exact',
    strictMapKeys: false,
  });
  const decodeOptions: DecodeCborOptions = {
    preserveTags: settings.preserveTags,
    timestampFormat: settings.timestampFormat,
    timezone: settings.timezoneEnabled ? settings.timezone : 'UTC',
    largeIntegerMode: settings.largeIntegerMode,
    strictMapKeys: settings.strictMapKeys,
  };
  const fileUploadRef = useRef<FileUploadPanelRef>(null);

  const handleCborConverted = (convertedJson: string, warnings: string[], originalFileName: string) => {
    if (warnings.length > 0) console.log('Decoded with warnings:', warnings);
    setJsonText(convertedJson);
    setDecodeError('');
    setFileName(originalFileName);
    setIsProcessingFile(false);
  };

  const handleFileProcessingStart = () => {
    setIsProcessingFile(true);
    setJsonText(null);
    setDecodeError('');
    setFileName('');
  };

  const handleFileProcessingError = () => {
    setIsProcessingFile(false);
  };

  const clearData = () => {
    setJsonText(null);
    setDecodeError('');
    setFileName('');
    setIsProcessingFile(false);
  };

  const handleClearData = clearData;

  const handleSaveJson = () => {
    if (!jsonText) return;
    const blob = new Blob([jsonText], { type: 'application/json' });
    saveAs(blob, jsonDownloadName(fileName));
  };

  const handleNewFile = () => {
    clearData();
    fileUploadRef.current?.openFileDialog();
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="title-section">
            <h1>CBOR to JSON Converter</h1>
          </div>
          <div className="header-controls">
            {jsonText && (
              <button
                className="header-icon-button"
                type="button"
                aria-label="Save JSON"
                title="Save to disk"
                onClick={handleSaveJson}
              >
                💾
              </button>
            )}
            <button
              className="header-icon-button"
              type="button"
              aria-label="Open file"
              title="Open file"
              disabled={isProcessingFile}
              onClick={handleNewFile}
            >
              📁
            </button>
            {(jsonText || isProcessingFile) && (
              <button
                className="header-icon-button"
                type="button"
                aria-label="Clear output"
                title="Close editor"
                disabled={!jsonText || isProcessingFile}
                onClick={handleClearData}
              >
                ✖
              </button>
            )}
            <button
              className="header-icon-button"
              type="button"
              aria-label="Settings"
              title="Settings"
              aria-expanded={openHeaderPane === 'settings'}
              aria-controls="decoder-settings"
              onClick={() => setOpenHeaderPane((current) => current === 'settings' ? null : 'settings')}
            >
              ⚙
            </button>
            <button
              className="header-icon-button"
              type="button"
              aria-label="Help and attribution"
              aria-expanded={openHeaderPane === 'help'}
              aria-controls="converter-help"
              title="Help and attribution"
              onClick={() => setOpenHeaderPane((current) => current === 'help' ? null : 'help')}
            >
              ?
            </button>
          </div>
        </div>
      </header>
      
      <div className="main-container">
        {openHeaderPane === 'settings' && <SettingsPane settings={settings} onChange={setSettings} />}
        {openHeaderPane === 'help' && <HelpPane />}
        <div className="panel-container">
          {/* Show upload panel when no data or processing */}
          <FileUploadPanel
            ref={fileUploadRef}
            onCborConverted={handleCborConverted}
            onFileProcessingStart={handleFileProcessingStart}
            onFileProcessingError={handleFileProcessingError}
            onError={setDecodeError}
            decodeOptions={decodeOptions}
            isProcessing={isProcessingFile}
            hidden={Boolean(jsonText || (decodeError && !isProcessingFile))}
          />
          
          {/* Show the result panel for decoded JSON or a decode error. */}
          {(jsonText || decodeError) && !isProcessingFile && (
            <JsonDisplayPanel 
              jsonText={jsonText || ''}
              error={decodeError}
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
