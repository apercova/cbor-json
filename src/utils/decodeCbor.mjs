import { decode } from 'cborg';
import limits from '../constants/limits.js';

const DEFAULT_MAX_DEPTH = 128;
const { MAX_INPUT_BYTES } = limits;
const INTERNAL_TAG = Symbol('decoded-cbor-tag');
const INTERNAL_INTEGER = Symbol('raw-json-integer');

export class CborDecodeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CborDecodeError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new CborDecodeError(code, message);
}

function readArgument(bytes, cursor, additional) {
  if (additional < 24) return additional;
  const byteLength = additional === 24 ? 1 : additional === 25 ? 2 : additional === 26 ? 4 : additional === 27 ? 8 : 0;
  if (!byteLength && additional === 31) return Infinity;
  if (!byteLength) fail('INVALID_CBOR', 'Reserved CBOR additional information value.');
  if (cursor.offset + byteLength > bytes.length) fail('INVALID_CBOR', 'CBOR input is truncated.');
  let value = 0;
  for (let i = 0; i < byteLength; i++) value = value * 256 + bytes[cursor.offset++];
  return Number.isSafeInteger(value) ? value : Number.MAX_SAFE_INTEGER + 1;
}

function scanItem(bytes, cursor, depth, maxDepth) {
  if (depth > maxDepth) fail('NESTING_LIMIT', `CBOR nesting exceeds the limit of ${maxDepth}.`);
  if (cursor.offset >= bytes.length) fail('INVALID_CBOR', 'CBOR input is truncated.');
  const initial = bytes[cursor.offset++];
  const major = initial >>> 5;
  const additional = initial & 31;
  if (major === 7) {
    if (additional === 24) cursor.offset += 1;
    else if (additional === 25) cursor.offset += 2;
    else if (additional === 26) cursor.offset += 4;
    else if (additional === 27) cursor.offset += 8;
    else if (additional === 31) fail('INVALID_CBOR', 'Unexpected CBOR break marker.');
    if (cursor.offset > bytes.length) fail('INVALID_CBOR', 'CBOR input is truncated.');
    return;
  }
  const length = readArgument(bytes, cursor, additional);
  if (major === 0 || major === 1) return;
  if (major === 2 || major === 3) {
    if (length === Infinity) {
      while (true) {
        if (cursor.offset >= bytes.length) fail('INVALID_CBOR', 'CBOR input is truncated.');
        if (bytes[cursor.offset] === 0xff) {
          cursor.offset++;
          return;
        }
        const chunkHead = bytes[cursor.offset++];
        if ((chunkHead >>> 5) !== major || (chunkHead & 31) === 31) {
          fail('INVALID_CBOR', 'Invalid chunk in an indefinite-length CBOR string.');
        }
        const chunkLength = readArgument(bytes, cursor, chunkHead & 31);
        if (typeof chunkLength !== 'number' || cursor.offset + chunkLength > bytes.length) {
          fail('INVALID_CBOR', 'CBOR input is truncated.');
        }
        cursor.offset += chunkLength;
      }
    }
    if (typeof length !== 'number' || cursor.offset + length > bytes.length) fail('INVALID_CBOR', 'CBOR input is truncated.');
    cursor.offset += length;
    return;
  }
  if (major === 4 || major === 5) {
    const childCount = major === 5 && length !== Infinity ? length * 2 : length;
    if (childCount === Infinity) {
      let childCountSeen = 0;
      while (cursor.offset < bytes.length && bytes[cursor.offset] !== 0xff) {
        scanItem(bytes, cursor, depth + 1, maxDepth);
        childCountSeen++;
      }
      if (cursor.offset >= bytes.length) fail('INVALID_CBOR', 'CBOR input is truncated.');
      if (major === 5 && childCountSeen % 2 !== 0) fail('INVALID_CBOR', 'Indefinite-length CBOR map has a key without a value.');
      cursor.offset++;
      return;
    }
    if (typeof childCount !== 'number' || childCount > bytes.length) fail('INVALID_CBOR', 'Invalid CBOR container length.');
    for (let i = 0; i < childCount; i++) scanItem(bytes, cursor, depth + 1, maxDepth);
    return;
  }
  if (major === 6) {
    scanItem(bytes, cursor, depth + 1, maxDepth);
    return;
  }
  fail('INVALID_CBOR', 'Invalid CBOR major type.');
}

