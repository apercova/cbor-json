import React from 'react';
import type { DecodeCborOptions } from '../utils/decodeCbor.mjs';
import './SettingsPane.css';

export interface DecoderSettings extends DecodeCborOptions {
  preserveTags: boolean;
  timestampFormat: 'epoch' | 'iso';
  largeIntegerMode: 'exact' | 'number';
  strictMapKeys: boolean;
}

interface SettingsPaneProps {
  settings: DecoderSettings;
  onChange: (settings: DecoderSettings) => void;
}

const SettingsPane: React.FC<SettingsPaneProps> = ({ settings, onChange }) => {
  const update = (changes: Partial<DecoderSettings>) => onChange({ ...settings, ...changes });

  return (
    <section className="settings-pane" id="decoder-settings" aria-label="Decoder settings">
      <div className="settings-heading">
        <h2>Decoder settings</h2>
        <p>Changes apply to the next file you decode.</p>
      </div>

      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={settings.preserveTags}
          onChange={(event) => update({ preserveTags: event.target.checked })}
        />
        <span>
          <strong>Tag representation</strong>
          <small>Preserve every CBOR tag as a JSON tag object. This overrides timestamp settings.</small>
        </span>
      </label>

      <div className="settings-grid">
        <label className="setting-field">
          <span>Timestamp tags</span>
          <select
            value={settings.timestampFormat}
            disabled={settings.preserveTags}
            onChange={(event) => update({ timestampFormat: event.target.value as 'epoch' | 'iso' })}
          >
            <option value="epoch">Epoch seconds (default)</option>
            <option value="iso">ISO 8601 string</option>
          </select>
          {settings.preserveTags && <small>Overridden by Tag representation.</small>}
        </label>

        <label className="setting-field">
          <span>Large integers</span>
          <select
            value={settings.largeIntegerMode}
            onChange={(event) => update({ largeIntegerMode: event.target.value as 'exact' | 'number' })}
          >
            <option value="exact">Exact JSON number (default)</option>
            <option value="number">JavaScript Number</option>
          </select>
          <small>JavaScript Number mode warns if it changes an integer.</small>
        </label>

        <label className="setting-field">
          <span>Non-string map keys</span>
          <select
            value={settings.strictMapKeys ? 'strict' : 'coerce'}
            onChange={(event) => update({ strictMapKeys: event.target.value === 'strict' })}
          >
            <option value="coerce">Coerce to strings (default)</option>
            <option value="strict">Strict: reject the map</option>
          </select>
        </label>
      </div>
    </section>
  );
};

export default SettingsPane;
