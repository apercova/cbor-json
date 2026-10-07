# Improvements

Assessment of the application and its improvement backlog. P0 decoder
correctness, P1 file-safety, P3 UI accessibility, and P4 documentation work are
implemented on this branch. P2 engineering work remains open unless noted.

Audit date: 2026-10-06. `npm audit` on the lockfile: 3 critical, 80 high,
15 moderate, 5 low (103).

## Threat model

The UI decodes in the browser and does not send the file to a server.
Outbound links are GitHub and Buy Me a Coffee only. The CLI uses the local
paths passed by its operator and their operating-system permissions.

A malicious CBOR file can cause resource use or incorrect output for the person
who opens it. The CLI is a local tool. Treat decoded output as untrusted data;
never merge it into config, HTML, or a shell command.

The lockfile audit result is recorded above for its audit date. Recheck it with
`npm audit`; do not assume advisories are excluded from the deployed bundle
without checking the dependency tree. Avoid `npm audit fix --force`.

## Inventory

| Path | Role | Notes |
| --- | --- | --- |
| `src/index.tsx` | CRA entry | StrictMode wrapped in a render error boundary. |
| `src/App.tsx` | Screen switch | Upload panel or JSON panel, plus decoder settings for tag, timestamp, large integer, and map-key handling. |
| `src/components/FileUploadPanel.tsx` | Drop/file-picker upload | Drag-and-drop target plus keyboard-accessible button opening the hidden file input. |
| `src/hooks/useFileHandler.ts` | File input wiring | Rejects files over 100 MiB before `arrayBuffer()` and resets the input after selection. No extension check. |
| `src/utils/cborProcessor.ts` | Browser decode | Reads the file and transfers its buffer to a Web Worker. |
| `src/utils/decodeCbor.mjs` | Shared decoder | `cborg`, bounded depth, JSON conversion policy, stable errors, and date-tag formatting used by browser worker and CLI. |
| `src/components/JsonDisplayPanel.tsx` | CodeMirror view + save | "Large file" means formatted string length > 100000, not file bytes. |
| `src/utils/editorConfig.ts` | Editor setup | Escape collapses the selection. Imports `@codemirror/state`, which is not a direct dependency. |
| `src/constants/index.ts` | UI constants | Large-output threshold is 100,000 formatted JSON characters. |
| `bin/cbor2json.js` | CLI | Uses the shared decoder with epoch-second timestamp numbers by default and optional ISO output with `--fd` / `--tz`; includes a 100 MiB pre-read size check, required `--in`, strict flags, `--help`, and guarded overwrites. |
| `public/index.html` | Shell | References the included SVG favicon. Production CSP is injected at build time; host header files set CSP, Referrer-Policy, and X-Content-Type-Options. |
| `fixtures/rfc8949-appendix-a.json` | Decoder fixtures | RFC 8949 Appendix A byte vectors and expected JSON values. |
| `docs/DEPLOY.md` | Host guide | Concise instructions for the configured GitHub Pages, Vercel, and Netlify options. |
| Tests, CI | Tests present; no CI | RFC vectors, decoder policy, UI behavior, file safety, CLI safety, and CSP metadata tests exist. |

The browser and CLI use one decoder:

```
browser: File → cborProcessor.ts → Web Worker → decodeCbor.mjs → CodeMirror
CLI:     --in  → bin/cbor2json.js → decodeCbor.mjs (+ --fd / --tz) → write JSON
```

The UI uses the shared decoder's default epoch-second timestamp policy. Decoder
errors have stable codes; warnings are logged to the browser console and to CLI
stderr.

## Remaining documentation gaps

- WCAG 2.1 AA conformance has not been established; the implemented accessibility
  behaviors do not amount to a conformance audit.
- Components are not lazy-loaded; `App.tsx` imports both panels statically.
- There is no CI workflow. Run the documented local checks before merging.

## P0 — Decoder correctness (implemented on this branch)

`cborg` replaces `cbor-js` behind the shared `decodeCbor(bytes, options)`
function. The decoder copies input bytes, preflights nesting (maximum 128),
and enforces the shared 100 MiB limit. By default it rejects duplicate map keys,
including collisions after non-string-key coercion, undefined,
non-finite numbers, decimal/bigfloat tags, and unknown tags. Non-string map
keys are coerced to strings by default for compatibility; strict mode rejects
them. Byte strings and tags are represented explicitly with warnings; large
native integers are emitted as exact unquoted decimal JSON number tokens by
default. `largeIntegerMode: 'number'` opts into JavaScript number conversion
and warns if conversion changes the integer. `__proto__` remains a data key on a
null-prototype object during serialization. Timestamp tags become epoch-second
numbers by default. CLI `--fd` enables ISO 8601 strings with optional timezone
formatting through `--tz`; invalid timezones fail. The shared decoder can
preserve timestamp tags as explicit JSON objects in tagged mode.

CLI `--preserve-tags`, `--large-integer-mode exact|number`, and
`--strict-map-keys` expose the same tag, integer, and map-key policies as the
browser settings pane. Defaults match across both interfaces.

The browser calls the same decoder inside a Web Worker. RFC 8949 Appendix A
vectors and decoder policy cases live in `fixtures/` and
`src/utils/decodeCbor.node-test.mjs`. The unused Python `requirements.txt` and
`cbor-js` dependency have been removed.

