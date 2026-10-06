import { MAX_INPUT_BYTES, fileTooLargeMessage } from './limits';

describe('fileTooLargeMessage', () => {
  it('accepts a file at the cap', () => {
    expect(MAX_INPUT_BYTES).toBe(100 * 1024 * 1024);
    expect(fileTooLargeMessage(MAX_INPUT_BYTES)).toBeNull();
  });

  it('rejects one byte over the cap before any read', () => {
    expect(fileTooLargeMessage(MAX_INPUT_BYTES + 1)).toMatch(/too large/i);
    expect(fileTooLargeMessage(MAX_INPUT_BYTES + 1)).toMatch(/100 MiB/);
  });
});
