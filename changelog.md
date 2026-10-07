# Changelog

2026-10-06:
Added CBOR decoder improvements and aligned output with compatibility and precision requirements.

- Replaced `cbor-js` with the shared `cborg` decoder for browser and CLI, including RFC vectors, depth/input limits, and safer CBOR-to-JSON handling.
- Timestamp tags now output epoch-second numbers by default, with ISO formatting and tagged preservation available through decoder options.
- Large native integers default to exact unquoted JSON number tokens; optional JavaScript `Number` conversion warns when it changes a value.
- Non-string map keys coerce to strings by default, with strict rejection available through decoder options.
- Added a settings pane for global tag representation, timestamp format and opt-in searchable timezone picker, large integer mode, and non-string map-key handling. Timezone resets to UTC when toggled or when timestamp format changes.
- Moved Powered by attributions and a copy of the footer links into the header help pane, alongside a brief About description.
- Moved Save, New, and Clear into matching header icon buttons. New remains available outside processing; New and Clear stay visible but disabled during file processing.
- Removed the output warning banner and logged decoder warnings to the browser console; decode errors remain in the output panel.
- Updated README and P4 backlog; type-check, lint, and all tests pass.

2026-10-06: 
Improved file handling and security across the browser app and CLI.

- Raised the shared input limit to 100 MiB; oversized files are rejected before reading.
- Sanitized downloaded JSON filenames and reset the file input after selection.
- Hardened the CLI with required `--in`, strict flag validation, `--help`, and overwrite protection via `--force`.
- Added production CSP and host security headers, disabled production source maps, and bound the development server to localhost.
- Added safety tests and a 26-byte CBOR sample at `samples/small.cbor`.
- Updated the improvement assessment and Claude rules for implemented safeguards and testing expectations.
