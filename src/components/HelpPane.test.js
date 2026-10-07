const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const HelpPane = require('./HelpPane').default;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it('shows the converter library attributions in the help pane', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(HelpPane)));

  expect(container.textContent).toContain('Powered by');
  expect(container.textContent).toContain('About');
  expect(container.textContent).toContain('Your files stay on your device.');
  expect(container.textContent).toContain('Made with ❤️ by apercova');
  expect(container.querySelector('a[href="https://buymeacoffee.com/apercova"]')).not.toBeNull();
  expect(container.querySelector('a[href="https://github.com/rvagg/cborg"]')).not.toBeNull();
  expect(container.querySelector('a[href="https://codemirror.net/"]')).not.toBeNull();

  act(() => root.unmount());
});
