#!/usr/bin/env node

/**
 * CLI to convert CBOR files to JSON using cbor-js.
 * Usage: cbor2json --in <input.cbor> [--out <output.json>] [--force] [--fd] [--tz <timezone>]
 *
 * Paths are used as given. This process reads and writes those paths with
 * the permissions of the user who runs it. It does not confine writes to
 * the current directory.
 *
 * If --out is omitted, the output is saved to the current directory
 * with the input filename and .json extension. An existing output file
 * is left untouched unless --force is passed.
 *
 * --fd (format-date): Format CBOR timestamp tags (0, 1) as ISO 8601 strings
 * --tz <tz>: Timezone for formatted dates. Optional, defaults to UTC.
 *   Examples: UTC, -06:00, +05:30, America/Mexico_City
 */

const fs = require('fs');
const path = require('path');
const CBOR = require('cbor-js');
const { fileTooLargeMessage, MAX_INPUT_BYTES } = require('../src/constants/limits');

const HELP = `Usage: cbor2json --in <input.cbor> [--out <output.json>] [--force] [--fd] [--tz <timezone>]

Convert a CBOR file to JSON.

Paths are used as given. The tool reads the input path and writes the output
path with your user permissions. It does not confine writes to the current
directory.

The input must be a regular file of at most ${MAX_INPUT_BYTES} bytes (100 MiB).
The size is checked before the file is read.

Options:
  --in <file>    CBOR input file (required)
  --out <file>   JSON output file (optional; default is <input-name>.json in the
                 current directory)
  --force        Overwrite the output file if it already exists
  --fd           Format CBOR timestamp tags (0, 1) as ISO 8601 strings
  --tz <tz>      Timezone for formatted dates (default UTC).
                 Examples: UTC, -06:00, +05:30, America/Mexico_City
  --help, -h     Show this help

Unknown flags are an error.
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    inFile: null,
    outFile: null,
    formatDate: false,
    timezone: 'UTC',
    force: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--in') {
      result.inFile = requireValue(args, i, '--in');
      i++;
    } else if (arg === '--out') {
      result.outFile = requireValue(args, i, '--out');
      i++;
    } else if (arg === '--fd') {
      result.formatDate = true;
    } else if (arg === '--tz') {
      result.timezone = requireValue(args, i, '--tz');
      i++;
    } else if (arg === '--force') {
      result.force = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return result;
}

function requireValue(args, index, flag) {
  if (index + 1 >= args.length) {
    throw new Error(`${flag} requires a value`);
  }
  return args[index + 1];
}

/**
 * Stat the input and refuse anything that should not be read.
 * Returns an error message, or null when the file may be read.
 * Does not read the file.
 * @param {string} inputPath
 * @returns {string | null}
 */
function rejectIfUnreadable(inputPath) {
  if (!fs.existsSync(inputPath)) {
    return `Input file not found: ${inputPath}`;
  }
  const stat = fs.statSync(inputPath);
  if (!stat.isFile()) {
    return `Input path is not a file: ${inputPath}`;
  }
  return fileTooLargeMessage(stat.size);
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

function main(argv = process.argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error: ${msg}`);
    console.error('Run cbor2json --help for usage.');
    process.exit(1);
  }

  if (parsed.help) {
    console.log(HELP);
    return;
  }

  const { inFile, outFile, formatDate, timezone, force } = parsed;

  if (!inFile) {
    console.error('Error: --in <file> is required');
    console.error('Run cbor2json --help for usage.');
    process.exit(1);
  }

  const outputPath = outFile ?? deriveOutputPath(inFile);
  const unreadable = rejectIfUnreadable(inFile);
  if (unreadable) {
    console.error(`Error: ${unreadable}`);
    process.exit(1);
  }

  if (fs.existsSync(outputPath) && !force) {
    console.error(`Error: Output file already exists: ${outputPath}`);
    console.error('Pass --force to overwrite it. Paths are used as given.');
    process.exit(1);
  }

  try {
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

if (require.main === module) {
  main();
}

module.exports = { parseArgs, rejectIfUnreadable, HELP, main };
