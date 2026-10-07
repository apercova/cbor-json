import React from 'react';
import type { DecodeCborOptions } from '../utils/decodeCbor.mjs';
import TimezoneSelector from './TimezoneSelector';
import './SettingsPane.css';

export interface DecoderSettings extends DecodeCborOptions {
  preserveTags: boolean;
  timestampFormat: 'epoch' | 'iso';
  timezoneEnabled: boolean;
  timezone: string;
  largeIntegerMode: 'exact' | 'number';
  strictMapKeys: boolean;
}

const FALLBACK_TIME_ZONES = [
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'Pacific/Auckland',
];

function getTimeZones() {
  const intlWithTimeZones = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  const supported = intlWithTimeZones.supportedValuesOf?.('timeZone') ?? FALLBACK_TIME_ZONES;
  return Array.from(new Set(['UTC', ...supported])).sort();
}

const TIME_ZONES = getTimeZones();

interface SettingsPaneProps {
  settings: DecoderSettings;
  onChange: (settings: DecoderSettings) => void;
}

const SettingsPane: React.FC<SettingsPaneProps> = ({ settings, onChange }) => {
  const update = (changes: Partial<DecoderSettings>) => onChange({ ...settings, ...changes });
  const changeTimestampFormat = (timestampFormat: 'epoch' | 'iso') => update({
    timestampFormat,
    timezoneEnabled: false,
    timezone: 'UTC',
  });

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
          onChange={(event) => update({
            preserveTags: event.target.checked,
            ...(event.target.checked ? { timezoneEnabled: false, timezone: 'UTC' } : {}),
          })}
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
            onChange={(event) => changeTimestampFormat(event.target.value as 'epoch' | 'iso')}
          >
            <option value="epoch">Epoch seconds (default)</option>
            <option value="iso">ISO 8601 string</option>
          </select>
          {settings.preserveTags && <small>Overridden by Tag representation.</small>}
        </label>

        {settings.timestampFormat === 'iso' && !settings.preserveTags && (
          <TimezoneSelector
            enabled={settings.timezoneEnabled}
            timezone={settings.timezone}
            timezones={TIME_ZONES}
            onEnabledChange={(enabled) => update({ timezoneEnabled: enabled, timezone: 'UTC' })}
            onTimezoneChange={(timezone) => update({ timezone })}
          />
        )}

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
