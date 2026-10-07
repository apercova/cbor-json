/**
 * Download name for a converted file. One path segment, no parent
 * references. Browsers also sanitize this. Do it here as well.
 */
export function jsonDownloadName(fileName: string): string {
  const leaf = fileName.split(/[/\\]/).filter((part) => part.length > 0).pop() ?? '';
  const noExt = leaf.replace(/\.[^./\\]+$/, '');
  const cleaned = noExt
    .replace(/\.\./g, '')
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join('')
    .trim();
  return `${cleaned.length > 0 ? cleaned : 'converted'}.json`;
}
