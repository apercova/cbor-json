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
