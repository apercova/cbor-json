const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ErrorBoundary = require('./ErrorBoundary').default;

it('shows a recovery message when a child throws during render', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const originalError = console.error;
  console.error = jest.fn();
  const BrokenChild = () => { throw new Error('render failure'); };

  act(() => root.render(React.createElement(ErrorBoundary, null, React.createElement(BrokenChild))));

  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(container.textContent).toContain('Refresh to try again');
  act(() => root.unmount());
  console.error = originalError;
});
