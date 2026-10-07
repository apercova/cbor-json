const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('@uiw/react-codemirror', () => () => null);
jest.mock('../utils/editorConfig', () => ({
  createEditorExtensions: () => [],
  editorBasicSetup: {},
}));
const JsonDisplayPanel = require('./JsonDisplayPanel').default;

it('renders decode errors without the former warning banner text', () => {
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(JsonDisplayPanel, {
      jsonText: '',
      error: 'A decoder error',
      fileName: 'sample.cbor',
      onClearData: () => undefined,
      onNewFile: () => undefined,
    }));
  });

  const errorPane = container.querySelector('.decode-error');
  expect(errorPane).not.toBeNull();
  expect(container.textContent).not.toContain('Decoded with warnings:');
  expect(errorPane?.getAttribute('role')).toBe('alert');

  act(() => root.unmount());
});
