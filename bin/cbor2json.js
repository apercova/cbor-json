#!/usr/bin/env node

/**
 * CLI to convert CBOR files to JSON using cbor-js.
 * Usage: cbor2json --in <input.cbor> [--out <output.json>] [--fd] [--tz <timezone>]
 *
 * If --out is omitted, the output is saved to the current directory
 * with the input filename and .json extension.
 *
 * --fd (format-date): Format CBOR timestamp tags (0, 1) as ISO 8601 strings
 * --tz <tz>: Timezone for formatted dates. Optional, defaults to UTC.
 *   Examples: UTC, -06:00, +05:30, America/Mexico_City
 */

const fs = require('fs');
const path = require('path');
const CBOR = require('cbor-js');

function parseArgs() {
  const args = process.argv.slice(2);
  let inFile = null;
  let outFile = null;
  let formatDate = false;
  let timezone = 'UTC';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--in' && args[i + 1]) {
      inFile = args[++i];
    } else if (args[i] === '--out' && args[i + 1]) {
      outFile = args[++i];
    } else if (args[i] === '--fd') {
      formatDate = true;
    } else if (args[i] === '--tz' && args[i + 1]) {
      timezone = args[++i];
    }
  }

  return { inFile, outFile, formatDate, timezone };
}

/**
 * Format a Date to ISO 8601 string in the given timezone.
 * @param {Date} date
 * @param {string} tz - UTC, offset (-06:00, +05:30), or IANA (America/Mexico_City)
 */
function formatDateISO(date, tz) {
  if (!tz || tz.toUpperCase() === 'UTC') {
    return date.toISOString();
  }

  const pad = (n, len = 2) => n.toString().padStart(len, '0');

  // Offset format: -06:00, +05:30, -06, +5
  const offsetMatch = tz.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1;
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3] || '0', 10);
    const offsetMinutes = sign * (hours * 60 + minutes);
    // local time = UTC + offset (e.g. UTC 20:00 + (-360 min) = 14:00 for -06:00)
    const localMs = date.getTime() + offsetMinutes * 60 * 1000;
    const local = new Date(localMs);
    const iso =
      local.getUTCFullYear() + '-' +
      pad(local.getUTCMonth() + 1) + '-' +
      pad(local.getUTCDate()) + 'T' +
      pad(local.getUTCHours()) + ':' +
      pad(local.getUTCMinutes()) + ':' +
      pad(local.getUTCSeconds()) + '.' +
      pad(local.getUTCMilliseconds(), 3);
    const offsetStr =
      (offsetMinutes >= 0 ? '+' : '-') +
      pad(Math.floor(Math.abs(offsetMinutes) / 60)) + ':' +
      pad(Math.abs(offsetMinutes) % 60);
    return iso + offsetStr;
  }

  // IANA timezone (e.g. America/Mexico_City)
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const obj = {};
    parts.forEach((p) => {
      if (p.type !== 'literal') obj[p.type] = p.value;
    });

    const offsetFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    });
    const offsetParts = offsetFormatter.formatToParts(date);
    const tzPart = offsetParts.find((p) => p.type === 'timeZoneName');
    let offsetStr = 'Z';
    if (tzPart) {
      const gmt = tzPart.value.replace(/^GMT\s*/, '').trim();
      if (gmt && gmt !== '' && gmt !== '+0' && gmt !== '-0') {
        // Match -6, +5:30, -0600, +0530
        const m = gmt.match(/^([+-])(\d{1,2}):?(\d{2})?$/) ||
          gmt.match(/^([+-])(\d{2})(\d{2})$/);
        if (m) {
          const s = m[1] === '+' ? 1 : -1;
          const h = parseInt(m[2], 10);
          const min = parseInt(m[3] || '0', 10);
          const totalMin = s * (h * 60 + min);
          offsetStr =
            (totalMin >= 0 ? '+' : '-') +
            pad(Math.floor(Math.abs(totalMin) / 60)) + ':' +
            pad(Math.abs(totalMin) % 60);
        }
      }
    }

    const iso =
      obj.year + '-' +
      obj.month + '-' +
      obj.day + 'T' +
      obj.hour + ':' +
      obj.minute + ':' +
      obj.second + '.' +
      (obj.fractionalSecond || '000');
    return offsetStr === 'Z' ? iso + 'Z' : iso + offsetStr;
  } catch (e) {
    return date.toISOString();
  }
}

function deriveOutputPath(inputPath) {
  const basename = path.basename(inputPath, path.extname(inputPath));
  return path.join(process.cwd(), `${basename}.json`);
}

function processCborToJson(inputPath, options = {}) {
  const { formatDate = false, timezone = 'UTC' } = options;
  const buffer = fs.readFileSync(inputPath);
  const uint8Array = new Uint8Array(buffer);

  let tagger = undefined;
  if (formatDate) {
    tagger = (value, tag) => {
      if (tag === 0) {
        // Tag 0: date/time string (RFC 3339)
        try {
          return formatDateISO(new Date(value), timezone);
        } catch {
          return value;
        }
      }
      if (tag === 1) {
        // Tag 1: epoch-based date/time (seconds)
        try {
          const date = new Date(typeof value === 'number' ? value * 1000 : value);
          return formatDateISO(date, timezone);
        } catch {
          return value;
        }
      }
      return value;
    };
  }

  const decodedData = CBOR.decode(uint8Array.buffer, tagger);
  return JSON.parse(JSON.stringify(decodedData));
}

function main() {
  const { inFile, outFile, formatDate, timezone } = parseArgs();

  if (!inFile) {
    console.error('Error: --in <file> is required');
    process.exit(1);
  }

  const outputPath = outFile ?? deriveOutputPath(inFile);

  try {
    if (!fs.existsSync(inFile)) {
      console.error(`Error: Input file not found: ${inFile}`);
      process.exit(1);
    }

    const jsonData = processCborToJson(inFile, { formatDate, timezone });
    const jsonString = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(outputPath, jsonString, 'utf8');

    console.log(`Converted ${inFile} -> ${outputPath}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    let userMessage = msg;
    if (msg.toLowerCase().includes('invalid')) {
      userMessage = 'Invalid CBOR file format. Please ensure the file is a valid CBOR file.';
    } else if (msg.toLowerCase().includes('unexpected end')) {
      userMessage = 'File appears to be corrupted or incomplete.';
    } else if (msg.toLowerCase().includes('not supported')) {
      userMessage = 'This CBOR feature is not supported. Try a different CBOR file.';
    }
    console.error(`Error: ${userMessage}`);
    process.exit(1);
  }
}

main();
