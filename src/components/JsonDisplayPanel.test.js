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

it('renders decode errors beneath warnings', () => {
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(JsonDisplayPanel, {
      jsonText: '',
      warnings: ['A decoder warning'],
      error: 'A decoder error',
      fileName: 'sample.cbor',
      onClearData: () => undefined,
      onNewFile: () => undefined,
    }));
  });

  const warningPane = container.querySelector('.decode-warnings');
  const errorPane = container.querySelector('.decode-error');
  expect(warningPane).not.toBeNull();
  expect(errorPane).not.toBeNull();
  if (!warningPane || !errorPane) throw new Error('Expected both message panes to render.');
  expect(warningPane.compareDocumentPosition(errorPane)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(errorPane?.getAttribute('role')).toBe('alert');

  act(() => root.unmount());
});