`cborg` was selected in a focused integration spike: its byte-array support,
custom tag callbacks, typed map decoding, duplicate-key rejection, and strict
unknown-tag errors fit this converter's explicit JSON policy. No throughput
benchmark was run; the goal was correctness and predictable rejection.

## P1 — Safety around the file (implemented on this branch)

- [x] Reject files over 100 MiB before `arrayBuffer()` / `readFileSync`.
- [x] Reset the file input after selection so the same file can be chosen again.
- [x] Sanitize the download basename. Do not pass the raw upload name through to
  `saveAs` with `../` intact. Browsers usually strip this. Do it here too.
- [x] CLI: require `--in`, reject unknown flags, and provide `--help`. Existing
  `--out` paths require `--force`. Help and errors document that the CLI uses
  the operator's paths with their permissions.
- Keep decoded objects out of `dangerouslySetInnerHTML`, `eval`, and object
  merges. React text nodes are fine for the error string and the filename.
  Leave them as text.
- [x] Add a production CSP with `default-src 'self'`, reject inline scripts at
  build time, and provide Referrer-Policy and `X-Content-Type-Options: nosniff`
  host headers for Vercel and Netlify. GitHub Pages receives the CSP and
  Referrer-Policy meta tags; it cannot set the other response headers.
- [x] Turn production source maps off (`GENERATE_SOURCEMAP=false`).
- [x] Bind `npm start` to `127.0.0.1`, not a public interface.

P1 implementation files include `src/constants/limits.js`,
`src/utils/downloadName.ts`, `scripts/inject-csp.js`, `vercel.json`,
`public/_headers`, and `src/cli.safety.test.js`. Production build output is
checked for inline scripts before the CSP is inserted. The CSP permits inline
styles for the current input styling and CodeMirror behavior.

## P2 — Engineering hygiene (open)

- [x] Add a UI render-error test. Decoder vectors, UI behavior, and CLI safety
  coverage exist.
- Add CI.
- CI on pull request: `npm ci`, `npm run type-check`, `npm run lint`,
  `npm test`. Node 22.
- `engines` says `node >= 16`. Node 16 and 18 are end of life. Set `>=22`.
- Move `@types/*` and `typescript` to `devDependencies`. Add
  `@codemirror/state` as a direct dependency. `editorConfig.ts` imports it
  through a transitive package.
- Finish replacing remaining application `any` types with the JSON output
  type.
- `tsconfig` `target: es5` is older than the configured build targets. Review
  it as part of the toolchain move.
- Plan the move off Create React App. `react-scripts@5` is unmaintained and
  currently contributes legacy build tooling. Evaluate a current bundler such
  as Vite while keeping the component tree. Do not eject.

## P3 — UI behavior and accessibility

- [x] The upload control has a keyboard accessible button that opens the hidden
  file input; drag and drop remains available.
- [x] Loading status uses `aria-live`; the progress bar has indeterminate
  progress semantics. Decode errors use `role="alert"`.
- [x] Save, Open file, and Clear controls have accessible names.
- [x] `handleNewFile` opens the file dialog directly from the click handler.
- [x] Large-file warning text describes the 100,000-character formatted JSON
  threshold. Large-file mode uses CodeMirror's read-only extension.
- [x] Escape collapses the editor selection while keeping focus.
- [x] A React error boundary provides a recovery message for render errors.
- [x] `public/index.html` references the included SVG favicon.

## P4 — Docs (implemented)

- [x] Align repository names, deployment links, and host instructions with the
  current repository configuration.
- [x] Describe the security model, production CSP, file-size/runtime behavior,
  browser/CLI architecture, and actual deployment options without unsupported
  performance or conformance claims.
- [x] Document which CBOR types are emitted directly, rewritten, preserved as
  tagged objects, or rejected.
- [x] Document all settings, defaults, precedence, and reset behavior in the
  README.
- [x] Add settings for global tag preservation, timestamp formatting, and ISO
  timezone selection. Global tag preservation wraps all tags and overrides
  timestamp formatting; otherwise timestamps are epoch seconds (default) or
  ISO 8601 strings. ISO timezone selection is separately enabled, searchable,
  defaults to UTC, and resets to UTC when toggled or when timestamp format
  changes.
- [x] Add a settings pane toggle for map-key handling: coerce non-string keys
  to strings (default) or enable strict mode, which rejects those keys.
- [x] Add a settings pane toggle for large integer output: exact decimal JSON
  number tokens (default) or JavaScript Number conversion, with a warning when
  that mode changes an integer.

## Suggested order

1. [x] Shared decoder, byte-string policy, RFC fixtures, and size/depth caps.
2. [x] Wire UI and CLI through the decoder, run browser decoding in a worker,
   and remove unused Python/legacy decoder dependencies.
3. CI and remaining type cleanup.
4. [x] Accessibility and file-dialog behavior.
5. Leave Create React App. Re-run `npm audit` and keep the production
   dependency set separate from the dev-server set.
6. [x] Trim `docs/DEPLOY.md` and finish documentation cleanup.

## Do not do in the first pass

- `npm audit fix --force` or `npm run eject`.
- A redesign, dark mode, PWA, i18n, or analytics. These are new product scope.
- A backend for decoding. A server that accepts CBOR would expand the threat
  model to everyone on the internet.
