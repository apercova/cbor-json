const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockOpenFileDialog = jest.fn();

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
jest.mock('./components/FileUploadPanel', () => {
  const ReactModule = require('react');
  return ReactModule.forwardRef((props, ref) => {
    ReactModule.useImperativeHandle(ref, () => ({ openFileDialog: mockOpenFileDialog }));
    return ReactModule.createElement('div', null,
      ReactModule.createElement('button', {
        'data-testid': 'convert',
        onClick: () => props.onCborConverted('{\n  "ok": true\n}', [], 'sample.cbor'),
      }, 'Convert'),
      ReactModule.createElement('button', {
        'data-testid': 'fail',
        onClick: () => {
          props.onError('Decode failed');
          props.onFileProcessingError();
        },
      }, 'Fail'),
      ReactModule.createElement('button', {
        'data-testid': 'start',
        onClick: props.onFileProcessingStart,
      }, 'Start'));
  });
});
jest.mock('./components/JsonDisplayPanel', () => () => null);
jest.mock('./components/SettingsPane', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./components/HelpPane', () => () => null);

const App = require('./App').default;
const { saveAs } = require('file-saver');

it('shows file actions only when their output state is available', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(App)));

  expect(container.querySelector('[aria-label="Save JSON"]')).toBeNull();
  expect(container.querySelector('[aria-label="Open file"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Clear output"]')).toBeNull();

  act(() => container.querySelector('[data-testid="convert"]').click());
  expect(container.querySelector('[aria-label="Save JSON"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Open file"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Clear output"]')).not.toBeNull();

  act(() => container.querySelector('[aria-label="Save JSON"]').click());
  expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'sample.json');

  act(() => container.querySelector('[aria-label="Clear output"]').click());
  expect(container.querySelector('[aria-label="Save JSON"]')).toBeNull();
  expect(container.querySelector('[aria-label="Open file"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Clear output"]')).toBeNull();

  act(() => container.querySelector('[data-testid="convert"]').click());
  act(() => container.querySelector('[aria-label="Open file"]').click());
  expect(mockOpenFileDialog).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-label="Save JSON"]')).toBeNull();
  act(() => root.unmount());
});

it('shows only New when the output state contains a decode error', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(App)));
  act(() => container.querySelector('[data-testid="fail"]').click());

  expect(container.querySelector('[aria-label="Save JSON"]')).toBeNull();
  expect(container.querySelector('[aria-label="Open file"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Clear output"]')).toBeNull();
  act(() => root.unmount());
});

it('keeps New and Clear visible but disabled while a file is processing', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(App)));
  act(() => container.querySelector('[data-testid="start"]').click());

  expect(container.querySelector('[aria-label="Open file"]').disabled).toBe(true);
  expect(container.querySelector('[aria-label="Clear output"]').disabled).toBe(true);
  expect(container.querySelector('[aria-label="Save JSON"]')).toBeNull();
  act(() => root.unmount());
});
