import React from 'react';
import './HelpPane.css';

const HelpPane: React.FC = () => (
  <section className="help-pane" id="converter-help" aria-label="Help and attribution">
    <div className="help-pane-content">
      <div className="help-pane-about">
        <h2>About</h2>
        <p>Convert CBOR files to JSON in your browser. Your files stay on your device.</p>
        <p className="help-pane-footer-copy">
          Made with ❤️ by <a href="https://github.com/apercova" target="_blank" rel="noopener noreferrer">apercova</a>
          {' | '}
          <a href="https://buymeacoffee.com/apercova" target="_blank" rel="noopener noreferrer">Buy me a coffee</a> ☕
        </p>
      </div>
      <div className="help-pane-powered-by">
        <h2>Powered by</h2>
        <div className="help-pane-links">
          <div className="help-pane-item">
            <strong>CBOR processing</strong>
            <a href="https://github.com/rvagg/cborg" target="_blank" rel="noopener noreferrer">cborg</a>
            <span>Strict CBOR decoding</span>
          </div>
          <div className="help-pane-item">
            <strong>Code editor</strong>
            <a href="https://codemirror.net/" target="_blank" rel="noopener noreferrer">CodeMirror 6</a>
            <span>JSON editing and viewing</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HelpPane;
