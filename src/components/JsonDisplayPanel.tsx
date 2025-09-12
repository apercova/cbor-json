import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import CodeMirror from '@uiw/react-codemirror';

import LoadingIndicator from './LoadingIndicator';
import { createEditorExtensions, editorBasicSetup } from '../utils/editorConfig';
import { LARGE_FILE_THRESHOLD, JSON_FORMATTING_DELAY } from '../constants';
import './JsonDisplayPanel.css';

interface JsonDisplayPanelProps {
  jsonData: any;
  fileName: string;
  onClearData: () => void;
  onNewFile: () => void;
}

const JsonDisplayPanel: React.FC<JsonDisplayPanelProps> = ({ 
  jsonData, 
  fileName, 
  onClearData,
  onNewFile
}) => {
  const [formattedJson, setFormattedJson] = useState<string>('');
  const [isRenderingJson, setIsRenderingJson] = useState<boolean>(false);

  useEffect(() => {
    if (jsonData) {
      setIsRenderingJson(true);
      setFormattedJson('');
      
      // Use setTimeout to allow UI update for large files
      setTimeout(() => {
        try {
          const formatted = JSON.stringify(jsonData, null, 2);
          setFormattedJson(formatted);
        } catch (error) {
          setFormattedJson('Error formatting JSON data');
        } finally {
          setIsRenderingJson(false);
        }
      }, JSON_FORMATTING_DELAY);
    } else {
      setFormattedJson('');
      setIsRenderingJson(false);
    }
  }, [jsonData]);

  const handleSaveJson = () => {
    if (formattedJson) {
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const baseFileName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
      saveAs(blob, `${baseFileName}.json`);
    }
  };





  const isLargeFile = formattedJson.length > LARGE_FILE_THRESHOLD;
  const extensions = createEditorExtensions(isLargeFile);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="header-left">
          <h2>📄 JSON Output</h2>
          {formattedJson && (
            <div className="line-counter">
              <span className="line-count">{formattedJson.split('\n').length.toLocaleString()} lines</span>
            </div>
          )}
          {isLargeFile && (
            <div className="large-file-warning">
              ⚠️ Large file (&gt;100KB) - Editor optimized for viewing
            </div>
          )}
        </div>
        {jsonData && (
          <div className="panel-actions">
            <button 
              className="action-btn" 
              onClick={handleSaveJson}
              title="Save to disk"
            >
              💾 Save
            </button>
            <button 
              className="action-btn" 
              onClick={onNewFile}
              title="Clear and upload new file"
            >
              📁 New
            </button>
            <button 
              className="action-btn" 
              onClick={onClearData}
              title="Close editor"
            >
              ✖️ Clear
            </button>
          </div>
        )}
      </div>

      {isRenderingJson && (
        <LoadingIndicator 
          message='Rendering JSON output...'
        />
      )}

      <div className="json-container">
        {formattedJson ? (
          <div className="json-editor-wrapper">
            <CodeMirror
              value={formattedJson}
              extensions={extensions}
              editable={true}
              height="100%"
              basicSetup={editorBasicSetup}
              className="json-editor"
            />
          </div>
        ) : (
          <div className="centered-loading">
            {/* Panel only shows when jsonData exists, so this shouldn't happen */}
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonDisplayPanel;
