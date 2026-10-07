const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const SettingsPane = require('./SettingsPane').default;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it('lets global tag representation override timestamp formatting', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const settings = {
    preserveTags: false,
    timestampFormat: 'epoch',
    timezoneEnabled: false,
    timezone: 'UTC',
    largeIntegerMode: 'exact',
    strictMapKeys: false,
  };
  const onChange = jest.fn();
  act(() => root.render(React.createElement(SettingsPane, { settings, onChange })));

  const tagToggle = container.querySelector('input[type="checkbox"]');
  const timestampSelect = container.querySelector('select');
  expect(tagToggle).not.toBeNull();
  expect(timestampSelect).not.toBeNull();
  if (!tagToggle || !timestampSelect) throw new Error('Expected tag and timestamp settings.');
  expect(timestampSelect.disabled).toBe(false);
  expect(container.querySelector('[data-testid="timezone-setting"]')).toBeNull();

  act(() => tagToggle.click());
  expect(onChange).toHaveBeenCalledWith({ ...settings, preserveTags: true, timezone: 'UTC', timezoneEnabled: false });

  act(() => root.render(React.createElement(SettingsPane, {
    settings: { ...settings, preserveTags: true, timestampFormat: 'iso' },
    onChange,
  })));
  expect(container.querySelector('select').disabled).toBe(true);
  expect(container.querySelector('[data-testid="timezone-setting"]')).toBeNull();

  act(() => root.render(React.createElement(SettingsPane, {
    settings: { ...settings, timestampFormat: 'iso' },
    onChange,
  })));
  const timezoneSetting = container.querySelector('[data-testid="timezone-setting"]');
  expect(timezoneSetting).not.toBeNull();
  const timezoneToggle = timezoneSetting.querySelector('input[type="checkbox"]');
  const timezonePicker = timezoneSetting.querySelector('[role="combobox"]');
  expect(timezonePicker.disabled).toBe(true);

  act(() => timezoneToggle.click());
  expect(onChange).toHaveBeenLastCalledWith({ ...settings, timestampFormat: 'iso', timezoneEnabled: true, timezone: 'UTC' });
  act(() => root.render(React.createElement(SettingsPane, {
    settings: { ...settings, timestampFormat: 'iso', timezoneEnabled: true },
    onChange,
  })));
  const enabledPicker = container.querySelector('[data-testid="timezone-setting"] [role="combobox"]');
  expect(enabledPicker.disabled).toBe(false);

  act(() => {
    enabledPicker.focus();
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(enabledPicker, 'Mexico');
    enabledPicker.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(container.textContent).toContain('America/Mexico_City');
  expect(container.textContent).not.toContain('Asia/Tokyo');
  act(() => enabledPicker.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(onChange).toHaveBeenLastCalledWith({
    ...settings,
    timestampFormat: 'iso',
    timezoneEnabled: true,
    timezone: 'America/Mexico_City',
  });

  act(() => root.unmount());
});
