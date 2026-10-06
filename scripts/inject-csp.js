#!/usr/bin/env node

/**
 * Insert the production Content-Security-Policy into build/index.html.
 * Fails if the HTML still contains an inline script, because script-src
 * is 'self' and does not allow inline scripts.
 */

const fs = require('fs');
const path = require('path');
const { CONTENT_SECURITY_POLICY } = require('../src/constants/contentSecurityPolicy');

const INLINE_SCRIPT = /<script\b(?![^>]*\bsrc\s*=)[^>]*>/i;

function injectSecurityMeta(html) {
  if (INLINE_SCRIPT.test(html)) {
    throw new Error(
      'Production HTML contains an inline script. Refusing to add script-src \'self\'. ' +
        'Build with INLINE_RUNTIME_CHUNK=false.'
    );
  }
  if (html.includes('http-equiv="Content-Security-Policy"')) {
    return html;
  }
  const tag = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;
  if (!html.includes('<head>')) {
    throw new Error('Production HTML has no <head>.');
  }
  return html.replace('<head>', `<head>\n    ${tag}`);
}

function main() {
  const htmlPath = path.join(__dirname, '..', 'build', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(htmlPath, injectSecurityMeta(html));
  console.log(`Injected Content-Security-Policy into ${htmlPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

module.exports = { injectSecurityMeta };
