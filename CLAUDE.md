# CBOR to JSON Converter

Static React UI plus a local Node CLI (`bin/cbor2json.js`). CBOR is decoded
on the machine that has the file. The browser app does not upload it.

## Invariants

- Do not add network calls, analytics, or a server that accepts CBOR.
- The decoder is the product. The UI and the CLI call one function. Do not
  patch `src/utils/cborProcessor.ts` and `bin/cbor2json.js` separately.
- Decoded data is untrusted. Render it as text. Do not merge it into objects,
  HTML, or shell commands.
- Do not claim tests, CSP, accessibility, bundle size, or benchmarks unless
  a command in this repo produces that result.
- `requirements.txt` is not the runtime. The app is Node and the browser.

## How to change the code

- Change only the files the task needs. Match the surrounding component style.
- Prefer `npm ci`. Do not eject. Do not run `npm audit fix --force`.
- `tsconfig.json` includes `src` only. The CLI is plain Node and is not
  typechecked until that changes.
- Node for new work: 22.
- Known gaps and the order to fix them live in `docs/improvements.md`.
  Read that before a security, decoder, or architecture change.

## Layout

```
bin/cbor2json.js          CLI
src/utils/cborProcessor.ts  browser decode
src/components/           upload panel, JSON panel, loading indicator
src/hooks/useFileHandler.ts
docs/improvements.md      assessment and backlog
docs/DEPLOY.md            hosting notes (partially stale)
```

## Checks

```bash
npm run type-check
npm run lint
npm test -- --watchAll=false
```

There is no CI yet. Run the checks that the change can affect.
