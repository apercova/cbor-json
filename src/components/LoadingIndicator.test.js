const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const LoadingIndicator = require('./LoadingIndicator').default;

it('announces loading status and exposes indeterminate progress', () => {
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(React.createElement(LoadingIndicator, { message: 'Processing file...' })));

  expect(container.querySelector('[role="status"]').getAttribute('aria-live')).toBe('polite');
  expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuetext')).toBe('In progress');
  expect(container.querySelector('[role="progressbar"]').hasAttribute('aria-valuenow')).toBe(false);

  act(() => root.unmount());
});
