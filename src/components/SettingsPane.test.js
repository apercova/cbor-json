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

  act(() => tagToggle.click());
  expect(onChange).toHaveBeenCalledWith({ ...settings, preserveTags: true });

  act(() => root.render(React.createElement(SettingsPane, {
    settings: { ...settings, preserveTags: true },
    onChange,
  })));
  expect(container.querySelector('select').disabled).toBe(true);

  act(() => root.unmount());
});
