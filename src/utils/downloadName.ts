/**
 * Download name for a converted file. One path segment, no parent
 * references. Browsers also sanitize this. Do it here as well.
 */
export function jsonDownloadName(fileName: string): string {
  const leaf = fileName.split(/[/\\]/).filter((part) => part.length > 0).pop() ?? '';
  const noExt = leaf.replace(/\.[^./\\]+$/, '');
  const cleaned = noExt.replace(/\.\./g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return `${cleaned.length > 0 ? cleaned : 'converted'}.json`;
}
