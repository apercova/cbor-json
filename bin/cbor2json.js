#!/usr/bin/env node

/**
 * CLI to convert CBOR files to JSON using the shared decoder.
 * Usage: cbor2json --in <input.cbor> [--out <output.json>] [options]
 *
 * Paths are used as given. This process reads and writes those paths with
 * the permissions of the user who runs it. It does not confine writes to
 * the current directory.
 *
 * If --out is omitted, the output is saved to the current directory
 * with the input filename and .json extension. An existing output file
 * is left untouched unless --force is passed.
 *
 * Timestamp tags (0, 1) are represented as epoch seconds by default.
 * --fd (format-date): Format timestamps as ISO 8601 strings
 * --tz <tz>: Timezone for ISO formatted dates. Optional, defaults to UTC.
 *   Examples: UTC, -06:00, +05:30, America/Mexico_City
 * --preserve-tags: Preserve all CBOR tags as tagged JSON objects
 * --large-integer-mode <exact|number>: Choose exact integer tokens or Number conversion
 * --strict-map-keys: Reject maps with non-string keys
 */

const fs = require('fs');
const path = require('path');
const { fileTooLargeMessage, MAX_INPUT_BYTES } = require('../src/constants/limits');

const HELP = `Usage: cbor2json --in <input.cbor> [--out <output.json>] [options]

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
  --fd           Format timestamp tags (0, 1) as ISO 8601 strings
  --tz <tz>      Timezone for ISO timestamp strings (default UTC).
                 Examples: UTC, -06:00, +05:30, America/Mexico_City
  --preserve-tags
                 Preserve every CBOR tag as a tagged JSON object
  --large-integer-mode <mode>
                 Integer output mode: exact (default) or number. Number mode
                 may round values and writes a warning to stderr.
  --strict-map-keys
                 Reject maps containing non-string keys instead of coercing
                 those keys to strings
  --help, -h     Show this help

Unknown flags are an error.
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    inFile: null,
    outFile: null,
    timestampFormat: 'epoch',
    timezone: 'UTC',
    preserveTags: false,
    largeIntegerMode: 'exact',
    strictMapKeys: false,
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
      result.timestampFormat = 'iso';
    } else if (arg === '--tz') {
      result.timezone = requireValue(args, i, '--tz');
      i++;
    } else if (arg === '--preserve-tags') {
      result.preserveTags = true;
    } else if (arg === '--large-integer-mode') {
      const mode = requireValue(args, i, '--large-integer-mode');
      if (!['exact', 'number'].includes(mode)) {
        throw new Error(`--large-integer-mode must be exact or number; received: ${mode}`);
      }
      result.largeIntegerMode = mode;
      i++;
    } else if (arg === '--strict-map-keys') {
      result.strictMapKeys = true;
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

function deriveOutputPath(inputPath) {
  const basename = path.basename(inputPath, path.extname(inputPath));
  return path.join(process.cwd(), `${basename}.json`);
}

async function processCborToJson(inputPath, options = {}) {
  const {
    timestampFormat = 'epoch',
    timezone = 'UTC',
    preserveTags = false,
    largeIntegerMode = 'exact',
    strictMapKeys = false,
  } = options;
  const buffer = fs.readFileSync(inputPath);
  const { decodeCbor } = await import('../src/utils/decodeCbor.mjs');
  return decodeCbor(new Uint8Array(buffer), {
    timestampFormat,
    timezone,
    preserveTags,
    largeIntegerMode,
    strictMapKeys,
  });
}

async function main(argv = process.argv) {
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

  const {
    inFile,
    outFile,
    timestampFormat,
    timezone,
    preserveTags,
    largeIntegerMode,
    strictMapKeys,
    force,
  } = parsed;

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
    const result = await processCborToJson(inFile, {
      timestampFormat,
      timezone,
      preserveTags,
      largeIntegerMode,
      strictMapKeys,
    });
    result.warnings.forEach((warning) => console.error(`Warning: ${warning}`));
    fs.writeFileSync(outputPath, result.jsonText, 'utf8');

    console.log(`Converted ${inFile} -> ${outputPath}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = err && typeof err === 'object' && 'code' in err ? `${err.code}: ` : '';
    console.error(`Error: ${code}${msg}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, rejectIfUnreadable, HELP, main };