function validateDepth(bytes, maxDepth) {
  const cursor = { offset: 0 };
  scanItem(bytes, cursor, 0, maxDepth);
  if (cursor.offset !== bytes.length) fail('INVALID_CBOR', 'CBOR input contains trailing data.');
}

function bytesToBase64(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes[i + 1] : 0;
    const c = hasC ? bytes[i + 2] : 0;
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | (b >> 4)];
    output += hasB ? alphabet[((b & 15) << 2) | (c >> 6)] : '=';
    output += hasC ? alphabet[c & 63] : '=';
  }
  return output;
}

function taggedValue(tag, value) {
  return { [INTERNAL_TAG]: true, tag, value };
}

function formatDate(value, timezone, tag) {
  let date;
  if (tag === 0 && typeof value === 'string') date = new Date(value);
  else if (tag === 1 && typeof value === 'number' && Number.isFinite(value)) date = new Date(value * 1000);
  else fail('INVALID_TIMESTAMP', `CBOR timestamp tag ${tag} has an invalid value.`);
  if (!Number.isFinite(date.getTime())) fail('INVALID_TIMESTAMP', `CBOR timestamp tag ${tag} is outside the supported date range.`);
  if (timezone.toUpperCase() === 'UTC' || timezone === 'Etc/UTC' || timezone === 'Etc/GMT') {
    return date.toISOString();
  }

  const offsetMatch = timezone.match(/^([+-])(\d{2}):(\d{2})$/);
  if (offsetMatch) {
    const hours = Number(offsetMatch[2]);
    const minutes = Number(offsetMatch[3]);
    if (hours > 23 || minutes > 59) fail('INVALID_TIMEZONE', `Invalid timezone offset: ${timezone}`);
    const offset = (offsetMatch[1] === '+' ? 1 : -1) * (hours * 60 + minutes);
    const shifted = new Date(date.getTime() + offset * 60_000);
    const iso = shifted.toISOString().replace(/Z$/, '');
    return `${iso}${timezone}`;
  }
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    });
  } catch (error) {
    fail('TIMEZONE_FORMAT_FAILED', `Could not format timestamp for timezone ${timezone}: ${error instanceof Error ? error.message : 'unsupported timezone formatter'}`);
  }
  const parts = formatter.formatToParts(date);
  const part = (name) => parts.find((item) => item.type === name)?.value;
  const milliseconds = date.getUTCMilliseconds();
  const wholeSecond = date.getTime() - milliseconds;
  const localAsUtc = Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')), Number(part('hour')), Number(part('minute')), Number(part('second')));
  const offsetMinutes = Math.round((localAsUtc - wholeSecond) / 60_000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteOffset = Math.abs(offsetMinutes);
  const suffix = offsetMinutes === 0
    ? 'Z'
    : `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, '0')}:${String(absoluteOffset % 60).padStart(2, '0')}`;
  const millisecondText = String(milliseconds).padStart(3, '0');
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}.${millisecondText}${suffix}`;
}

function timestampEpoch(value, tag) {
  let date;
  if (tag === 0 && typeof value === 'string') date = new Date(value);
  else if (tag === 1 && typeof value === 'number' && Number.isFinite(value)) date = new Date(value * 1000);
  else fail('INVALID_TIMESTAMP', `CBOR timestamp tag ${tag} has an invalid value.`);
  if (!Number.isFinite(date.getTime())) fail('INVALID_TIMESTAMP', `CBOR timestamp tag ${tag} is outside the supported date range.`);
  return tag === 1 ? value : date.getTime() / 1000;
}

function normalize(value, warnings, strictMapKeys, largeIntegerMode) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('NON_JSON_NUMBER', 'CBOR NaN and Infinity values cannot be represented in JSON.');
    if (Object.is(value, -0)) {
      warnings.push('CBOR negative zero was represented in an explicit tagged form.');
      return { $cbor: 'float', value: '-0' };
    }
    return value;
  }
  if (typeof value === 'bigint') {
    if (largeIntegerMode === 'number') {
      const number = Number(value);
      if (number.toString() !== value.toString()) {
        warnings.push('A large CBOR integer was converted to a JavaScript Number and may be rounded.');
      }
      return number;
    }
    return { [INTERNAL_INTEGER]: value.toString() };
  }
  if (value instanceof Uint8Array) {
    warnings.push('A CBOR byte string was represented as base64.');
    return { $cbor: 'bytes', base64: bytesToBase64(value) };
  }
  if (Array.isArray(value)) return value.map((item) => normalize(item, warnings, strictMapKeys, largeIntegerMode));
  if (value instanceof Map) {
    const result = Object.create(null);
    for (const [key, item] of value) {
      if (typeof key !== 'string' && strictMapKeys) {
        fail('NON_STRING_MAP_KEY', 'CBOR map contains a non-string key; strict map-key mode is enabled.');
      }
      const jsonKey = typeof key === 'string' ? key : String(key);
      if (Object.prototype.hasOwnProperty.call(result, jsonKey)) {
        fail('DUPLICATE_MAP_KEY', `CBOR map contains duplicate key ${JSON.stringify(jsonKey)} after key coercion.`);
      }
      result[jsonKey] = normalize(item, warnings, strictMapKeys, largeIntegerMode);
    }
    return result;
  }
  if (value && value[INTERNAL_TAG]) {
    warnings.push(`CBOR tag ${value.tag} was preserved in an explicit tagged form.`);
    return { $cbor: 'tag', tag: value.tag, value: normalize(value.value, warnings, strictMapKeys, largeIntegerMode) };
  }
  fail('UNSUPPORTED_VALUE', `CBOR value of type ${typeof value} cannot be represented as JSON.`);
}

function stringifyJson(value, depth = 0) {
  if (value && typeof value === 'object' && typeof value[INTERNAL_INTEGER] === 'string') {
    return value[INTERNAL_INTEGER];
  }
  if (value === null || typeof value !== 'object') return JSON.stringify(value);

  const indent = '  '.repeat(depth);
  const childIndent = '  '.repeat(depth + 1);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((item) => `${childIndent}${stringifyJson(item, depth + 1)}`);
    return `[\n${items.join(',\n')}\n${indent}]`;
  }

  const entries = Object.keys(value).map((key) => (
    `${childIndent}${JSON.stringify(key)}: ${stringifyJson(value[key], depth + 1)}`
  ));
  if (entries.length === 0) return '{}';
  return `{\n${entries.join(',\n')}\n${indent}}`;
}

function assertTimezone(timezone) {
  if (/^[+-]\d{2}:\d{2}$/.test(timezone)) {
    const [, , hour, minute] = timezone.match(/^([+-])(\d{2}):(\d{2})$/);
    if (Number(hour) > 23 || Number(minute) > 59) fail('INVALID_TIMEZONE', `Invalid timezone offset: ${timezone}`);
    return;
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
  } catch {
    fail('INVALID_TIMEZONE', `Unknown timezone: ${timezone}`);
  }
}

export function decodeCbor(inputBytes, options = {}) {
  const {
    timezone = 'UTC',
    maxDepth = DEFAULT_MAX_DEPTH,
    strictMapKeys = false,
    largeIntegerMode = 'exact',
    preserveTags = false,
  } = options;
  const timestampFormat = options.timestampFormat
    ?? (options.formatDate === false ? 'tagged' : options.formatDate === true ? 'iso' : 'epoch');
  if (!(inputBytes instanceof Uint8Array)) fail('INVALID_INPUT', 'CBOR input must be a Uint8Array.');
  if (inputBytes.byteLength > MAX_INPUT_BYTES) fail('INPUT_TOO_LARGE', 'CBOR input exceeds the 100 MiB limit.');
  if (!Number.isInteger(maxDepth) || maxDepth < 1) fail('INVALID_OPTIONS', 'Maximum nesting depth must be a positive integer.');
  if (!['epoch', 'iso', 'tagged'].includes(timestampFormat)) {
    fail('INVALID_OPTIONS', 'Timestamp format must be epoch, iso, or tagged.');
  }
  if (!['exact', 'number'].includes(largeIntegerMode)) {
    fail('INVALID_OPTIONS', 'Large integer mode must be exact or number.');
  }
  if (timestampFormat === 'iso') assertTimezone(timezone);
  const bytes = new Uint8Array(inputBytes);
  validateDepth(bytes, maxDepth);
  const warnings = [];
  const standardTags = {
    0: (decodeValue) => {
      const value = decodeValue();
      if (timestampFormat === 'tagged') return taggedValue(0, value);
      return timestampFormat === 'iso' ? formatDate(value, timezone, 0) : timestampEpoch(value, 0);
    },
    1: (decodeValue) => {
      const value = decodeValue();
      if (timestampFormat === 'tagged') return taggedValue(1, value);
      return timestampFormat === 'iso' ? formatDate(value, timezone, 1) : timestampEpoch(value, 1);
    },
    2: (decodeValue) => taggedValue(2, decodeValue()),
    3: (decodeValue) => taggedValue(3, decodeValue()),
    4: () => fail('UNSUPPORTED_DECIMAL', 'CBOR decimal fractions (tag 4) are not supported by JSON output.'),
    5: () => fail('UNSUPPORTED_DECIMAL', 'CBOR bigfloats (tag 5) are not supported by JSON output.'),
  };
  const tags = preserveTags
    ? new Proxy(Object.create(null), {
      get: (_target, property) => {
        if (typeof property !== 'string' || !/^\d+$/.test(property)) return undefined;
        const numericTag = Number(property);
        const tag = Number.isSafeInteger(numericTag)
          ? numericTag
          : { [INTERNAL_INTEGER]: property };
        return (decodeValue) => taggedValue(tag, decodeValue());
      },
    })
    : standardTags;
  let decoded;
  try {
    decoded = decode(bytes, {
      allowBigInt: true,
      allowUndefined: false,
      allowInfinity: false,
      allowNaN: false,
      useMaps: true,
      rejectDuplicateMapKeys: true,
      tags,
    });
  } catch (error) {
    if (error instanceof CborDecodeError) throw error;
    const tagMatch = error instanceof Error && error.message.match(/tag not supported \((\d+)\)/);
    if (tagMatch) fail('UNSUPPORTED_TAG', `CBOR tag ${tagMatch[1]} is not supported.`);
    if (error instanceof Error && /repeat map key/.test(error.message)) fail('DUPLICATE_MAP_KEY', 'CBOR map contains a duplicate key.');
    if (error instanceof Error && /non-string keys/.test(error.message)) fail('NON_STRING_MAP_KEY', 'CBOR maps with non-string keys cannot be represented as JSON objects.');
    if (error instanceof Error && /undefined/.test(error.message)) fail('UNSUPPORTED_UNDEFINED', 'CBOR undefined values cannot be represented in JSON.');
    if (error instanceof Error && /float|Infinity|NaN/i.test(error.message)) fail('NON_JSON_NUMBER', 'CBOR NaN and Infinity values cannot be represented in JSON.');
    fail('INVALID_CBOR', error instanceof Error ? `Invalid CBOR: ${error.message}` : 'Invalid CBOR input.');
  }
  const jsonValue = normalize(decoded, warnings, strictMapKeys, largeIntegerMode);
  return { jsonText: stringifyJson(jsonValue), warnings };
}
