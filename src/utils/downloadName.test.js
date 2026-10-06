import { jsonDownloadName } from './downloadName';

describe('jsonDownloadName', () => {
  it('replaces a normal extension', () => {
    expect(jsonDownloadName('sample.cbor')).toBe('sample.json');
  });

  it('keeps a single path segment from a traversal name', () => {
    expect(jsonDownloadName('../../etc/passwd.cbor')).toBe('passwd.json');
    expect(jsonDownloadName('..\\..\\windows\\notes.bin')).toBe('notes.json');
  });

  it('drops parent segments and control characters', () => {
    expect(jsonDownloadName('..')).toBe('converted.json');
    expect(jsonDownloadName('')).toBe('converted.json');
    expect(jsonDownloadName('bad\u0000name.cbor')).toBe('badname.json');
  });
});
