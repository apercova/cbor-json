import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';

import LoadingIndicator from './LoadingIndicator';
import { createEditorExtensions, editorBasicSetup } from '../utils/editorConfig';
import { LARGE_FILE_THRESHOLD, JSON_FORMATTING_DELAY } from '../constants';
import './JsonDisplayPanel.css';

interface JsonDisplayPanelProps {
  jsonText: string;
  error: string;
}

const JsonDisplayPanel: React.FC<JsonDisplayPanelProps> = ({
  jsonText,
  error,
}) => {
  const [formattedJson, setFormattedJson] = useState<string>('');
  const [isRenderingJson, setIsRenderingJson] = useState<boolean>(false);

  useEffect(() => {
    if (jsonText) {
      setIsRenderingJson(true);
      setFormattedJson('');
      
      // Use setTimeout to allow UI update for large files
      setTimeout(() => {
        try {
          setFormattedJson(jsonText);
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
  }, [jsonText]);

  const isLargeFile = formattedJson.length > LARGE_FILE_THRESHOLD;
  const extensions = createEditorExtensions(isLargeFile);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="header-left">
          <h2>{error && !jsonText ? '⚠️ CBOR Decode Error' : '📄 JSON Output'}</h2>
          {formattedJson && (
            <div className="line-counter">
              <span className="line-count">{formattedJson.split('\n').length.toLocaleString()} lines</span>
            </div>
          )}
          {isLargeFile && (
            <div className="large-file-warning">
              ⚠️ Large JSON output (over {LARGE_FILE_THRESHOLD.toLocaleString()} characters) — editor optimized for viewing
            </div>
          )}
        </div>
      </div>

      {isRenderingJson && (
        <LoadingIndicator 
          message='Rendering JSON output...'
        />
      )}

      {error && (
        <div className="decode-error" role="alert">
          <strong>Could not decode CBOR:</strong>
          <p>{error}</p>
        </div>
      )}

      {formattedJson && (
        <div className="json-container">
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
        </div>
      )}
    </div>
  );
};

export default JsonDisplayPanel;
