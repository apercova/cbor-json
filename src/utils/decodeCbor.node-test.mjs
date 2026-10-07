import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { decodeCbor } from './decodeCbor.mjs';

const vectors = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'fixtures/rfc8949-appendix-a.json'), 'utf8'));
const decodeHex = (hex, options) => decodeCbor(Uint8Array.from(Buffer.from(hex, 'hex')), options);
const failures = [];
let testCount = 0;

function test(name, run) {
  testCount++;
  try {
    run();
  } catch (error) {
    failures.push({ name, error });
  }
}

for (const { name, hex, json } of vectors) {
  test(`RFC 8949 Appendix A: ${name}`, () => {
    assert.deepEqual(JSON.parse(decodeHex(hex).jsonText), JSON.parse(json));
  });
}

test('copies and decodes only the requested view', () => {
  const backing = Uint8Array.from(Buffer.from('ff8101ff', 'hex'));
  assert.deepEqual(JSON.parse(decodeCbor(backing.subarray(1, 3)).jsonText), [1]);
});

test('accepts valid non-preferred integer encodings', () => {
  assert.equal(JSON.parse(decodeHex('1801').jsonText), 1);
});

test('preserves negative zero explicitly instead of JSON.stringify coercion', () => {
  const result = decodeHex('f98000');
  assert.deepEqual(JSON.parse(result.jsonText), { $cbor: 'float', value: '-0' });
  assert.equal(result.warnings.length, 1);
});

test('decodes indefinite-length arrays and maps', () => {
  assert.deepEqual(JSON.parse(decodeHex('9f010203ff').jsonText), [1, 2, 3]);
  assert.deepEqual(JSON.parse(decodeHex('bf616101ff').jsonText), { a: 1 });
});

test('coerces non-string map keys to strings by default', () => {
  assert.deepEqual(JSON.parse(decodeHex('a10102').jsonText), { '1': 2 });
});

test('strict map-key mode rejects non-string keys and coercion collisions', () => {
  assert.throws(
    () => decodeHex('a10102', { strictMapKeys: true }),
    (error) => error.code === 'NON_STRING_MAP_KEY'
  );
  assert.throws(
    () => decodeHex('a20102613103'),
    (error) => error.code === 'DUPLICATE_MAP_KEY'
  );
});

test('represents timestamp tags as epoch seconds by default', () => {
  const result = decodeHex('c1fb41d8d3af8e327efa');
  assert.equal(JSON.parse(result.jsonText), 1666104888.789);
  assert.equal(result.warnings.length, 0);
});

test('supports ISO strings and explicit tagged timestamp forms', () => {
  assert.equal(JSON.parse(decodeHex('c100', { timestampFormat: 'iso', timezone: 'UTC' }).jsonText), '1970-01-01T00:00:00.000Z');
  const tagged = decodeHex('c100', { preserveTags: true, timestampFormat: 'iso' });
  assert.deepEqual(JSON.parse(tagged.jsonText), { $cbor: 'tag', tag: 1, value: 0 });
  assert.equal(tagged.warnings.length, 1);
});

test('global tag representation preserves unsupported and known tags', () => {
  assert.deepEqual(JSON.parse(decodeHex('c4822001', { preserveTags: true }).jsonText), {
    $cbor: 'tag', tag: 4, value: [-1, 1],
  });
  assert.deepEqual(JSON.parse(decodeHex('d9ea6000', { preserveTags: true }).jsonText), {
    $cbor: 'tag', tag: 60000, value: 0,
  });
  assert.equal(decodeHex('dbffffffffffffffff00', { preserveTags: true }).jsonText, '{\n  "$cbor": "tag",\n  "tag": 18446744073709551615,\n  "value": 0\n}');
});

test('preserves bignum tags and their byte payload with warnings', () => {
  const result = decodeHex('c249010000000000000000');
  assert.deepEqual(JSON.parse(result.jsonText), {
    $cbor: 'tag',
    tag: 2,
    value: { $cbor: 'bytes', base64: 'AQAAAAAAAAAA' },
  });
  assert.equal(result.warnings.length, 2);
});

test('preserves large CBOR integers as exact unquoted JSON number tokens by default', () => {
  assert.equal(decodeHex('1b0020000000000000').jsonText, '9007199254740992');
  assert.equal(decodeHex('1b0de0b6b3a762c84d').jsonText, '999999999999920205');
  assert.equal(decodeHex('1b0de0b6b3a9b8896a').jsonText, '1000000000039094634');
  assert.deepEqual(decodeHex('1b0020000000000000').warnings, []);
});

test('warns when number mode rounds a large CBOR integer', () => {
  assert.deepEqual(decodeHex('1b0020000000000000', { largeIntegerMode: 'number' }).warnings, []);
  const result = decodeHex('1b0de0b6b3a762c84d', { largeIntegerMode: 'number' });
  assert.equal(result.jsonText, '999999999999920300');
  assert.deepEqual(result.warnings, ['A large CBOR integer was converted to a JavaScript Number and may be rounded.']);
});

test('rejects invalid timezones when date formatting is enabled', () => {
  assert.throws(() => decodeHex('c100', { timestampFormat: 'iso', timezone: 'Mars/Olympus' }), /Unknown timezone: Mars\/Olympus/);
});

test('formats timestamps in an IANA timezone with the applicable offset', () => {
  assert.equal(
    JSON.parse(decodeHex('c100', { timestampFormat: 'iso', timezone: 'America/Mexico_City' }).jsonText),
    '1969-12-31T18:00:00.000-06:00'
  );
});

for (const [name, hex, code] of [
  ['NaN', 'f97e00', 'NON_JSON_NUMBER'],
  ['infinity', 'f97c00', 'NON_JSON_NUMBER'],
  ['duplicate map keys', 'a2616101616102', 'DUPLICATE_MAP_KEY'],
  ['decimal fraction tag', 'c4822001', 'UNSUPPORTED_DECIMAL'],
  ['unknown tag', 'd9ea6000', 'UNSUPPORTED_TAG'],
  ['undefined', 'f7', 'UNSUPPORTED_UNDEFINED'],
]) {
  test(`rejects ${name} with a stable error code`, () => {
    assert.throws(() => decodeHex(hex), (error) => error.code === code);
  });
}

test('keeps __proto__ as a JSON data key without changing prototypes', () => {
  const value = JSON.parse(decodeHex('a1695f5f70726f746f5f5f01').jsonText);
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  assert.equal(Object.prototype.hasOwnProperty.call(value, '__proto__'), true);
});

test('rejects input nested beyond the configured limit before decoding', () => {
  const deep = Uint8Array.from(Buffer.from('81818100', 'hex'));
  assert.throws(() => decodeCbor(deep, { maxDepth: 2 }), /nesting exceeds the limit of 2/);
});

if (failures.length > 0) {
  for (const { name, error } of failures) console.error(`FAIL ${name}:`, error);
  console.error(`# tests ${testCount}\n# fail ${failures.length}`);
  process.exitCode = 1;
} else {
  console.log(`# tests ${testCount}\n# fail 0`);
}
