/**
 * Production Content-Security-Policy.
 *
 * script-src is 'self' only. The production build sets INLINE_RUNTIME_CHUNK=false
 * so Create React App does not inject an inline webpack runtime.
 * style-src allows 'unsafe-inline' because the upload input uses a style
 * attribute and CodeMirror injects <style> tags.
 * frame-ancestors is enforced on hosts that send this as an HTTP header.
 * A meta tag ignores frame-ancestors.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const REFERRER_POLICY = 'strict-origin-when-cross-origin';

module.exports = { CONTENT_SECURITY_POLICY, REFERRER_POLICY };
