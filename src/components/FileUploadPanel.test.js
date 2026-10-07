const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockOpenFileDialog = jest.fn();

jest.mock('../hooks/useFileHandler', () => ({
  useFileHandler: () => ({
    handleFile: jest.fn(),
    fileInputProps: { type: 'file' },
    openFileDialog: mockOpenFileDialog,
  }),
}));

const FileUploadPanel = require('./FileUploadPanel').default;

it('offers a keyboard accessible button to choose a file', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(FileUploadPanel, {
    onCborConverted: jest.fn(),
    onFileProcessingStart: jest.fn(),
    onFileProcessingError: jest.fn(),
    onError: jest.fn(),
    decodeOptions: {},
  })));

  const button = container.querySelector('.upload-trigger');
  expect(button.tagName).toBe('BUTTON');
  expect(button.disabled).toBe(false);
  act(() => button.click());
  expect(mockOpenFileDialog).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
});

it('opens the file chooser when clicking the upload area outside its controls', () => {
  mockOpenFileDialog.mockClear();
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(FileUploadPanel, {
    onCborConverted: jest.fn(),
    onFileProcessingStart: jest.fn(),
    onFileProcessingError: jest.fn(),
    onError: jest.fn(),
    decodeOptions: {},
  })));

  act(() => container.querySelector('.upload-area').click());
  expect(mockOpenFileDialog).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
});

it('hides the upload area after a file has been decoded', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(React.createElement(FileUploadPanel, {
    onCborConverted: jest.fn(),
    onFileProcessingStart: jest.fn(),
    onFileProcessingError: jest.fn(),
    onError: jest.fn(),
    decodeOptions: {},
    hidden: true,
  })));

  const uploadPanel = container.querySelector('.panel');
  expect(uploadPanel.hidden).toBe(true);
  act(() => root.unmount());
});

it('clears the uploaded filename when the parent resets the upload state', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const ref = React.createRef();
  act(() => root.render(React.createElement(FileUploadPanel, {
    ref,
    onCborConverted: jest.fn(),
    onFileProcessingStart: jest.fn(),
    onFileProcessingError: jest.fn(),
    onError: jest.fn(),
    decodeOptions: {},
  })));

  const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(dropEvent, 'dataTransfer', {
    value: { files: [new File(['data'], 'sample.cbor')] },
  });
  act(() => container.querySelector('.upload-area').dispatchEvent(dropEvent));
  expect(container.querySelector('.file-info').textContent).toContain('sample.cbor');

  act(() => ref.current.resetUploadedFile());
  expect(container.querySelector('.file-info')).toBeNull();
  act(() => root.unmount());
});
