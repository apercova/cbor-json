---
paths:
  - "src/utils/**"
  - "bin/**"
  - "fixtures/**"
---

# Decoder

- Copy bytes into a fresh `Uint8Array` before decode. Do not pass a view's
  `.buffer` to the decoder. That ignores `byteOffset` and `byteLength`.
- Byte strings must not become `{}`. Bignums must not escape as an uncaught
  `BigInt`. Unknown tags and invalid timezones must surface a warning or an
  error, not a silent UTC string.
- UI and CLI share one decode function. Date flags (`--fd`, `--tz`) live
  there too.
- Every decoder change adds or updates an RFC 8949 vector test.
- No new `any` on the decode result.
- Cap input size and nesting. Refuse with a clear message.
- Keep decoded values out of object merges, `eval`, and HTML.
