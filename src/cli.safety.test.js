import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CONTENT_SECURITY_POLICY, REFERRER_POLICY } from './constants/contentSecurityPolicy';
import { injectSecurityMeta } from '../scripts/inject-csp';

const cli = path.join(process.cwd(), 'bin', 'cbor2json.js');

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

describe('cbor2json safety', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cbor-p1-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prints help and documents that paths are used as given', () => {
    const result = run(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/--force/);
    expect(result.stdout).toMatch(/--preserve-tags/);
    expect(result.stdout).toMatch(/--large-integer-mode/);
    expect(result.stdout).toMatch(/--strict-map-keys/);
    expect(result.stdout).toMatch(/Paths are used as given/);
    expect(result.stdout).toMatch(/100 MiB/);
  });

  it('requires --in', () => {
    const result = run([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--in/);
  });

  it('rejects unknown flags', () => {
    const input = path.join(dir, 'in.cbor');
    fs.writeFileSync(input, Buffer.from([0xa0]));
    const result = run(['--in', input, '--bogus']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown argument: --bogus/);
  });

  it('accepts a timezone that starts with a dash', () => {
    const input = path.join(dir, 'in.cbor');
    const output = path.join(dir, 'out.json');
    fs.writeFileSync(input, Buffer.from([0xc1, 0x00]));
    const result = run(['--in', input, '--out', output, '--fd', '--tz', '-06:00']);
    expect(result.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toBe('1969-12-31T18:00:00.000-06:00');
  });

  it('writes timestamps as epoch seconds by default', () => {
    const input = path.join(dir, 'timestamp-epoch.cbor');
    const output = path.join(dir, 'timestamp-epoch.json');
    fs.writeFileSync(input, Buffer.from('c1fb41d8d3af8e327efa', 'hex'));
    const result = run(['--in', input, '--out', output]);
    expect(result.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toBe(1666104888.789);
  });

  it('preserves every tag when --preserve-tags is set', () => {
    const input = path.join(dir, 'tag.cbor');
    const output = path.join(dir, 'tag.json');
    fs.writeFileSync(input, Buffer.from([0xc1, 0x00]));
    const result = run(['--in', input, '--out', output, '--preserve-tags', '--fd', '--tz', 'Mars/Olympus']);

    expect(result.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual({ $cbor: 'tag', tag: 1, value: 0 });
    expect(result.stderr).toMatch(/CBOR tag 1 was preserved/);
  });

  it('supports JavaScript Number conversion for large integers and warns on rounding', () => {
    const input = path.join(dir, 'large-integer.cbor');
    const output = path.join(dir, 'large-integer.json');
    const exactOutput = path.join(dir, 'large-integer-exact.json');
    fs.writeFileSync(input, Buffer.from('1b0de0b6b3a9b8896a', 'hex'));

    const exact = run(['--in', input, '--out', exactOutput]);
    expect(exact.status).toBe(0);
    expect(fs.readFileSync(exactOutput, 'utf8')).toBe('1000000000039094634');
    expect(exact.stderr).not.toMatch(/rounded/);

    const result = run(['--in', input, '--out', output, '--large-integer-mode', 'number']);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(output, 'utf8')).toBe('1000000000039094700');
    expect(result.stderr).toMatch(/converted to a JavaScript Number and may be rounded/);
  });

  it('rejects non-string map keys in strict mode', () => {
    const input = path.join(dir, 'map.cbor');
    const output = path.join(dir, 'map.json');
    fs.writeFileSync(input, Buffer.from([0xa1, 0x01, 0x61, 0x61]));
    const result = run(['--in', input, '--out', output, '--strict-map-keys']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/NON_STRING_MAP_KEY/);
    expect(fs.existsSync(output)).toBe(false);
  });

  it('coerces non-string map keys by default', () => {
    const input = path.join(dir, 'map-default.cbor');
    const output = path.join(dir, 'map-default.json');
    fs.writeFileSync(input, Buffer.from([0xa1, 0x01, 0x61, 0x61]));
    const result = run(['--in', input, '--out', output]);

    expect(result.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual({ 1: 'a' });
  });

  it('rejects an unknown large-integer mode', () => {
    const result = run(['--large-integer-mode', 'approximate']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/must be exact or number/);
  });

  it('encodes byte strings explicitly and reports a warning on stderr', () => {
    const input = path.join(dir, 'bytes.cbor');
    const output = path.join(dir, 'bytes.json');
    fs.writeFileSync(input, Buffer.from([0x41, 0xff]));
    const result = run(['--in', input, '--out', output]);
    expect(result.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual({ $cbor: 'bytes', base64: '/w==' });
    expect(result.stderr).toMatch(/Warning: A CBOR byte string was represented as base64/);
  });

  it('rejects an invalid timezone instead of silently formatting as UTC', () => {
    const input = path.join(dir, 'timestamp.cbor');
    const output = path.join(dir, 'timestamp.json');
    fs.writeFileSync(input, Buffer.from([0xc1, 0x00]));
    const result = run(['--in', input, '--out', output, '--fd', '--tz', 'Mars/Olympus']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/INVALID_TIMEZONE: Unknown timezone/);
    expect(fs.existsSync(output)).toBe(false);
  });

  it('refuses to overwrite unless --force is set', () => {
    const input = path.join(dir, 'in.cbor');
    const output = path.join(dir, 'out.json');
    fs.writeFileSync(input, Buffer.from([0xa0]));
    fs.writeFileSync(output, 'keep-me');

    const blocked = run(['--in', input, '--out', output]);
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toMatch(/already exists/);
    expect(fs.readFileSync(output, 'utf8')).toBe('keep-me');

    const forced = run(['--in', input, '--out', output, '--force']);
    expect(forced.status).toBe(0);
    expect(fs.readFileSync(output, 'utf8')).toMatch(/\{\s*\}/);
  });

  it('rejects an oversize file before reading it', () => {
    const input = path.join(dir, 'big.cbor');
    fs.writeFileSync(input, Buffer.from([0xa0]));
    fs.truncateSync(input, 100 * 1024 * 1024 + 1);
    const output = path.join(dir, 'out.json');

    const started = Date.now();
    const result = run(['--in', input, '--out', output]);
    const elapsed = Date.now() - started;

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/too large/i);
    expect(fs.existsSync(output)).toBe(false);
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('production security metadata', () => {
  it('injects the policy and refuses inline scripts', () => {
    const html = '<!DOCTYPE html><html><head><title>x</title></head><body><script src="/static/js/main.js"></script></body></html>';
    const injected = injectSecurityMeta(html);
    expect(injected).toContain(CONTENT_SECURITY_POLICY);
    expect(injected).not.toMatch(/<script\b(?![^>]*\bsrc\s*=)/i);

    expect(() => injectSecurityMeta('<html><head></head><script>alert(1)</script></html>')).toThrow(/inline script/);
  });

  it('keeps the host header files on the same policy', () => {
    const vercel = fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8');
    const netlify = fs.readFileSync(path.join(process.cwd(), 'public', '_headers'), 'utf8');
    expect(vercel).toContain(CONTENT_SECURITY_POLICY);
    expect(vercel).toContain(REFERRER_POLICY);
    expect(vercel).toContain('nosniff');
    expect(netlify).toContain(CONTENT_SECURITY_POLICY);
    expect(netlify).toContain(REFERRER_POLICY);
    expect(netlify).toContain('nosniff');
  });
});
