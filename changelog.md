# Changelog

2026-10-06: 
Improved file handling and security across the browser app and CLI.

- Raised the shared input limit to 100 MiB; oversized files are rejected before reading.
- Sanitized downloaded JSON filenames and reset the file input after selection.
- Hardened the CLI with required `--in`, strict flag validation, `--help`, and overwrite protection via `--force`.
- Added production CSP and host security headers, disabled production source maps, and bound the development server to localhost.
- Added safety tests and a 26-byte CBOR sample at `samples/small.cbor`.
- Updated the improvement assessment and Claude rules for implemented safeguards and testing expectations.
